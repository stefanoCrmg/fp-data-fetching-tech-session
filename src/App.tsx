import reactLogo from './assets/react.svg'
import * as E from './fp/Either'
import './App.css'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { match } from 'ts-pattern'
import { useQuery } from '@tanstack/react-query'

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

const getGengarImage = async (): Promise<PokemonResponse> => {
  const res = await fetch('https://pokeapi.co/api/v2/pokemon/gengar')
    .then((_) => _.json())
    .catch((e) => console.error(`Errors while fetching: `, e))

  return pipe(PokemonResponse.decode(res), E.unsafeUnwrap)
}

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

await createOptions()

function App() {
  const query = useQuery<PokemonResponse>(['pokemon-gengar'], getGengarImage)

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
      {match(query)
        .with({ status: 'loading' }, () => <p className="highlight">Loading</p>)
        .with({ status: 'error' }, (e) => (
          <p className="highlight">Error: {JSON.stringify(e.error)}</p>
        ))
        .with({ status: 'success' }, ({ data }) => (
          <PokemonComponent
            imageUrl={data.sprites.front_shiny}
            name={data.name}
          />
        ))
        .exhaustive()}
    </div>
  )
}

export default App
