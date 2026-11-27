import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './estilos.css'
import { App } from './App'
import { esAltoCorto } from './logic/pantalla'

// ¿Se abrió desde el ícono de la pantalla de inicio? (iOS lo dice con navigator.standalone)
const instalada =
  (navigator as Navigator & { standalone?: boolean }).standalone === true ||
  window.matchMedia('(display-mode: standalone)').matches
if (instalada) document.documentElement.classList.add('instalada')

// En el iPhone, los botones solo se ven presionados (:active) si la página escucha los toques
document.addEventListener('touchstart', () => {}, { passive: true })

// Si iOS le da a la app menos alto que la pantalla, la barrita de inicio queda fuera
// y su espacio se le da al horario (los bloques quedan más altos y fáciles de tocar)
function revisarAlto() {
  const prueba = document.createElement('div')
  prueba.style.cssText = 'position:fixed;visibility:hidden;padding-top:env(safe-area-inset-top)'
  document.body.append(prueba)
  const arriba = parseFloat(getComputedStyle(prueba).paddingTop) || 0
  prueba.remove()
  const corta = esAltoCorto({ instalada, alto: window.innerHeight, pantalla: screen.height, arriba })
  document.documentElement.classList.toggle('corta', corta)
}
if (instalada) {
  revisarAlto()
  // iOS no siempre avisa cuando cambia el alto: después de cerrar el teclado la deja en 812
  // sin un "resize". Por eso también se revisa al soltar un campo y al volver a la app,
  // otra vez un momento después (lo que tarda el teclado en irse).
  const revisarYOtraVez = () => {
    revisarAlto()
    setTimeout(revisarAlto, 400)
    setTimeout(revisarAlto, 1200)
  }
  window.addEventListener('resize', revisarYOtraVez)
  window.visualViewport?.addEventListener('resize', revisarYOtraVez)
  document.addEventListener('focusout', revisarYOtraVez)
  document.addEventListener('visibilitychange', revisarYOtraVez)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
