// Las piezas de cada renglón de una hoja: el círculo, el texto que se edita al tocarlo
// y el campo para agregar.

import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'

export function Circulo({ hecho, texto, onTocar }: { hecho: boolean; texto: string; onTocar: () => void }) {
  return (
    <button type="button" className="circulo" aria-pressed={hecho} aria-label={`hecho: ${texto}`} onClick={onTocar}>
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

/** Tocar el texto lo vuelve editable. Enter o tocar fuera lo guarda; dejarlo vacío lo quita. */
export function TextoEditable({ texto, onCambiar }: { texto: string; onCambiar: (nuevo: string) => void }) {
  const [editando, setEditando] = useState(false)
  const cancelar = useRef(false)

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
      cancelar.current = true
      e.currentTarget.blur()
    }
  }

  return (
    <input
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
 */
export function Agregar({ texto, onAgregar }: { texto: string; onAgregar: (textos: string[]) => void }) {
  const [valor, setValor] = useState('')

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
