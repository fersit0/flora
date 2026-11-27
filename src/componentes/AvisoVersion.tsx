// Cuando hay una versión nueva de Flora, sale un aviso chiquito arriba.
// Al tocarlo se actualiza; lo guardado en el teléfono no se toca.

import { useRef } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

/** ms: si para entonces no se recargó sola, se recarga aquí */
const ULTIMO_RECURSO = 3000

export function AvisoVersion() {
  const registro = useRef<ServiceWorkerRegistration | undefined>(undefined)
  const {
    needRefresh: [hayNueva],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_url, r) {
      registro.current = r
      // En el iPhone la app se queda abierta días: al volver a ella, revisa si hay algo nuevo
      if (!r) return
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') r.update().catch(() => {})
      })
    },
  })

  const actualizando = useRef(false)
  function actualizar() {
    if (actualizando.current) return
    actualizando.current = true
    // En el iPhone no siempre llega el aviso de que la versión nueva ya tomó el control
    // (en Chrome sí). Por eso también se recarga aquí en cuanto la nueva queda activa,
    // y si eso no se alcanza a ver, a los 3 segundos (si para entonces ya no hay una esperando).
    const nueva = registro.current?.waiting
    nueva?.addEventListener('statechange', () => {
      if (nueva.state === 'activated') location.reload()
    })
    setTimeout(() => {
      if (!registro.current?.waiting) location.reload()
      else actualizando.current = false
    }, ULTIMO_RECURSO)
    void updateServiceWorker(true)
  }

  if (!hayNueva) return null
  return (
    <button type="button" className="aviso-version" onClick={actualizar}>
      <span>algo nuevo · toca aquí</span>
    </button>
  )
}
