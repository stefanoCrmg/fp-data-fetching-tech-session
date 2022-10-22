import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'

/* 
    Promises by default return Promise<any>.
    How can we be sure that what we are fetching from the server adheres to the data schema we expect?

    Using only TS we have the following choices:
    1. write a type for the response object and take a leap of faith that we are doing it right
    2. write a small typeguard and validate the response object against it
  */

const getDittoImage = async () =>
  fetch('https://pokeapi.co/api/v2/pokemon/ditto')
    .then((_) => _.json())
    .catch((e) => console.error(`Errors while fetching: `, e))

const PokemonComponent: React.FC<{ imageUrl: string }> = ({ imageUrl }) => (
  <div className="pokemonImage__container">
    <img className="pokemonImage__content" src={imageUrl} />
    <div className="pokemonNames">
      <p className="highlight">en: Gengar</p>
      <p className="highlight">jp: ゲンガー</p>
    </div>
  </div>
)
function App() {
  const [count, setCount] = useState(0)
  const [imageUrl, setImageUrl] = useState('')

  useEffect(() => {
    getDittoImage()
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
      <h1>Vite + React</h1>
      <PokemonComponent imageUrl="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/94.png" />
      <div className="card">
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  )
}

export default App
