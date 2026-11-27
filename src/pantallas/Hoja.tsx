// La hoja de un espacio: sube al tocar un bloque. Arriba, su nombre, los días en que toca,
// el detalle del bloque que tocó y la línea "por cada cosa"; adentro, sus pendientes,
// su lista de contenidos o sus ideas.

import { Contenidos } from '../componentes/Contenidos'
import { HojaQueSube } from '../componentes/HojaQueSube'
import { Ideas } from '../componentes/Ideas'
import { Pendientes } from '../componentes/Pendientes'
import { useEspacio } from '../componentes/useEspacio'
import type { Guardado } from '../datos/guardado'
import { diasDeEspacio, resumenDeEspacio, type Espacio, type Semana } from '../logic/semana'

interface Props {
  semana: Semana
  espacio: Espacio
  /** El detalle del bloque que se tocó (por ejemplo "diseño de campañas") */
  detalle?: string
  guardado: Guardado
  onCerrada: () => void
}

export function Hoja({ semana, espacio, detalle, guardado, onCerrada }: Props) {
  const [datos, cambiar] = useEspacio(guardado, espacio.id)
  const dias = diasDeEspacio(semana, espacio.id)
  const resumen = resumenDeEspacio(semana, espacio)
  // Lo que lleva escrito en el campo, aparte en su semana y en la de ejemplo
  const borrador = `${guardado.nombre}:${espacio.id}`

  return (
    <HojaQueSube
      titulo={
        <>
          {espacio.emoji && <span className="hoja-emoji">{espacio.emoji}</span>}
          {espacio.nombre}
        </>
      }
      junto={dias.length > 0 && <span className={`pastilla color-${espacio.color}`}>{dias.join(' · ')}</span>}
      debajo={
        <>
          {detalle && <p className="hoja-detalle">{detalle}</p>}
          {resumen && <p className="hoja-resumen">{resumen}</p>}
        </>
      }
      onCerrada={onCerrada}
    >
      {() =>
        datos &&
        (espacio.tipo === 'ideas' ? (
          <Ideas datos={datos} cambiar={cambiar} borrador={borrador} />
        ) : (
          <>
            <Pendientes datos={datos} cambiar={cambiar} nombre={espacio.nombre} borrador={borrador} />
            {espacio.tipo === 'cliente' && <Contenidos datos={datos} cambiar={cambiar} />}
          </>
        ))
      }
    </HojaQueSube>
  )
}
