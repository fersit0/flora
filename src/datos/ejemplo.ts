import texto from './semana-ejemplo.json?raw'
import type { DatosEspacio } from '../logic/espacio'
import { leerSemana, type Semana } from '../logic/semana'

/** La semana de ejemplo (inventada). Se lee igual que el texto que ella pega. */
export function semanaDeEjemplo(): Semana {
  const lectura = leerSemana(texto)
  if (!lectura.ok) throw new Error(`La semana de ejemplo no se pudo leer: ${lectura.motivo}`)
  return lectura.semana
}

/** Lo que traen las hojas del ejemplo la primera vez, para que se vean con algo. Todo inventado. */
export const contenidoDeEjemplo: Record<string, DatosEspacio> = {
  agencia: {
    pendientes: [
      { id: 'ej-a1', texto: 'revisar el brief de la campaña de enero', hecho: false },
      { id: 'ej-a2', texto: 'mandar las tarjetas de navidad', hecho: true },
    ],
    contenidos: '',
    ideas: [],
  },
  velas: {
    pendientes: [
      { id: 'ej-v1', texto: 'pedir el logo en alta', hecho: false },
      { id: 'ej-v2', texto: 'confirmar los aromas nuevos', hecho: false },
    ],
    contenidos: [
      '🕯️VELAS MAREA🕯️',
      'Semana 1',
      'Video largo Aromas 3/03 ✅',
      'Video corto Mechas 5/03 ✅',
      '',
      'Semana 2',
      'Carrusel Regalos 10/03 ✅',
      'Video largo Primavera 12/03',
      '',
      'Semana 3',
      'Video largo Talleres 17/03',
      'Video corto 19/03',
    ].join('\n'),
    ideas: [],
  },
  cafe: {
    pendientes: [],
    contenidos: [
      '☕CAFÉ LIRIO MARZO☕',
      'Semana 1',
      'Fotos menú nuevo 4/03 ✅',
      '',
      'Semana 2',
      'Reel del barista 11/03',
      '',
      'Semana 3',
      'Carrusel postres 18/03',
    ].join('\n'),
    ideas: [],
  },
  ideas: {
    pendientes: [],
    contenidos: '',
    ideas: [
      { id: 'ej-i1', texto: 'mi rutina de mañana en 30 segundos', usada: false },
      { id: 'ej-i2', texto: 'fotos con la luz de la tarde en el balcón', usada: false },
      { id: 'ej-i3', texto: 'tutorial de trenza rápida', usada: true },
    ],
  },
}
