// Cuando hay una versión nueva de Flora, sale un aviso chiquito arriba.
// Al tocarlo se actualiza; lo guardado en el teléfono no se toca.

import { useRegisterSW } from 'virtual:pwa-register/react'

export function AvisoVersion() {
  const {
    needRefresh: [hayNueva],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_url, registro) {
      // En el iPhone la app se queda abierta días: al volver a ella, revisa si hay algo nuevo
      if (!registro) return
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registro.update().catch(() => {})
      })
    },
  })

  if (!hayNueva) return null
  return (
    <button type="button" className="aviso-version" onClick={() => updateServiceWorker(true)}>
      <span>algo nuevo · toca aquí</span>
    </button>
  )
}
