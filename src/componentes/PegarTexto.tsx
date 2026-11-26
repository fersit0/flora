// Un campo para pegar su semana o un respaldo, con su botón "listo".
// Si el texto no sirve, lo dice en una frase y no cambia nada.

import { useState, type FormEvent } from 'react'

interface Props {
  /** Cómo se llama el campo (para quien no ve la pantalla) */
  etiqueta: string
  /** Lo que dice si el texto no sirve */
  error: string
  /** Intenta usar el texto; regresa si se pudo */
  onListo: (texto: string) => Promise<boolean>
  autoFocus?: boolean
}

export function PegarTexto({ etiqueta, error, onListo, autoFocus }: Props) {
  const [texto, setTexto] = useState('')
  const [fallo, setFallo] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const hayTexto = texto.trim() !== ''

  async function listo(e: FormEvent) {
    e.preventDefault()
    if (!hayTexto || ocupado) return
    setOcupado(true)
    const pudo = await onListo(texto)
    setOcupado(false)
    setFallo(!pudo)
  }

  return (
    <form className="pegar" onSubmit={listo}>
      <textarea
        className="pegar-texto"
        aria-label={etiqueta}
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value)
          setFallo(false)
        }}
        rows={4}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        autoFocus={autoFocus}
      />
      {fallo && (
        <p className="pegar-error" role="status">
          {error}
        </p>
      )}
      <button type="submit" className="boton" disabled={!hayTexto || ocupado}>
        listo
      </button>
    </form>
  )
}
