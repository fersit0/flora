import { useCallback, useState } from 'react'
import { AvisoVersion } from './componentes/AvisoVersion'
import { abrirGuardado } from './datos/guardado'
import { contenidoDeEjemplo, semanaDeEjemplo } from './datos/ejemplo'
import { Hoja } from './pantallas/Hoja'
import { Horario } from './pantallas/Horario'

// Por ahora siempre se ve la semana de ejemplo, y lo que se escribe en sus hojas
// se guarda aparte ("flora-ejemplo"). En la fase 3 entra "pega aquí tu semana",
// y su semana se guarda en "flora", sin mezclarse con el ejemplo.
const semana = semanaDeEjemplo()
const guardado = abrirGuardado('flora-ejemplo', contenidoDeEjemplo)

// Si la página se recargó con una hoja abierta, esa marca del historial ya no sirve
if (history.state?.hoja) history.replaceState(null, '')

export function App() {
  const [abierta, setAbierta] = useState<string | null>(null)
  const espacio = semana.espacios.find((e) => e.id === abierta)
  const alCerrar = useCallback(() => setAbierta(null), [])

  return (
    <>
      <Horario semana={semana} onAbrir={setAbierta} tapado={espacio !== undefined} />
      {espacio && <Hoja key={espacio.id} semana={semana} espacio={espacio} guardado={guardado} onCerrada={alCerrar} />}
      <AvisoVersion />
    </>
  )
}
