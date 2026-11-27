// Editar su semana desde la app: cambiar, agregar y borrar bloques, y el texto de sábado y domingo.
// Todo son funciones que reciben la semana y regresan la nueva; guardar es aparte.
// Lo que abre un bloque no se configura: sale de "de qué es".

import { DIAS, type Abre, type Bloque, type Color, type Dia, type Semana, type TextoFinde } from './semana'

/** "De qué es" un bloque: su color y lo que abre, con un nombre que ella reconoce */
export interface Tipo {
  clave: string
  etiqueta: string
  color: Color
  abre: Abre
  /** El emoji que trae un bloque nuevo de este tipo */
  emoji: string
}

/** Dónde está un bloque: su día y su lugar en ese día (ordenados por hora) */
export interface Lugar {
  dia: Dia
  indice: number
}

/** Lo que ella puede cambiar de un bloque */
export interface Cambio {
  nombre: string
  emoji: string
  detalle: string
  tipo: string
  dia: Dia
  de: number
  a: number
}

export type Resultado = { ok: true; semana: Semana; lugar: Lugar } | { ok: false; motivo: string }

const NOMBRE_DE_COLOR: Partial<Record<Color, string>> = { papel: 'para mí', rayado: 'pendientes sueltos' }

function claveDe(color: Color, abre: Abre): string {
  if (!abre) return `nada:${color}`
  if ('espacio' in abre) return `espacio:${abre.espacio}`
  if ('liga' in abre) return `liga:${abre.liga}`
  return `comida:${abre.comida}`
}

/** El tipo de un bloque */
export function tipoDeBloque(bloque: Bloque): string {
  return claveDe(bloque.color, bloque.abre)
}

/** Los tipos que hay en su semana, en el orden en que aparecen (y los espacios que ningún bloque usa) */
export function tiposDeBloque(semana: Semana): Tipo[] {
  const tipos = new Map<string, Tipo>()
  const nombresDe = new Map<string, string[]>()
  for (const dia of DIAS) {
    for (const b of semana.dias[dia]) {
      const clave = tipoDeBloque(b)
      if (!tipos.has(clave)) tipos.set(clave, { clave, etiqueta: '', color: b.color, abre: b.abre, emoji: b.emoji })
      const nombres = nombresDe.get(clave) ?? []
      if (!nombres.includes(b.nombre)) nombres.push(b.nombre)
      nombresDe.set(clave, nombres)
    }
  }
  for (const e of semana.espacios) {
    const clave = `espacio:${e.id}`
    if (!tipos.has(clave)) tipos.set(clave, { clave, etiqueta: '', color: e.color, abre: { espacio: e.id }, emoji: e.emoji })
  }
  for (const t of tipos.values()) {
    const espacio = t.abre && 'espacio' in t.abre ? semana.espacios.find((e) => e.id === (t.abre as { espacio: string }).espacio) : null
    if (espacio) t.etiqueta = espacio.nombre
    else if (t.abre && 'comida' in t.abre) t.etiqueta = t.abre.comida
    else t.etiqueta = (!t.abre && NOMBRE_DE_COLOR[t.color]) || (nombresDe.get(t.clave) ?? []).join(' · ')
  }
  return [...tipos.values()]
}

/** Cómo se escribe una hora en el editor: 8, 8:30 … 12, 1, 1:30 (como en su horario) */
export function horaTexto(h: number): string {
  const entera = Math.floor(h)
  const doce = entera % 12 === 0 ? 12 : entera % 12
  return h % 1 ? `${doce}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}` : String(doce)
}

/** Las horas que se pueden escoger, cada media hora, del inicio al fin de su horario */
export function horasPosibles(semana: Semana): number[] {
  const horas: number[] = []
  for (let h = semana.horas.inicio; h <= semana.horas.fin; h += 0.5) horas.push(h)
  return horas
}

function ordenar(bloques: Bloque[]): Bloque[] {
  return [...bloques].sort((x, y) => x.de - y.de)
}

/**
 * Cambia un bloque (o agrega uno nuevo si `lugar` es null). Si algo no queda bien,
 * dice por qué en una frase y no cambia nada.
 */
export function ponerBloque(semana: Semana, lugar: Lugar | null, cambio: Cambio): Resultado {
  const nombre = cambio.nombre.trim()
  if (!nombre) return { ok: false, motivo: 'ponle un nombre.' }
  if (!(cambio.a > cambio.de)) return { ok: false, motivo: 'la hora en que acaba va después de la que empieza.' }
  const { inicio, fin } = semana.horas
  if (cambio.de < inicio || cambio.a > fin) {
    return { ok: false, motivo: `tu horario va de ${horaTexto(inicio)} a ${horaTexto(fin)}.` }
  }
  const tipo = tiposDeBloque(semana).find((t) => t.clave === cambio.tipo)
  if (!tipo) return { ok: false, motivo: 'escoge de qué es.' }

  const antes = lugar ? semana.dias[lugar.dia][lugar.indice] : null
  const otros = semana.dias[cambio.dia].filter((b) => b !== antes)
  const encima = otros.find((b) => cambio.de < b.a && b.de < cambio.a)
  if (encima) return { ok: false, motivo: `se encima con «${encima.nombre}».` }

  const bloque: Bloque = {
    de: cambio.de,
    a: cambio.a,
    color: tipo.color,
    emoji: cambio.emoji.trim(),
    nombre,
    // El nombre largo se queda si ella no cambió el nombre
    nombreLargo: antes && antes.nombre === nombre ? antes.nombreLargo : nombre,
    detalle: cambio.detalle.trim(),
    abre: tipo.abre,
  }
  const dias = { ...semana.dias }
  if (lugar) dias[lugar.dia] = dias[lugar.dia].filter((b) => b !== antes)
  dias[cambio.dia] = ordenar([...dias[cambio.dia], bloque])
  return {
    ok: true,
    semana: { ...semana, dias },
    lugar: { dia: cambio.dia, indice: dias[cambio.dia].indexOf(bloque) },
  }
}

export function borrarBloque(semana: Semana, lugar: Lugar): Semana {
  return { ...semana, dias: { ...semana.dias, [lugar.dia]: semana.dias[lugar.dia].filter((_, i) => i !== lugar.indice) } }
}

export function cambiarFinde(semana: Semana, dia: 'sab' | 'dom', texto: TextoFinde): Semana {
  return { ...semana, finde: { ...semana.finde, [dia]: texto } }
}

/**
 * Los huecos de un día donde se puede agregar un bloque, partidos en pedazos de una hora
 * como mucho (empiezan en la hora o donde acaba el bloque de antes). `hasta` es dónde acaba
 * el hueco: un bloque nuevo dura una hora, o menos si no cabe.
 */
export function huecos(semana: Semana, dia: Dia): { de: number; a: number; hasta: number }[] {
  const { inicio, fin } = semana.horas
  const pedazos: { de: number; a: number; hasta: number }[] = []
  let desde = inicio
  for (const b of [...semana.dias[dia], { de: fin, a: fin }]) {
    for (let de = desde; de < b.de; ) {
      const a = Math.min(Math.floor(de) + 1, b.de)
      pedazos.push({ de, a, hasta: b.de })
      de = a
    }
    desde = Math.max(desde, b.a)
  }
  return pedazos
}

/** Convierte la semana en el texto que se guarda (el mismo formato que se pega) */
export function textoDeSemana(semana: Semana): string {
  return JSON.stringify(semana, null, 1)
}
