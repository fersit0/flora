// Sábado o domingo: en la pantalla se ve el texto corto; al tocarlo sube su hoja con el largo.

import { HojaQueSube } from '../componentes/HojaQueSube'
import type { TextoFinde } from '../logic/semana'

export const NOMBRE_FINDE = { sab: 'sábado', dom: 'domingo' } as const
export type DiaFinde = keyof typeof NOMBRE_FINDE

interface Props {
  dia: DiaFinde
  texto: TextoFinde
  onCerrada: () => void
}

export function Finde({ dia, texto, onCerrada }: Props) {
  return (
    <HojaQueSube titulo={NOMBRE_FINDE[dia]} onCerrada={onCerrada}>
      {() => <p className="finde-largo">{texto.largo}</p>}
    </HojaQueSube>
  )
}
