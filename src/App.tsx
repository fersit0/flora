import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { AvisoVersion } from './componentes/AvisoVersion'
import { abrirGuardado } from './datos/guardado'
import { contenidoDeEjemplo, semanaDeEjemplo } from './datos/ejemplo'
import { cambiarLiga, conservarLigas } from './logic/ligas'
import { leerDatos } from './logic/respaldo'
import type { Semana } from './logic/semana'
import { Ajustes } from './pantallas/Ajustes'
import { Finde } from './pantallas/Finde'
import { Hoja } from './pantallas/Hoja'
import { Horario, type QueAbre } from './pantallas/Horario'
import { PegaTuSemana } from './pantallas/PegaTuSemana'

// Con ?demo=1 se ve la semana de ejemplo, y lo que se escribe en sus hojas se guarda
// aparte ("flora-ejemplo"): el guardado de su semana ("flora") ni se abre.
const demo = new URLSearchParams(location.search).get('demo') === '1'
const guardado = demo ? abrirGuardado('flora-ejemplo', contenidoDeEjemplo) : abrirGuardado('flora')

// Si la página se recargó con una hoja abierta, esa marca del historial ya no sirve
if (history.state?.hoja) history.replaceState(null, '')

type Estado =
  | { modo: 'cargando' }
  /** Todavía no pega su semana */
  | { modo: 'primera' }
  | { modo: 'semana'; semana: Semana; textoSemana: string }

export function App() {
  const [estado, setEstado] = useState<Estado>(() =>
    demo ? { modo: 'semana', semana: semanaDeEjemplo(), textoSemana: '' } : { modo: 'cargando' },
  )
  // Lo que está abierto en una hoja (solo una a la vez)
  const [abierta, setAbierta] = useState<QueAbre | null>(null)

  // Su semana está guardada en el teléfono desde que la pegó
  // Si no se pudo leer, no se finge que no tiene semana (le pediría pegarla otra vez):
  // se queda esperando y vuelve a intentar al regresar a la app.
  useEffect(() => {
    if (demo) return
    let sigue = true
    let listo = false
    const leer = () => {
      if (listo) return
      guardado
        .leerSemana()
        .then((texto) => {
          if (!sigue) return
          listo = true
          const lectura = texto === null ? null : leerDatos(texto)
          setEstado(
            lectura?.ok
              ? { modo: 'semana', semana: lectura.semana, textoSemana: lectura.textoSemana }
              : { modo: 'primera' },
          )
        })
        .catch(() => {})
    }
    leer()
    const alVolver = () => document.visibilityState === 'visible' && leer()
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      sigue = false
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [])

  // Su semana guardada ahorita (para conservar sus ligas al pegar otra)
  const textoActual = estado.modo === 'semana' && !demo ? estado.textoSemana : null

  /**
   * Usa el texto que pegó (una semana o un respaldo). Las ligas que vienen vacías conservan
   * las que ella ya había puesto. Si no sirve o no se pudo guardar, no cambia nada.
   */
  const usarDatos = useCallback(
    async (texto: string, conHojas: boolean) => {
      const primera = leerDatos(texto)
      if (!primera.ok) return false
      const lectura = textoActual ? leerDatos(conservarLigas(primera.textoSemana, textoActual)) : primera
      if (!lectura.ok) return false
      try {
        await guardado.guardarDatos(lectura.textoSemana, conHojas ? primera.hojas : null)
      } catch {
        return false
      }
      setEstado({ modo: 'semana', semana: lectura.semana, textoSemana: lectura.textoSemana })
      return true
    },
    [textoActual],
  )

  /** Guarda una liga que ella pegó en los ajustes. Si no es una dirección, no cambia nada. */
  const guardarLiga = useCallback(
    async (clave: string, valor: string) => {
      if (!textoActual) return false
      const texto = cambiarLiga(textoActual, clave, valor)
      const lectura = texto === null ? null : leerDatos(texto)
      if (!lectura?.ok) return false
      try {
        await guardado.guardarDatos(lectura.textoSemana, null)
      } catch {
        return false
      }
      setEstado({ modo: 'semana', semana: lectura.semana, textoSemana: lectura.textoSemana })
      return true
    },
    [textoActual],
  )

  const alCerrar = useCallback(() => setAbierta(null), [])

  // Mientras hay una hoja abierta, la página de atrás no se mueve (ver html.con-hoja en estilos.css)
  const hayHoja = abierta !== null
  useEffect(() => {
    document.documentElement.classList.toggle('con-hoja', hayHoja)
  }, [hayHoja])

  let pantalla: ReactNode = null
  if (estado.modo === 'primera') {
    // Pegar aquí un respaldo también regresa sus listas
    pantalla = <PegaTuSemana onListo={(texto) => usarDatos(texto, true)} />
  } else if (estado.modo === 'semana') {
    const { semana } = estado
    let hoja: ReactNode = null
    if (abierta && 'espacio' in abierta) {
      const espacio = semana.espacios.find((e) => e.id === abierta.espacio)
      if (espacio) {
        hoja = (
          <Hoja
            key={espacio.id}
            semana={semana}
            espacio={espacio}
            detalle={abierta.detalle}
            guardado={guardado}
            onCerrada={alCerrar}
          />
        )
      }
    } else if (abierta && 'finde' in abierta) {
      hoja = <Finde key={abierta.finde} dia={abierta.finde} texto={semana.finde[abierta.finde]} onCerrada={alCerrar} />
    } else if (abierta) {
      hoja = (
        <Ajustes
          ejemplo={demo}
          semana={semana}
          textoSemana={estado.textoSemana}
          guardado={guardado}
          onPegar={usarDatos}
          onLiga={guardarLiga}
          onCerrada={alCerrar}
        />
      )
    }
    pantalla = (
      <>
        <Horario semana={semana} onAbrir={setAbierta} tapado={hoja !== null} />
        {hoja}
      </>
    )
  }

  return (
    <>
      {pantalla}
      <AvisoVersion />
    </>
  )
}
