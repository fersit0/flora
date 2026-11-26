import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { AvisoVersion } from './componentes/AvisoVersion'
import { abrirGuardado } from './datos/guardado'
import { contenidoDeEjemplo, semanaDeEjemplo } from './datos/ejemplo'
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
  useEffect(() => {
    if (demo) return
    let sigue = true
    guardado.leerSemana().then((texto) => {
      if (!sigue) return
      const lectura = texto === null ? null : leerDatos(texto)
      setEstado(
        lectura?.ok ? { modo: 'semana', semana: lectura.semana, textoSemana: lectura.textoSemana } : { modo: 'primera' },
      )
    })
    return () => {
      sigue = false
    }
  }, [])

  /** Usa el texto que pegó. Si no sirve o no se pudo guardar, no cambia nada. */
  const usarDatos = useCallback(async (texto: string, conHojas: boolean) => {
    const lectura = leerDatos(texto)
    if (!lectura.ok) return false
    try {
      await guardado.guardarDatos(lectura.textoSemana, conHojas ? lectura.hojas : null)
    } catch {
      return false
    }
    setEstado({ modo: 'semana', semana: lectura.semana, textoSemana: lectura.textoSemana })
    return true
  }, [])

  const alCerrar = useCallback(() => setAbierta(null), [])

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
        hoja = <Hoja key={espacio.id} semana={semana} espacio={espacio} guardado={guardado} onCerrada={alCerrar} />
      }
    } else if (abierta && 'finde' in abierta) {
      hoja = <Finde key={abierta.finde} dia={abierta.finde} texto={semana.finde[abierta.finde]} onCerrada={alCerrar} />
    } else if (abierta) {
      hoja = (
        <Ajustes
          ejemplo={demo}
          textoSemana={estado.textoSemana}
          guardado={guardado}
          onPegar={usarDatos}
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
