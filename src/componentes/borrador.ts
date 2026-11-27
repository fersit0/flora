// Lo que estaba escribiendo en el campo de una hoja y todavía no agregaba.
// Si se va a otra app e iOS cierra Flora, al volver a abrir esa hoja ahí sigue.
// Se guarda en localStorage del teléfono; si no se puede, no pasa nada.

const PREFIJO = 'flora-borrador:'

export function leerBorrador(clave: string | undefined): string {
  if (!clave) return ''
  try {
    return localStorage.getItem(PREFIJO + clave) ?? ''
  } catch {
    return ''
  }
}

export function guardarBorrador(clave: string | undefined, texto: string) {
  if (!clave) return
  try {
    if (texto) localStorage.setItem(PREFIJO + clave, texto)
    else localStorage.removeItem(PREFIJO + clave)
  } catch {
    // Sin lugar o sin permiso: el campo sigue funcionando igual
  }
}
