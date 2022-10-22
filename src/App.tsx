import { useEffect } from 'react'
import reactLogo from './assets/react.svg'
import { useStableO } from 'fp-ts-react-stable-hooks'
import * as O from 'fp-ts/Option'
import './App.css'
import { pipe } from 'fp-ts/function'

/* 
    Promises by default return Promise<any>.
    How can we be sure that what we are fetching from the server adheres to the data schema we expect?

    Using only TS we have the following choices:
    1. write a type for the response object and take a leap of faith that we are doing it right
    2. write a small typeguard and validate the response object against it
  */

type PokemonResponse = {
  readonly name: string
  readonly sprites: {
    readonly back_default: string
    readonly back_shiny: string
    readonly front_default: string
    readonly front_shiny: string
  }
}

/* 
  Implementation for 1: 
    Tell TS to chill as the API will return a PokemonResponse for sure
*/
const __first_getGengarImage = async (): Promise<PokemonResponse> =>
  fetch('https://pokeapi.co/api/v2/pokemon/gengar')
    .then((_) => _.json())
    .catch((e) => console.error(`Errors while fetching: `, e))

/* 
  Implementation for 2: 
    Write a typeguard for the object returned by the Promise.                         
    If it succeeds then we know for sure that the API retuned what we expected, 
    otherwise rise a generic DecodingFailure error.
    Note: I don't think there's an easy way of finding out _which_ field broke the type.
*/
const isPokemonResponse = (u: unknown): u is PokemonResponse =>
  typeof (u as PokemonResponse).name === 'string' &&
  typeof (u as PokemonResponse).sprites &&
  typeof (u as PokemonResponse).sprites.back_default === 'string' &&
  typeof (u as PokemonResponse).sprites.back_shiny === 'string' &&
  typeof (u as PokemonResponse).sprites.front_shiny === 'string' &&
  typeof (u as PokemonResponse).sprites.front_default === 'string'

const getGengarImage = async () => {
  const res = await fetch('https://pokeapi.co/api/v2/pokemon/gengar')
    .then((_) => _.json())
    .catch((e) => console.error(`Errors while fetching: `, e))
  if (isPokemonResponse(res)) {
    return res
  } else {
    throw new Error('DecodingFailure')
  }
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
  const [pokemonResponse, setPokemonResponse] = useStableO<PokemonResponse>(
    O.none,
  )

  useEffect(() => {
    getGengarImage().then((res) => setPokemonResponse(O.some(res)))
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
        O.match(
          () => <p className="highlight">Loading or Error</p>,
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
