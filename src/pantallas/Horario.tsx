// La pantalla principal: su semana completa, sin deslizar.
// Todo se dibuja desde los datos de la semana; aquí no hay ningún horario escrito.

import type { CSSProperties } from 'react'
import { Sol } from '../componentes/Sol'
import { useAhora } from '../componentes/useAhora'
import { DIAS, type Bloque, type Semana } from '../logic/semana'
import { etiquetaHora, horaDecimal, lineaAhora, posicion, queDiaEs } from '../logic/tiempo'

interface Props {
  semana: Semana
  /** Al tocar un bloque que abre un espacio */
  onAbrir: (espacio: string) => void
  /** Al tocar el solecito */
  onAjustes: () => void
  /** Mientras hay una hoja abierta, el horario de atrás no se puede tocar */
  tapado: boolean
}

export function Horario({ semana, onAbrir, onAjustes, tapado }: Props) {
  const ahora = useAhora()
  const hoy = queDiaEs(ahora)
  const { inicio, fin } = semana.horas
  const horas = Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i)
  const linea = lineaAhora(horaDecimal(ahora), inicio, fin)

  return (
    <main className="pantalla" inert={tapado} style={{ '--horas': fin - inicio } as CSSProperties}>
      <div className="franja" aria-hidden="true" />

      <header className="cabecera">
        <h1>Flora</h1>
        {/* El solecito es el botón de ajustes; no dice "ajustes" */}
        <button type="button" className="boton-sol" aria-label="ajustes" onClick={onAjustes}>
          <Sol />
        </button>
      </header>

      <div className="dias">
        {DIAS.map((dia) => (
          <div key={dia} className={hoy.dia === dia ? 'dia hoy' : 'dia'}>
            {dia}
          </div>
        ))}
      </div>

      <div className="cuadricula">
        {horas.map((h) => {
          const arriba = posicion(h, h, inicio, fin).arriba
          return (
            <div key={h} className="linea-hora" style={{ top: `${arriba}%` }}>
              {h < fin && <span className="hora">{etiquetaHora(h)}</span>}
            </div>
          )
        })}

        <div className="columnas">
          {DIAS.map((dia) => {
            const esHoy = hoy.dia === dia
            return (
              <div key={dia} className={esHoy ? 'columna hoy' : 'columna'} data-dia={dia}>
                {semana.dias[dia].map((b) => (
                  <BloqueHorario key={`${b.de}-${b.nombre}`} bloque={b} inicio={inicio} fin={fin} onAbrir={onAbrir} />
                ))}
                {esHoy && linea !== null && <div className="ahora" style={{ top: `${linea}%` }} />}
              </div>
            )
          })}
        </div>
      </div>

      <div className="finde">
        <div className={hoy.dia === 'sab' ? 'finde-dia hoy' : 'finde-dia'}>
          <h2>sábado</h2>
          <p>{semana.finde.sab.corto}</p>
        </div>
        <div className={hoy.dia === 'dom' ? 'finde-dia hoy' : 'finde-dia'}>
          <h2>domingo</h2>
          <p>{semana.finde.dom.corto}</p>
        </div>
      </div>
    </main>
  )
}

interface PropsBloque {
  bloque: Bloque
  inicio: number
  fin: number
  onAbrir: (espacio: string) => void
}

function BloqueHorario({ bloque, inicio, fin, onAbrir }: PropsBloque) {
  const { arriba, alto } = posicion(bloque.de, bloque.a, inicio, fin)
  const estilo = { '--arriba': `${arriba}%`, '--alto': `${alto}%` } as CSSProperties
  const clase = `bloque color-${bloque.color}`
  const contenido = (
    <>
      {bloque.emoji && <span className="emoji">{bloque.emoji}</span>}
      <span className="nombre">{bloque.nombre}</span>
    </>
  )

  // Solo es botón si abre algo. Las ligas llegan en la fase 4 y las comidas después;
  // mientras, esos bloques no son botones (nunca un botón que no hace nada).
  const espacio = bloque.abre && 'espacio' in bloque.abre ? bloque.abre.espacio : null
  if (espacio) {
    return (
      <button type="button" className={clase} style={estilo} onClick={() => onAbrir(espacio)}>
        {contenido}
      </button>
    )
  }
  return (
    <div className={clase} style={estilo}>
      {contenido}
    </div>
  )
}
