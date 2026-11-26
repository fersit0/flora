// La pantalla principal: su semana completa, sin deslizar.
// Todo se dibuja desde los datos de la semana; aquí no hay ningún horario escrito.

import type { CSSProperties } from 'react'
import { Sol } from '../componentes/Sol'
import { useAhora } from '../componentes/useAhora'
import { DIAS, type Bloque, type Semana } from '../logic/semana'
import { etiquetaHora, horaDecimal, lineaAhora, posicion, queDiaEs } from '../logic/tiempo'

export function Horario({ semana }: { semana: Semana }) {
  const ahora = useAhora()
  const hoy = queDiaEs(ahora)
  const { inicio, fin } = semana.horas
  const horas = Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i)
  const linea = lineaAhora(horaDecimal(ahora), inicio, fin)

  return (
    <main className="pantalla">
      <div className="franja" aria-hidden="true" />

      <header className="cabecera">
        <h1>Flora</h1>
        <Sol />
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
                  <BloqueHorario key={`${b.de}-${b.nombre}`} bloque={b} inicio={inicio} fin={fin} />
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

function BloqueHorario({ bloque, inicio, fin }: { bloque: Bloque; inicio: number; fin: number }) {
  const { arriba, alto } = posicion(bloque.de, bloque.a, inicio, fin)
  const estilo = { '--arriba': `${arriba}%`, '--alto': `${alto}%` } as CSSProperties
  return (
    <div className={`bloque color-${bloque.color}`} style={estilo}>
      {bloque.emoji && <span className="emoji">{bloque.emoji}</span>}
      <span className="nombre">{bloque.nombre}</span>
    </div>
  )
}
