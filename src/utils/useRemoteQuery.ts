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
import * as RTE from '@fp/ReaderTaskEither'
import { FrontendEnv } from './frontendEnv'
import { pipe } from 'fp-ts/function'

type ErrorWithStaleData<E, A> = {
  readonly error: E
  readonly staleData: O.Option<A>
  readonly refetch: (options?: RefetchOptions & RefetchQueryFilters<A>) => void
}

const unwrapQueryFn =
  <T, E, Key extends QueryKey = QueryKey>(
    r: FrontendEnv,
    queryFn: (
      context: QueryFunctionContext<Key>,
    ) => RTE.ReaderTaskEither<FrontendEnv, E, T>,
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
  ) => RTE.ReaderTaskEither<FrontendEnv, E, QueryFnData>,
  options?: UseQueryOptions<QueryFnData, E, A, Key>,
): RD.RemoteData<ErrorWithStaleData<E, A>, A> => {
  const _queryFn = unwrapQueryFn(FrontendEnv, queryFn)
  const query = useQuery(queryKey, _queryFn, options)

  return match(query)
    .with({ status: 'success' }, ({ data }) => RD.success(data))
    .with({ status: 'error' }, ({ error, data, refetch }) =>
      RD.failure({ error, refetch, staleData: O.fromNullable(data) }),
    )
    .with({ status: 'loading' }, () => RD.pending)
    .exhaustive()
}
