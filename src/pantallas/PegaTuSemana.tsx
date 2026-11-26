// La primera vez que abre la app: todavía no hay semana en el teléfono.
// Pega aquí el texto de su semana (o un respaldo, que trae también sus listas) y listo.

import { PegarTexto } from '../componentes/PegarTexto'
import { Sol } from '../componentes/Sol'

export function PegaTuSemana({ onListo }: { onListo: (texto: string) => Promise<boolean> }) {
  return (
    <main className="primera">
      <div className="franja" aria-hidden="true" />
      <header className="cabecera">
        <h1>Flora</h1>
        <Sol />
      </header>

      <div className="primera-contenido">
        <h2 className="primera-titulo">pega aquí tu semana</h2>
        <PegarTexto etiqueta="tu semana" error="ese texto no lo pude leer." onListo={onListo} />
        <a className="enlace ver-ejemplo" href="?demo=1">
          ver ejemplo
        </a>
      </div>
    </main>
  )
}
