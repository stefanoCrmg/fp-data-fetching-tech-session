import * as RD from '@devexperts/remote-data-ts'
import * as O from 'fp-ts/Option'
import { match } from 'ts-pattern'
import { QueryKey } from '@tanstack/query-core'
import {
  QueryFunctionContext,
  RefetchOptions,
  RefetchQueryFilters,
  useQuery,
  UseQueryOptions,
} from '@tanstack/react-query'
import * as RTE from '../fp/ReaderTaskEither'
import { FrontendEnv } from './frontendEnv'
import { pipe } from 'fp-ts/function'
import { GetTokenSilentlyOptions, useAuth0 } from '@auth0/auth0-react'
import { GetTokenSilentlyVerboseResponse } from '@auth0/auth0-spa-js'

export type ErrorWithStaleData<E, A> = {
  readonly error: E
  readonly staleData: O.Option<A>
  readonly refetch: (options?: RefetchOptions & RefetchQueryFilters<A>) => void
}

export type AuthenticatedEnv = {
  getAccessTokenSilently: { (
    options: GetTokenSilentlyOptions & { detailedResponse: true }
  ): Promise<GetTokenSilentlyVerboseResponse>;
  (options?: GetTokenSilentlyOptions): Promise<string>;
  (options: GetTokenSilentlyOptions): Promise<
    GetTokenSilentlyVerboseResponse | string
  >;}
}

const unwrapQueryFn =
  <T, E, Key extends QueryKey = QueryKey>(
    r: FrontendEnv & AuthenticatedEnv,
    queryFn: (
      context: QueryFunctionContext<Key>,
    ) => RTE.ReaderTaskEither<FrontendEnv & AuthenticatedEnv, E, T>,
  ) =>
  (context: QueryFunctionContext<Key>): Promise<T> =>
    pipe(queryFn(context), RTE.runReaderUnsafeUnwrap(r))

export const useQueryRemoteData = <
  QueryFnData,
  E,
  A = QueryFnData,
  Key extends QueryKey = QueryKey,
>(
  queryKey: Key,
  queryFn: (
    context: QueryFunctionContext<Key>,
  ) => RTE.ReaderTaskEither<FrontendEnv & AuthenticatedEnv, E, QueryFnData>,
  options?: UseQueryOptions<QueryFnData, E, A, Key>,
): RD.RemoteData<ErrorWithStaleData<E, A>, A> => {
  const { getAccessTokenSilently } = useAuth0()
  const _queryFn = unwrapQueryFn({...FrontendEnv, getAccessTokenSilently }, queryFn)
  const query = useQuery(queryKey, _queryFn, options)

  return match(query)
    .with({ status: 'success' }, ({ data }) => RD.success(data))
    .with({ status: 'error' }, ({ error, data, refetch }) =>
      RD.failure({ error, refetch, staleData: O.fromNullable(data) }),
    )
    .with({ status: 'loading' }, () => RD.pending)
    .exhaustive()
}
