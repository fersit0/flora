// Cambiar el texto de sábado o domingo: el corto que se ve en el horario y el largo que
// sale al tocarlo. Se guarda solo, letra por letra.

import { useState } from 'react'
import { HojaQueSube } from '../componentes/HojaQueSube'
import { cambiarFinde } from '../logic/editar'
import type { Semana } from '../logic/semana'
import { NOMBRE_FINDE, type DiaFinde } from './Finde'

interface Props {
  semana: Semana
  dia: DiaFinde
  onGuardar: (semana: Semana) => Promise<boolean>
  onCerrada: () => void
}

export function EditarFinde({ semana, dia, onGuardar, onCerrada }: Props) {
  const [texto, setTexto] = useState(semana.finde[dia])

  function cambiar(parte: Partial<typeof texto>) {
    const siguiente = { ...texto, ...parte }
    setTexto(siguiente)
    void onGuardar(cambiarFinde(semana, dia, siguiente))
  }

  return (
    <HojaQueSube titulo={NOMBRE_FINDE[dia]} onCerrada={onCerrada}>
      {(cerrar) => (
        <form className="editor" onSubmit={(e) => e.preventDefault()}>
          <label className="editor-campo">
            <span className="etiqueta">lo que se ve en tu semana</span>
            <input className="campo" value={texto.corto} onChange={(e) => cambiar({ corto: e.target.value })} />
          </label>
          <label className="editor-campo">
            <span className="etiqueta">lo que sale al tocarlo</span>
            <textarea className="campo campo-largo" value={texto.largo} onChange={(e) => cambiar({ largo: e.target.value })} />
          </label>
          <button type="button" className="boton" onClick={cerrar}>
            listo
          </button>
        </form>
      )}
    </HojaQueSube>
  )
}
