import { useEffect, useState } from 'react'

/** La fecha y hora de ahorita. Se actualiza cada 30 segundos y al volver a la app. */
export function useAhora(): Date {
  const [ahora, setAhora] = useState(() => new Date())
  useEffect(() => {
    const actualizar = () => setAhora(new Date())
    const reloj = window.setInterval(actualizar, 30_000)
    document.addEventListener('visibilitychange', actualizar)
    return () => {
      window.clearInterval(reloj)
      document.removeEventListener('visibilitychange', actualizar)
    }
  }, [])
  return ahora
}
