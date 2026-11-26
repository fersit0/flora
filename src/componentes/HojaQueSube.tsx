// La hoja que sube desde abajo. Deja ver arriba un pedazo del horario, para que se sienta
// que no saliste. Se cierra tocando fuera, jalando el asa hacia abajo o con el gesto de atrás.
// La usan las hojas de cada espacio y los ajustes; lo de adentro lo pone cada una.

import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'

const DURACION = 200 // ms, lo mismo que la animación en estilos.css

function sinMovimiento() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Si estaba escribiendo algo, que se guarde antes de cerrar */
function soltarElCampo() {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
}

interface Props {
  titulo: ReactNode
  /** Junto al título (la pastilla con los días) */
  junto?: ReactNode
  /** Abajo del título (la línea "por cada cosa") */
  debajo?: ReactNode
  onCerrada: () => void
  /** Lo de adentro; recibe `cerrar` por si algo adentro tiene que cerrar la hoja */
  children: (cerrar: () => void) => ReactNode
}

export function HojaQueSube({ titulo, junto, debajo, onCerrada, children }: Props) {
  const [cerrando, setCerrando] = useState(false)
  const hoja = useRef<HTMLElement>(null)

  // El gesto de atrás cierra la hoja: al abrirla se agrega un paso al historial
  useEffect(() => {
    if (history.state?.hoja !== true) history.pushState({ hoja: true }, '')
    const alRegresar = () => {
      soltarElCampo()
      setCerrando(true)
    }
    window.addEventListener('popstate', alRegresar)
    hoja.current?.focus({ preventScroll: true })
    return () => window.removeEventListener('popstate', alRegresar)
  }, [])

  const cerrar = useCallback(() => {
    soltarElCampo()
    if (history.state?.hoja === true) history.back()
    else setCerrando(true)
  }, [])

  useEffect(() => {
    const tecla = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && !e.defaultPrevented && cerrar()
    document.addEventListener('keydown', tecla)
    return () => document.removeEventListener('keydown', tecla)
  }, [cerrar])

  useEffect(() => {
    if (!cerrando) return
    const t = setTimeout(onCerrada, sinMovimiento() ? 0 : DURACION)
    return () => clearTimeout(t)
  }, [cerrando, onCerrada])

  // Jalar el asa hacia abajo
  const arrastre = useRef<{ y: number; t: number; baja: number } | null>(null)
  function empezar(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || !hoja.current) return
    arrastre.current = { y: e.clientY, t: e.timeStamp, baja: 0 }
    e.currentTarget.setPointerCapture(e.pointerId)
    hoja.current.style.transition = 'none'
  }
  function mover(e: PointerEvent<HTMLDivElement>) {
    const a = arrastre.current
    if (!a || !hoja.current) return
    a.baja = Math.max(0, e.clientY - a.y)
    hoja.current.style.transform = `translateY(${a.baja}px)`
  }
  function soltar(e: PointerEvent<HTMLDivElement>) {
    const a = arrastre.current
    arrastre.current = null
    if (!a || !hoja.current) return
    const rapidez = a.baja / Math.max(1, e.timeStamp - a.t)
    hoja.current.style.transition = ''
    if (a.baja > 100 || (a.baja > 30 && rapidez > 0.5)) cerrar()
    else hoja.current.style.transform = ''
  }

  return (
    <div className={cerrando ? 'capa-hoja cerrando' : 'capa-hoja'}>
      <div className="velo" onClick={cerrar} aria-hidden="true" />
      <section
        ref={hoja}
        className="hoja"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-hoja"
        tabIndex={-1}
      >
        <div
          className="hoja-agarre"
          onPointerDown={empezar}
          onPointerMove={mover}
          onPointerUp={soltar}
          onPointerCancel={soltar}
        >
          <div className="asa" aria-hidden="true" />
          <header className="hoja-cabecera">
            <h2 id="titulo-hoja">{titulo}</h2>
            {junto}
          </header>
          {debajo}
        </div>

        <div className="hoja-contenido">{children(cerrar)}</div>
      </section>
    </div>
  )
}
