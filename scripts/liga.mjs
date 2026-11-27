// La liga de instalación de Flora: su semana (y sus listas) comprimidas dentro de la liga,
// después de "?semana=". Va ahí y no después de un #, porque al agregarla a la pantalla de
// inicio el iPhone se queda con lo que va después del ? pero tira lo que va después del #
// (lo vimos en el simulador). No se publica en ningún lado: solo vive en el chat donde se
// manda y en su teléfono. La app la lee la primera vez que abre (src/logic/liga.ts).
//
// Uso, en la compu de Fer:   node scripts/liga.mjs
// Lee privado/semana.json y las listas de privado/CONTENIDO.md, y deja la liga en
// privado/liga-de-instalacion.txt (privado/ nunca se sube). Con otra dirección para probar:
//   node scripts/liga.mjs http://localhost:5182/flora/

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { deflateRawSync } from 'node:zlib'

export const PAGINA = 'https://fersit0.github.io/flora/'

/** La liga con el texto (una semana o un respaldo) comprimido después de "?semana=" */
export function armarLiga(texto, base = PAGINA) {
  return `${base}?semana=${deflateRawSync(Buffer.from(texto, 'utf8'), { level: 9 }).toString('base64url')}`
}

/** Le quita acentos y pasa a mayúsculas, para comparar nombres */
function sencillo(texto) {
  return texto.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase()
}

/** Su semana, con cada lista de CONTENIDO.md en la hoja del cliente cuyo nombre trae en el título */
export function armarRespaldoInicial(carpeta) {
  const semana = JSON.parse(readFileSync(join(carpeta, 'semana.json'), 'utf8'))
  const hojas = {}
  const contenido = join(carpeta, 'CONTENIDO.md')
  if (existsSync(contenido)) {
    const listas = [...readFileSync(contenido, 'utf8').matchAll(/```\n([\s\S]*?)\n```/g)].map((m) => m[1])
    for (const espacio of semana.espacios.filter((e) => e.tipo === 'cliente')) {
      const palabras = sencillo(espacio.nombre).split(/\s+/).filter((p) => p.length > 3)
      const lista = listas.find((l) => palabras.some((p) => sencillo(l.split('\n')[0]).includes(p)))
      if (lista) hojas[espacio.id] = { pendientes: [], contenidos: lista, ideas: [] }
    }
  }
  return JSON.stringify({ ...semana, hojas }, null, 1)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const carpeta = join(import.meta.dirname, '..', 'privado')
  const base = process.argv[2] ?? PAGINA
  const respaldo = armarRespaldoInicial(carpeta)
  const liga = armarLiga(respaldo, base)
  const listas = Object.keys(JSON.parse(respaldo).hojas).length
  writeFileSync(join(carpeta, 'liga-de-instalacion.txt'), liga + '\n')
  console.log(`Liga lista (${liga.length} letras, con ${listas} listas): privado/liga-de-instalacion.txt`)
}
