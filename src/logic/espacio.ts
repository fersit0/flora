// Lo que ella escribe dentro de cada espacio: pendientes, su lista de contenidos e ideas.
// Todo son funciones que reciben lo que había y regresan lo nuevo; guardar es aparte.

export interface Pendiente {
  id: string
  texto: string
  hecho: boolean
}

export interface Idea {
  id: string
  texto: string
  usada: boolean
}

export interface DatosEspacio {
  pendientes: Pendiente[]
  /** La lista de contenidos, tal cual el texto que ella pega y copia */
  contenidos: string
  ideas: Idea[]
}

export function espacioVacio(): DatosEspacio {
  return { pendientes: [], contenidos: '', ideas: [] }
}

/* ── Pendientes ── */

/** El nuevo va al final de los pendientes, justo arriba del campo. */
export function agregarPendiente(d: DatosEspacio, texto: string, id: string): DatosEspacio {
  const limpio = texto.trim()
  if (!limpio) return d
  return { ...d, pendientes: [...d.pendientes, { id, texto: limpio, hecho: false }] }
}

export function marcarPendiente(d: DatosEspacio, id: string): DatosEspacio {
  return { ...d, pendientes: d.pendientes.map((p) => (p.id === id ? { ...p, hecho: !p.hecho } : p)) }
}

/** Si lo deja vacío, el pendiente se quita. */
export function editarPendiente(d: DatosEspacio, id: string, texto: string): DatosEspacio {
  const limpio = texto.trim()
  if (!limpio) return { ...d, pendientes: d.pendientes.filter((p) => p.id !== id) }
  return { ...d, pendientes: d.pendientes.map((p) => (p.id === id ? { ...p, texto: limpio } : p)) }
}

export function borrarHechos(d: DatosEspacio): DatosEspacio {
  return { ...d, pendientes: d.pendientes.filter((p) => !p.hecho) }
}

/* ── Lista de contenidos ── */

/** Se guarda exactamente lo que escribió o pegó: ni un espacio de más ni de menos. */
export function cambiarContenidos(d: DatosEspacio, texto: string): DatosEspacio {
  return { ...d, contenidos: texto }
}

/* ── Ideas ── */

/** La más nueva va arriba. */
export function agregarIdea(d: DatosEspacio, texto: string, id: string): DatosEspacio {
  const limpio = texto.trim()
  if (!limpio) return d
  return { ...d, ideas: [{ id, texto: limpio, usada: false }, ...d.ideas] }
}

/** "Ya la usé": se va hasta el final. */
export function usarIdea(d: DatosEspacio, id: string): DatosEspacio {
  const idea = d.ideas.find((i) => i.id === id)
  if (!idea) return d
  return { ...d, ideas: [...d.ideas.filter((i) => i.id !== id), { ...idea, usada: true }] }
}

/** Si la deja vacía, la idea se quita. */
export function editarIdea(d: DatosEspacio, id: string, texto: string): DatosEspacio {
  const limpio = texto.trim()
  if (!limpio) return { ...d, ideas: d.ideas.filter((i) => i.id !== id) }
  return { ...d, ideas: d.ideas.map((i) => (i.id === id ? { ...i, texto: limpio } : i)) }
}

/* ── Leer lo guardado ── */

/**
 * Lee lo guardado en el teléfono (o, más adelante, un respaldo).
 * Lo que no tenga la forma correcta se ignora; nunca lanza error.
 */
export function leerDatosEspacio(x: unknown): DatosEspacio {
  const d = espacioVacio()
  if (typeof x !== 'object' || x === null) return d
  const o = x as Record<string, unknown>
  if (typeof o.contenidos === 'string') d.contenidos = o.contenidos
  if (Array.isArray(o.pendientes)) {
    for (const p of o.pendientes) {
      if (p && typeof p.id === 'string' && typeof p.texto === 'string') {
        d.pendientes.push({ id: p.id, texto: p.texto, hecho: p.hecho === true })
      }
    }
  }
  if (Array.isArray(o.ideas)) {
    for (const i of o.ideas) {
      if (i && typeof i.id === 'string' && typeof i.texto === 'string') {
        d.ideas.push({ id: i.id, texto: i.texto, usada: i.usada === true })
      }
    }
  }
  return d
}
