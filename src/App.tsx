import { AvisoVersion } from './componentes/AvisoVersion'
import { semanaDeEjemplo } from './datos/ejemplo'
import { Horario } from './pantallas/Horario'

// Fase 1: siempre se ve la semana de ejemplo.
// En la fase 3 entra "pega aquí tu semana" y lo guardado en el teléfono.
const semana = semanaDeEjemplo()

export function App() {
  return (
    <>
      <Horario semana={semana} />
      <AvisoVersion />
    </>
  )
}
