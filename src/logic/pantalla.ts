// Cuánto alto le da el iPhone a la app instalada.
// iOS 27 a veces le da 812 de los 874 de su pantalla (lo medimos en el simulador del 17 Pro):
// la app empieza arriba, detrás de la hora, pero termina 62 puntos antes del borde de abajo.
// En ese caso la barrita de inicio queda fuera de la app y no hace falta apartarle espacio.

interface Medidas {
  /** Si se abrió desde el ícono */
  instalada: boolean
  /** Lo que mide la app por dentro (innerHeight) */
  alto: number
  /** Lo que mide la pantalla del teléfono */
  pantalla: number
  /** Lo que la app tiene detrás de la hora y la isla (safe-area-inset-top) */
  arriba: number
}

/** Si la app no llega hasta el borde de abajo de la pantalla. */
export function esAltoCorto({ instalada, alto, pantalla, arriba }: Medidas): boolean {
  return instalada && arriba > 0 && alto + arriba <= pantalla + 1
}
