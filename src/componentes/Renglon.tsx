// Las piezas de cada renglón de una hoja: el círculo, el texto que se edita al tocarlo
// y el campo para agregar.

import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import { guardarBorrador, leerBorrador } from './borrador'
import { tic } from './haptico'

/** Cuando se va a otra app o bloquea el cel (iOS puede cerrar Flora sin avisar) */
export function useAlIrse(alIrse: () => void) {
  const ultimo = useRef(alIrse)
  ultimo.current = alIrse
  useEffect(() => {
    const revisar = () => document.visibilityState === 'hidden' && ultimo.current()
    document.addEventListener('visibilitychange', revisar)
    return () => document.removeEventListener('visibilitychange', revisar)
  }, [])
}

export function Circulo({ hecho, texto, onTocar }: { hecho: boolean; texto: string; onTocar: () => void }) {
  return (
    <button
      type="button"
      className="circulo"
      aria-pressed={hecho}
      aria-label={`hecho: ${texto}`}
      onClick={() => {
        tic()
        onTocar()
      }}
    >
      <span className="circulo-dibujo">
        {hecho && (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6.5 12.5l3.6 3.6L17.5 8.6" fill="none" stroke="var(--marfil)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </button>
  )
}

/**
 * Tocar el texto lo vuelve editable. Enter o tocar fuera lo guarda; dejarlo vacío lo quita.
 * Si se va a otra app a media edición, lo escrito se guarda y al volver sigue editando.
 */
export function TextoEditable({ texto, onCambiar }: { texto: string; onCambiar: (nuevo: string) => void }) {
  const [editando, setEditando] = useState(false)
  const cancelar = useRef(false)
  const campo = useRef<HTMLInputElement>(null)

  useAlIrse(() => {
    const valor = campo.current?.value
    // Vacío no: al irse no se borra nada
    if (editando && valor?.trim() && valor !== texto) onCambiar(valor)
  })

  if (!editando) {
    return (
      <button type="button" className="renglon-texto" onClick={() => setEditando(true)}>
        {texto}
      </button>
    )
  }

  function teclas(e: KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter') e.currentTarget.blur()
    if (e.key === 'Escape') {
      // Escape solo deja de editar; la hoja se queda abierta
      e.preventDefault()
      cancelar.current = true
      e.currentTarget.blur()
    }
  }

  return (
    <input
      ref={campo}
      className="renglon-texto"
      defaultValue={texto}
      aria-label={`editar: ${texto}`}
      autoFocus
      enterKeyHint="done"
      onKeyDown={teclas}
      onBlur={(e) => {
        setEditando(false)
        if (!cancelar.current && e.target.value !== texto) onCambiar(e.target.value)
        cancelar.current = false
      }}
    />
  )
}

/**
 * El campo siempre visible: escribes y Enter, como en WhatsApp.
 * Si pega varios renglones, cada uno entra como uno nuevo.
 * `recordar`: dónde se guarda lo que lleva escrito, para que siga ahí si iOS cierra la app.
 */
export function Agregar({
  texto,
  recordar,
  onAgregar,
}: {
  texto: string
  recordar?: string
  onAgregar: (textos: string[]) => void
}) {
  const [valor, setValorSolo] = useState(() => leerBorrador(recordar))
  const setValor = (nuevo: string) => {
    setValorSolo(nuevo)
    guardarBorrador(recordar, nuevo)
  }

  function pegar(e: ClipboardEvent<HTMLInputElement>) {
    const pegado = e.clipboardData.getData('text')
    if (!pegado.includes('\n')) return
    e.preventDefault()
    const renglones = pegado.split('\n').map((r) => r.trim()).filter(Boolean)
    if (renglones.length) onAgregar(renglones)
  }

  return (
    <form
      className="agregar"
      onSubmit={(e) => {
        e.preventDefault()
        if (!valor.trim()) return
        onAgregar([valor])
        setValor('')
      }}
    >
      <input
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onPaste={pegar}
        onFocus={(e) => {
          const campo = e.currentTarget
          // Cuando sube el teclado, que el campo quede a la vista
          setTimeout(() => campo.scrollIntoView({ block: 'nearest' }), 350)
        }}
        placeholder={texto}
        aria-label={texto}
        enterKeyHint="enter"
        autoComplete="off"
      />
    </form>
  )
}
