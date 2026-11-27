// La semana son datos, no código: este archivo lee el texto de la semana
// (el mismo que ella pega) y lo convierte en algo que la pantalla puede dibujar.
// Si el texto no sirve, dice por qué y no rompe nada.

export const DIAS = ['lun', 'mar', 'mié', 'jue', 'vie'] as const
export type Dia = (typeof DIAS)[number]

export const COLORES = ['vino', 'rosa', 'pistache', 'sol', 'papel', 'rayado'] as const
export type Color = (typeof COLORES)[number]

export const TIPOS_ESPACIO = ['pendientes', 'cliente', 'ideas'] as const
export type TipoEspacio = (typeof TIPOS_ESPACIO)[number]

export interface Espacio {
  id: string
  nombre: string
  emoji: string
  color: Color
  tipo: TipoEspacio
}

/** Qué abre un bloque al tocarlo. `null` = nada. */
export type Abre =
  | null
  | { espacio: string }
  | { liga: string; porConfirmar?: boolean }
  | { comida: string }

export interface Bloque {
  /** Hora de inicio, en horas (13.5 = 1:30 pm) */
  de: number
  /** Hora de fin */
  a: number
  color: Color
  emoji: string
  /** El que cabe en la pantalla: máximo dos renglones cortos */
  nombre: string
  nombreLargo: string
  detalle: string
  abre: Abre
}

export interface TextoFinde {
  corto: string
  largo: string
}

export interface ResumenCosa {
  color: Color
  emoji: string
  nombre: string
  texto: string
}

export interface Semana {
  version: 1
  titulo: string
  horas: { inicio: number; fin: number }
  espacios: Espacio[]
  ligas: Record<string, string>
  dias: Record<Dia, Bloque[]>
  finde: { sab: TextoFinde; dom: TextoFinde }
  porCadaCosa: ResumenCosa[]
  dormir: string
}

export type Lectura = { ok: true; semana: Semana } | { ok: false; motivo: string }

/** Lee el texto pegado. Nunca lanza error: si no sirve, regresa el motivo. */
export function leerSemana(texto: string): Lectura {
  let datos: unknown
  try {
    datos = JSON.parse(texto)
  } catch {
    return { ok: false, motivo: 'no es texto de datos (JSON)' }
  }
  try {
    return { ok: true, semana: validar(datos) }
  } catch (e) {
    if (e instanceof DatoMalo) return { ok: false, motivo: e.message }
    throw e
  }
}

class DatoMalo extends Error {}

function falla(motivo: string): never {
  throw new DatoMalo(motivo)
}

type Objeto = Record<string, unknown>

function esObjeto(x: unknown): x is Objeto {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

function texto(x: unknown, donde: string, opcional = false): string {
  if (x === undefined && opcional) return ''
  if (typeof x !== 'string') falla(`falta el texto de ${donde}`)
  return x
}

function numero(x: unknown, donde: string): number {
  if (typeof x !== 'number' || !Number.isFinite(x)) falla(`falta la hora de ${donde}`)
  return x
}

function color(x: unknown, donde: string): Color {
  if (!COLORES.includes(x as Color)) falla(`el color de ${donde} no existe`)
  return x as Color
}

function validar(datos: unknown): Semana {
  if (!esObjeto(datos)) falla('no tiene la forma de una semana')
  if (datos.version !== 1) falla('no es la versión 1 del formato')

  const horas = datos.horas
  if (!esObjeto(horas)) falla('faltan las horas del día')
  const inicio = numero(horas.inicio, 'inicio del día')
  const fin = numero(horas.fin, 'fin del día')
  if (!(inicio >= 0 && fin <= 24 && inicio < fin)) falla('las horas del día no tienen sentido')

  if (!Array.isArray(datos.espacios)) falla('faltan los espacios')
  const espacios = datos.espacios.map((e, i) => leerEspacio(e, i))
  const ids = new Set(espacios.map((e) => e.id))
  if (ids.size !== espacios.length) falla('hay dos espacios con el mismo id')

  const ligas: Record<string, string> = {}
  if (datos.ligas !== undefined) {
    if (!esObjeto(datos.ligas)) falla('las ligas no tienen la forma correcta')
    for (const [clave, valor] of Object.entries(datos.ligas)) ligas[clave] = texto(valor, `la liga ${clave}`)
  }

  if (!esObjeto(datos.dias)) falla('faltan los días')
  const diasCrudos = datos.dias
  const dias = {} as Record<Dia, Bloque[]>
  for (const dia of DIAS) {
    const lista = diasCrudos[dia] ?? []
    if (!Array.isArray(lista)) falla(`el ${dia} no es una lista de bloques`)
    const bloques = lista.map((b, i) => leerBloque(b, `${dia}, bloque ${i + 1}`, ids))
    bloques.sort((x, y) => x.de - y.de)
    for (const [i, b] of bloques.entries()) {
      if (b.de < inicio || b.a > fin) falla(`el bloque ${b.nombre} del ${dia} se sale del horario`)
      const anterior = bloques[i - 1]
      if (anterior && b.de < anterior.a) falla(`dos bloques se enciman el ${dia}`)
    }
    dias[dia] = bloques
  }

  const findeCrudo = esObjeto(datos.finde) ? datos.finde : {}
  const finde = {
    sab: leerFinde(findeCrudo.sab, 'sábado'),
    dom: leerFinde(findeCrudo.dom, 'domingo'),
  }

  const porCadaCosa: ResumenCosa[] = []
  if (datos.porCadaCosa !== undefined) {
    if (!Array.isArray(datos.porCadaCosa)) falla('el resumen por cada cosa no es una lista')
    for (const [i, r] of datos.porCadaCosa.entries()) {
      if (!esObjeto(r)) falla(`el resumen ${i + 1} no tiene la forma correcta`)
      porCadaCosa.push({
        color: color(r.color, `el resumen ${i + 1}`),
        emoji: texto(r.emoji, `el emoji del resumen ${i + 1}`, true),
        nombre: texto(r.nombre, `el nombre del resumen ${i + 1}`),
        texto: texto(r.texto, `el resumen ${i + 1}`),
      })
    }
  }

  return {
    version: 1,
    titulo: texto(datos.titulo, 'el título', true),
    horas: { inicio, fin },
    espacios,
    ligas,
    dias,
    finde,
    porCadaCosa,
    dormir: texto(datos.dormir, 'la hora de dormir', true),
  }
}

function leerEspacio(e: unknown, i: number): Espacio {
  const donde = `el espacio ${i + 1}`
  if (!esObjeto(e)) falla(`${donde} no tiene la forma correcta`)
  const tipo = e.tipo
  if (!TIPOS_ESPACIO.includes(tipo as TipoEspacio)) falla(`${donde} tiene un tipo que no existe`)
  const id = texto(e.id, `el id de ${donde}`)
  if (!id) falla(`${donde} no tiene id`)
  return {
    id,
    nombre: texto(e.nombre, `el nombre de ${donde}`),
    emoji: texto(e.emoji, `el emoji de ${donde}`, true),
    color: color(e.color, donde),
    tipo: tipo as TipoEspacio,
  }
}

function leerBloque(b: unknown, donde: string, espacios: Set<string>): Bloque {
  if (!esObjeto(b)) falla(`el ${donde} no tiene la forma correcta`)
  const de = numero(b.de, `el ${donde}`)
  const a = numero(b.a, `el ${donde}`)
  if (!(de < a)) falla(`el ${donde} termina antes de empezar`)
  const nombre = texto(b.nombre, `el nombre del ${donde}`)
  return {
    de,
    a,
    color: color(b.color, `el ${donde}`),
    emoji: texto(b.emoji, `el emoji del ${donde}`, true),
    nombre,
    nombreLargo: texto(b.nombreLargo, `el nombre largo del ${donde}`, true) || nombre,
    detalle: texto(b.detalle, `el detalle del ${donde}`, true),
    abre: leerAbre(b.abre, donde, espacios),
  }
}

function leerAbre(x: unknown, donde: string, espacios: Set<string>): Abre {
  if (x === null || x === undefined) return null
  if (!esObjeto(x)) falla(`lo que abre el ${donde} no tiene la forma correcta`)
  if (typeof x.espacio === 'string') {
    if (!espacios.has(x.espacio)) falla(`el ${donde} abre un espacio que no existe`)
    return { espacio: x.espacio }
  }
  if (typeof x.liga === 'string') {
    return x.porConfirmar === true ? { liga: x.liga, porConfirmar: true } : { liga: x.liga }
  }
  if (typeof x.comida === 'string') return { comida: x.comida }
  // Un objeto vacío o desconocido: el bloque no abre nada
  return null
}

function leerFinde(x: unknown, dia: string): TextoFinde {
  if (x === undefined) return { corto: '', largo: '' }
  if (!esObjeto(x)) falla(`el ${dia} no tiene la forma correcta`)
  const corto = texto(x.corto, `el ${dia}`, true)
  return { corto, largo: texto(x.largo, `el ${dia}`, true) || corto }
}

/** Los días en que algún bloque abre ese espacio, en orden de lunes a viernes. */
export function diasDeEspacio(semana: Semana, id: string): Dia[] {
  return DIAS.filter((dia) =>
    semana.dias[dia].some((b) => b.abre !== null && 'espacio' in b.abre && b.abre.espacio === id),
  )
}

/** La línea "por cada cosa" de ese espacio (va bajo el título de su hoja), o '' si no tiene. */
export function resumenDeEspacio(semana: Semana, espacio: Espacio): string {
  return semana.porCadaCosa.find((r) => r.nombre === espacio.nombre)?.texto ?? ''
}

/** Direcciones que nunca se abren: no llevan a ninguna página ni app, y pueden ser peligrosas */
const NO_SE_ABREN = ['javascript:', 'data:', 'vbscript:', 'file:', 'blob:', 'about:']

/** La dirección, si el texto es una que se puede abrir (una página o una app); si no, `null`. */
export function direccionValida(valor: string): string | null {
  const limpio = valor.trim()
  if (!limpio) return null
  try {
    const url = new URL(limpio)
    return NO_SE_ABREN.includes(url.protocol) ? null : url.href
  } catch {
    return null
  }
}

/**
 * La dirección que abre un bloque con liga (una página, o una app como "message://"),
 * o `null` si no abre nada: la liga no existe, está vacía o no es una dirección.
 * Un bloque sin dirección no es botón: nunca un botón que no hace nada.
 */
export function direccionDeLiga(semana: Semana, abre: Abre): string | null {
  if (abre === null || !('liga' in abre)) return null
  return direccionValida(semana.ligas[abre.liga] ?? '')
}
