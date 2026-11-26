// La pantalla principal: su semana completa, sin deslizar.
// Todo se dibuja desde los datos de la semana; aquí no hay ningún horario escrito.

import type { CSSProperties } from 'react'
import { Sol } from '../componentes/Sol'
import { useAhora } from '../componentes/useAhora'
import { DIAS, direccionDeLiga, type Bloque, type Semana, type TextoFinde } from '../logic/semana'
import { etiquetaHora, horaDecimal, lineaAhora, posicion, queDiaEs } from '../logic/tiempo'
import { NOMBRE_FINDE, type DiaFinde } from './Finde'

/** Lo que se abre en una hoja al tocarlo: un espacio, sábado o domingo, o los ajustes */
export type QueAbre = { espacio: string } | { finde: DiaFinde } | { ajustes: true }

interface Props {
  semana: Semana
  /** Al tocar un bloque con hoja, sábado, domingo o el solecito */
  onAbrir: (que: QueAbre) => void
  /** Mientras hay una hoja abierta, el horario de atrás no se puede tocar */
  tapado: boolean
}

export function Horario({ semana, onAbrir, tapado }: Props) {
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
        <button type="button" className="boton-sol" aria-label="ajustes" onClick={() => onAbrir({ ajustes: true })}>
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
                  <BloqueHorario
                    key={`${b.de}-${b.nombre}`}
                    bloque={b}
                    liga={direccionDeLiga(semana, b.abre)}
                    inicio={inicio}
                    fin={fin}
                    onAbrir={onAbrir}
                  />
                ))}
                {esHoy && linea !== null && <div className="ahora" style={{ top: `${linea}%` }} />}
              </div>
            )
          })}
        </div>
      </div>

      <div className="finde">
        {(['sab', 'dom'] as const).map((dia) => (
          <FindeDia
            key={dia}
            dia={dia}
            texto={semana.finde[dia]}
            hoy={hoy.dia === dia}
            onAbrir={() => onAbrir({ finde: dia })}
          />
        ))}
      </div>
    </main>
  )
}

interface PropsFinde {
  dia: DiaFinde
  texto: TextoFinde
  hoy: boolean
  onAbrir: () => void
}

/** Sábado o domingo: el texto corto; al tocarlo, el largo (si no hay texto, no es botón) */
function FindeDia({ dia, texto, hoy, onAbrir }: PropsFinde) {
  const clase = hoy ? 'finde-dia hoy' : 'finde-dia'
  const contenido = (
    <>
      <span className="finde-nombre">{NOMBRE_FINDE[dia]}</span>
      <span className="finde-corto">{texto.corto}</span>
    </>
  )
  if (!texto.largo) return <div className={clase}>{contenido}</div>
  return (
    <button type="button" className={clase} onClick={onAbrir}>
      {contenido}
    </button>
  )
}

interface PropsBloque {
  bloque: Bloque
  /** A dónde lleva su liga, o null si no tiene */
  liga: string | null
  inicio: number
  fin: number
  onAbrir: (que: QueAbre) => void
}

function BloqueHorario({ bloque, liga, inicio, fin, onAbrir }: PropsBloque) {
  const { arriba, alto } = posicion(bloque.de, bloque.a, inicio, fin)
  const estilo = { '--arriba': `${arriba}%`, '--alto': `${alto}%` } as CSSProperties
  const clase = `bloque color-${bloque.color}`
  const contenido = (
    <>
      {bloque.emoji && <span className="emoji">{bloque.emoji}</span>}
      <span className="nombre">{bloque.nombre}</span>
    </>
  )

  // Solo se puede tocar si abre algo: su hoja o su liga. Una liga sin dirección
  // y las comidas (llegan después) no se pueden tocar: nunca un botón que no hace nada.
  const espacio = bloque.abre && 'espacio' in bloque.abre ? bloque.abre.espacio : null
  if (espacio) {
    return (
      <button type="button" className={clase} style={estilo} onClick={() => onAbrir({ espacio })}>
        {contenido}
      </button>
    )
  }
  if (liga) {
    return (
      <a className={clase} style={estilo} href={liga}>
        {contenido}
      </a>
    )
  }
  return (
    <div className={clase} style={estilo}>
      {contenido}
    </div>
  )
}
