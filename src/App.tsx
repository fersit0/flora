import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AvisoVersion } from './componentes/AvisoVersion'
import { abrirGuardado } from './datos/guardado'
import { contenidoDeEjemplo, semanaDeEjemplo } from './datos/ejemplo'
import { textoDeSemana } from './logic/editar'
import { leerLiga } from './logic/liga'
import { cambiarLiga, conservarLigas } from './logic/ligas'
import { leerDatos, type Hojas } from './logic/respaldo'
import type { Semana } from './logic/semana'
import { Ajustes } from './pantallas/Ajustes'
import { EditarBloque } from './pantallas/EditarBloque'
import { EditarFinde } from './pantallas/EditarFinde'
import { Finde } from './pantallas/Finde'
import { Hoja } from './pantallas/Hoja'
import { Horario, type QueAbre } from './pantallas/Horario'

// Su semana se guarda en "flora". La de ejemplo (la que ve quien abre Flora sin su liga,
// o con ?demo=1) guarda lo que se escribe en sus hojas aparte, en "flora-ejemplo".
const demo = new URLSearchParams(location.search).get('demo') === '1'
const suGuardado = abrirGuardado('flora')
const guardadoDeEjemplo = abrirGuardado('flora-ejemplo', contenidoDeEjemplo)

// Si la página se recargó con una hoja abierta, esa marca del historial ya no sirve
if (history.state?.hoja) history.replaceState(null, '')

type Estado =
  | { modo: 'cargando' }
  /** Sin su semana guardada (ni liga): se ve la de ejemplo */
  | { modo: 'ejemplo' }
  | { modo: 'semana'; semana: Semana; textoSemana: string }

export function App() {
  const [estado, setEstado] = useState<Estado>(() => (demo ? { modo: 'ejemplo' } : { modo: 'cargando' }))
  // Lo que está abierto en una hoja (solo una a la vez)
  const [abierta, setAbierta] = useState<QueAbre | null>(null)
  // Modo edición de su semana
  const [editando, setEditando] = useState(false)
  const ejemplo = useMemo(() => semanaDeEjemplo(), [])

  // Abre con su semana: la guardada en el teléfono o, la primera vez, la que trae su liga
  // de instalación (?semana=…). La liga nunca pisa una semana ya guardada.
  // Si no se pudo leer el guardado, no se finge que no tiene semana: se queda esperando
  // y vuelve a intentar al regresar a la app.
  useEffect(() => {
    if (demo) return
    let sigue = true
    let listo = false
    const leer = async () => {
      if (listo) return
      let texto: string | null
      try {
        texto = await suGuardado.leerSemana()
      } catch {
        return
      }
      if (!sigue || listo) return
      if (texto === null) {
        const deLaLiga = await leerLiga(location.search + location.hash)
        const lectura = deLaLiga === null ? null : leerDatos(deLaLiga)
        if (lectura?.ok) {
          try {
            await suGuardado.guardarDatos(lectura.textoSemana, lectura.hojas)
            texto = lectura.textoSemana
          } catch {
            return
          }
        }
      }
      if (!sigue) return
      listo = true
      const lectura = texto === null ? null : leerDatos(texto)
      setEstado(
        lectura?.ok ? { modo: 'semana', semana: lectura.semana, textoSemana: lectura.textoSemana } : { modo: 'ejemplo' },
      )
    }
    void leer()
    const alVolver = () => {
      if (document.visibilityState === 'visible') void leer()
    }
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      sigue = false
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [])

  // Su semana guardada ahorita (para conservar sus ligas al pegar otra)
  const textoActual = estado.modo === 'semana' ? estado.textoSemana : null

  /** Guarda su semana (y, si viene de un respaldo, lo que escribió) y la pone en pantalla */
  const guardarTexto = useCallback(async (textoSemana: string, hojas: Hojas | null) => {
    const lectura = leerDatos(textoSemana)
    if (!lectura.ok) return false
    try {
      await suGuardado.guardarDatos(lectura.textoSemana, hojas)
    } catch {
      return false
    }
    setEstado({ modo: 'semana', semana: lectura.semana, textoSemana: lectura.textoSemana })
    return true
  }, [])

  /**
   * Usa el texto que pegó (una semana o un respaldo). Las ligas que vienen vacías conservan
   * las que ella ya había puesto. Si no sirve o no se pudo guardar, no cambia nada.
   */
  const usarDatos = useCallback(
    async (texto: string, conHojas: boolean) => {
      const primera = leerDatos(texto)
      if (!primera.ok) return false
      const semana = textoActual ? conservarLigas(primera.textoSemana, textoActual) : primera.textoSemana
      return guardarTexto(semana, conHojas ? primera.hojas : null)
    },
    [textoActual, guardarTexto],
  )

  /** Guarda una liga que ella pegó en los ajustes. Si no es una dirección, no cambia nada. */
  const guardarLiga = useCallback(
    async (clave: string, valor: string) => {
      const texto = textoActual === null ? null : cambiarLiga(textoActual, clave, valor)
      return texto === null ? false : guardarTexto(texto, null)
    },
    [textoActual, guardarTexto],
  )

  /** Guarda su semana después de editarla */
  const guardarSemana = useCallback((semana: Semana) => guardarTexto(textoDeSemana(semana), null), [guardarTexto])

  const alCerrar = useCallback(() => setAbierta(null), [])

  // Mientras hay una hoja abierta, la página de atrás no se mueve (ver html.con-hoja en estilos.css)
  const hayHoja = abierta !== null
  useEffect(() => {
    document.documentElement.classList.toggle('con-hoja', hayHoja)
  }, [hayHoja])

  if (estado.modo === 'cargando') return <AvisoVersion />

  const suya = estado.modo === 'semana'
  const semana = suya ? estado.semana : ejemplo
  const guardado = suya ? suGuardado : guardadoDeEjemplo

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
  } else if (abierta && 'editar' in abierta && suya) {
    hoja = <EditarBloque semana={semana} lugar={abierta.editar} onGuardar={guardarSemana} onCerrada={alCerrar} />
  } else if (abierta && 'agregar' in abierta && suya) {
    hoja = (
      <EditarBloque semana={semana} lugar={null} nuevo={abierta.agregar} onGuardar={guardarSemana} onCerrada={alCerrar} />
    )
  } else if (abierta && 'editarFinde' in abierta && suya) {
    hoja = <EditarFinde semana={semana} dia={abierta.editarFinde} onGuardar={guardarSemana} onCerrada={alCerrar} />
  } else if (abierta && 'ajustes' in abierta) {
    hoja = (
      <Ajustes
        ejemplo={demo ? 'demo' : suya ? null : 'sin-semana'}
        semana={semana}
        textoSemana={suya ? estado.textoSemana : ''}
        guardado={guardado}
        onPegar={usarDatos}
        onLiga={guardarLiga}
        onEditar={() => setEditando(true)}
        onCerrada={alCerrar}
      />
    )
  }

  return (
    <>
      <Horario
        semana={semana}
        onAbrir={setAbierta}
        tapado={hoja !== null}
        editando={suya && editando}
        onListo={() => setEditando(false)}
      />
      {hoja}
      <AvisoVersion />
    </>
  )
}
