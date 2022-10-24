import reactLogo from './assets/react.svg'
import * as RTE from './fp/ReaderTaskEither'
import * as TE from './fp/TaskEither'
import './App.css'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import * as RD from '@devexperts/remote-data-ts'
import { withAuthenticationRequired } from '@auth0/auth0-react'
import { fetchAndValidate, FetchError, GenericFetchError } from './fetch'
import { AuthenticatedEnv, useQueryRemoteData } from './utils/useRemoteQuery'
import { FrontendEnv } from './utils/frontendEnv'

/* 
  Alternative solution: use a schema library to validate the response of the fetch
  */

const PokemonResponse = t.readonly(
  t.type({
    name: t.string,
    sprites: t.readonly(
      t.type({
        back_default: t.string,
        back_shiny: t.string,
        front_default: t.string,
        front_shiny: t.string,
      }),
    ),
  }),
  'PokemonResponse',
)
type PokemonResponse = t.OutputOf<typeof PokemonResponse>
type PokemonComponent = {
  readonly imageUrl: string
  readonly name: string
}
const PokemonComponent: React.FC<PokemonComponent> = ({ imageUrl, name }) => (
  <div className="pokemonImage__container">
    <img className="pokemonImage__content" src={imageUrl} />
    <div className="pokemonNames">
      <p className="highlight">EN: {name}</p>
      <p className="highlight">JP: ゲンガー</p>
    </div>
  </div>
)

const fetchGengar: RTE.ReaderTaskEither<
  FrontendEnv & AuthenticatedEnv,
  FetchError,
  PokemonResponse
> = RTE.asksTaskEither<
  FrontendEnv & AuthenticatedEnv,
  FetchError,
  PokemonResponse
>(({ backendURL, getAccessTokenSilently }) =>
  pipe(
    TE.tryCatch(
      () => getAccessTokenSilently(),
      (e) => GenericFetchError({ message: JSON.stringify(e) }),
    ),
    TE.chain((accessToken) =>
      fetchAndValidate(PokemonResponse, `${backendURL}/pokemon/gengar`, {
        headers: { authorization: `Bearer ${accessToken}` },
      }),
    ),
  ),
)

const MainComponent: React.FC = () => {
  const query = useQueryRemoteData(['pokemon-gengar'], () => fetchGengar)

  return (
    <div>
      {pipe(
        query,
        RD.fold3(
          () => <p className="highlight">Loading</p>,
          (e) => <p className="highlight">Error: {JSON.stringify(e.error)}</p>,
          (data) => (
            <PokemonComponent
              imageUrl={data.sprites.front_shiny}
              name={data.name}
            />
          ),
        ),
      )}
    </div>
  )
}

function App() {
  return (
    <div className="App">
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <div>{withAuthenticationRequired(MainComponent)({})}</div>
    </div>
  )
}

export default App
