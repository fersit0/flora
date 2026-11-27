// La liga de instalación: trae su semana (o un respaldo completo) comprimida dentro de la liga,
// después de "?semana=" (el iPhone conserva esa parte al agregarla a inicio; lo que va después
// de un # lo tira). La arma scripts/liga.mjs.

const CLAVE = 'semana='

/**
 * Lo que trae la liga, tal cual (o null si no trae nada o no se puede leer). Nunca lanza error.
 * @param parte lo que va después de la dirección (`location.search + location.hash`)
 */
export async function leerLiga(parte: string): Promise<string | null> {
  const inicio = parte.indexOf(CLAVE)
  if (inicio < 0) return null
  try {
    const base64 = parte
      .slice(inicio + CLAVE.length)
      .split(/[&#]/)[0]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4)), (c) => c.charCodeAt(0))
    const flujo = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
    const texto = await new Response(flujo).text()
    return texto.trim() ? texto : null
  } catch {
    return null
  }
}
