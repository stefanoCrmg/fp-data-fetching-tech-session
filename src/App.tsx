import { useEffect } from 'react'
import reactLogo from './assets/react.svg'
import { useStableE } from 'fp-ts-react-stable-hooks'
import * as E from 'fp-ts/Either'
import './App.css'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { formatValidationErrors } from 'io-ts-reporters'

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

const getGengarImage = async (): Promise<
  E.Either<t.Errors, PokemonResponse>
> => {
  const res = await fetch('https://pokeapi.co/api/v2/pokemon/gengar')
    .then((_) => _.json())
    .catch((e) => console.error(`Errors while fetching: `, e))

  return PokemonResponse.decode(res)
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
function App() {
  const [pokemonResponse, setPokemonResponse] = useStableE<
    t.Errors,
    PokemonResponse
  >(E.left([]))

  useEffect(() => {
    getGengarImage().then((res) => setPokemonResponse(res))
  }, [])

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
      {pipe(
        pokemonResponse,
        E.match(
          (err) => (
            <p className="highlight">
              {JSON.stringify(formatValidationErrors(err))}
            </p>
          ),
          (pokemon) => (
            <PokemonComponent
              imageUrl={pokemon.sprites.front_shiny}
              name={pokemon.name}
            />
          ),
        ),
      )}
    </div>
  )
}

export default App
