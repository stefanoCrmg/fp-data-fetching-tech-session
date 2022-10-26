import reactLogo from './assets/react.svg'
import * as RTE from './fp/ReaderTaskEither'
import * as TE from './fp/TaskEither'
import './App.css'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import * as RD from '@devexperts/remote-data-ts'
import { withAuthenticationRequired } from '@auth0/auth0-react'
import { fetchAndValidate, FetchError, GenericFetchError } from './fetch'
import { AuthenticatedEnv, ErrorWithStaleData, useQueryRemoteData } from './utils/useRemoteQuery'
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



/* Why would anyone ever use an RTE instead of a TE? */

/* Constructing a TE with a dependency */
const _fetchPokemon = (pokemonName: string) => (backendURL: string) => fetchAndValidate(PokemonResponse, `${backendURL}/pokemon/${pokemonName}`)

type TwoPokemonResponse = {
  gengar: PokemonResponse,
  blissey: PokemonResponse
}
const twoPokemons: TE.TaskEither<FetchError, TwoPokemonResponse> = pipe(
  _fetchPokemon('gengar')('https://pokeapi.co/api/v2/'),
  TE.bindTo('gengar'),
  TE.apS('blissey', _fetchPokemon('blissey')('https://pokeapi.co/api/v2/')
))

const esegui = twoPokemons()

/* Constructing an RTE with the depedency stored as Reader context */
type ContestoEsecuzione = {backendURL: string}
const _fetchPokemonConRTE = (pokemonName: string): RTE.ReaderTaskEither<ContestoEsecuzione, FetchError, PokemonResponse> => pipe(
  RTE.ask<ContestoEsecuzione>(),
  RTE.chainTaskEitherK(({ backendURL}) => fetchAndValidate(PokemonResponse, `${backendURL}/pokemon/${pokemonName}`))
)

const twoPokemonsConRTE: RTE.ReaderTaskEither<ContestoEsecuzione, FetchError, TwoPokemonResponse> = pipe(
  _fetchPokemonConRTE('gengar'),
  RTE.bindTo('gengar'),
  RTE.apS('blissey', _fetchPokemonConRTE('blissey'))
)

const eseguiRTE = twoPokemonsConRTE({ backendURL: 'https://pokeapi.co/api/v2/'})()

const fetchPokemon = (pokemonName: string): RTE.ReaderTaskEither<
FrontendEnv & AuthenticatedEnv,
FetchError,
PokemonResponse
> => RTE.asksTaskEither<
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
      fetchAndValidate(PokemonResponse, `${backendURL}/pokemon/${pokemonName}`, {
        headers: { authorization: `Bearer ${accessToken}` },
      }),
    ),
  ),
)

type PokeErrors = ErrorWithStaleData<FetchError, PokemonResponse>
const fetchMultiplePokemons = (): RD.RemoteData<PokeErrors, [PokemonResponse, PokemonResponse]> => {
  const gengarQry = useQueryRemoteData(['pokemon-gengar'], () => fetchPokemon('gengar'))
  const blisseyQry = useQueryRemoteData(['pokemon-blissey'], () => fetchPokemon('blissey'))

  return RD.combine(gengarQry, blisseyQry)
}

const MainComponent: React.FC = () => {
  // const query = useQueryRemoteData(['pokemon-gengar'], () => fetchPokemon('gengar'))

  const multiPokemons = fetchMultiplePokemons()
  return (
    <div>
      {pipe(
        multiPokemons,
        RD.fold3(
          () => <p className="highlight">Loading</p>,
          (e) => <p className="highlight">Error: {JSON.stringify(e.error)}</p>,
          ([first, second]) => (
            <div>
              <PokemonComponent
              imageUrl={first.sprites.front_shiny}
              name={first.name}
            />
            <PokemonComponent
              imageUrl={second.sprites.front_shiny}
              name={second.name}
            />
            </div>
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
