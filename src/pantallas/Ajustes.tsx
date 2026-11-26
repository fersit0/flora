// Ajustes: se llega tocando el solecito. Copiar el respaldo de todo, pegar un respaldo
// para que todo regrese como estaba, y pegar una semana nueva.
// En la semana de ejemplo no se toca nada de lo suyo: solo lleva de regreso a su semana.

import { useEffect, useState } from 'react'
import { copiarTexto } from '../componentes/copiar'
import { HojaQueSube } from '../componentes/HojaQueSube'
import { PegarTexto } from '../componentes/PegarTexto'
import type { Guardado } from '../datos/guardado'
import { armarRespaldo } from '../logic/respaldo'

const ERROR = 'ese texto no lo pude leer. Tu semana sigue igual.'

interface Props {
  ejemplo: boolean
  /** Su semana tal cual está guardada (no se usa en el ejemplo) */
  textoSemana: string
  guardado: Guardado
  /** Usa el texto pegado; `conHojas` = si es un respaldo, también regresa lo que escribió */
  onPegar: (texto: string, conHojas: boolean) => Promise<boolean>
  onCerrada: () => void
}

export function Ajustes({ ejemplo, textoSemana, guardado, onPegar, onCerrada }: Props) {
  return (
    <HojaQueSube titulo="ajustes" onCerrada={onCerrada}>
      {(cerrar) =>
        ejemplo ? (
          <section className="seccion">
            <p className="nota">esta es la semana de ejemplo. Lo que escribas aquí no toca tu semana.</p>
            <a className="boton" href="./">
              ir a mi semana
            </a>
          </section>
        ) : (
          <DeSuSemana textoSemana={textoSemana} guardado={guardado} onPegar={onPegar} cerrar={cerrar} />
        )
      }
    </HojaQueSube>
  )
}

interface PropsSuya {
  textoSemana: string
  guardado: Guardado
  onPegar: Props['onPegar']
  cerrar: () => void
}

function DeSuSemana({ textoSemana, guardado, onPegar, cerrar }: PropsSuya) {
  const [respaldo, setRespaldo] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [pegando, setPegando] = useState<'respaldo' | 'semana' | null>(null)

  // El respaldo se arma al abrir ajustes, para que al tocar "copiar" ya esté listo
  // (el iPhone solo deja copiar justo en el momento del toque)
  useEffect(() => {
    let sigue = true
    guardado
      .leerHojas()
      .then((hojas) => sigue && setRespaldo(armarRespaldo(textoSemana, hojas)))
      .catch(() => {})
    return () => {
      sigue = false
    }
  }, [guardado, textoSemana])

  async function copiar() {
    if (respaldo !== null && (await copiarTexto(respaldo))) setCopiado(true)
  }

  const pegar = (conHojas: boolean) => async (texto: string) => {
    const pudo = await onPegar(texto, conHojas)
    if (pudo) cerrar()
    return pudo
  }

  return (
    <>
      <section className="seccion" aria-label="respaldo">
        <h3 className="seccion-titulo">respaldo</h3>
        <p className="nota">tu semana y todo lo que escribiste, en un texto para guardar en tu WhatsApp.</p>
        <button type="button" className="boton" onClick={copiar} disabled={respaldo === null}>
          copiar respaldo
        </button>
        {copiado && (
          <p className="nota-lista" role="status">
            copiado ☆ pégalo en tu WhatsApp
          </p>
        )}
        {pegando === 'respaldo' ? (
          <>
            <p className="nota">pégalo aquí y todo regresa a como estaba en ese respaldo.</p>
            <PegarTexto etiqueta="tu respaldo" error={ERROR} onListo={pegar(true)} autoFocus />
          </>
        ) : (
          <button type="button" className="enlace enlace-suelto" onClick={() => setPegando('respaldo')}>
            pegar un respaldo
          </button>
        )}
      </section>

      <section className="seccion" aria-label="mi semana">
        <h3 className="seccion-titulo">mi semana</h3>
        {pegando === 'semana' ? (
          <>
            <p className="nota">lo que escribiste en cada hoja se queda.</p>
            <PegarTexto etiqueta="tu semana nueva" error={ERROR} onListo={pegar(false)} autoFocus />
          </>
        ) : (
          <button type="button" className="enlace enlace-suelto" onClick={() => setPegando('semana')}>
            pegar semana nueva
          </button>
        )}
      </section>
    </>
  )
}
