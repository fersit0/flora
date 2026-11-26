import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './estilos.css'
import { App } from './App'

// ¿Se abrió desde el ícono de la pantalla de inicio? (iOS lo dice con navigator.standalone)
const instalada =
  (navigator as Navigator & { standalone?: boolean }).standalone === true ||
  window.matchMedia('(display-mode: standalone)').matches
if (instalada) document.documentElement.classList.add('instalada')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
