import { describe, expect, it } from 'vitest'
import { armarLiga } from '../../scripts/liga.mjs'
import ejemplo from '../datos/semana-ejemplo.json'
import { leerLiga } from './liga'
import { leerDatos } from './respaldo'

const texto = JSON.stringify({ ...ejemplo, hojas: { velas: { pendientes: [], contenidos: 'Semana 1\nVideo 3/03 ✅', ideas: [] } } }, null, 1)

describe('la liga de instalación', () => {
  it('lo que arma la compu de Fer lo lee la app idéntico, emojis y acentos incluidos', async () => {
    const liga = armarLiga(texto)
    expect(liga.startsWith('https://fersit0.github.io/flora/?semana=')).toBe(true)
    expect(await leerLiga(new URL(liga).search)).toBe(texto)
  })

  it('trae la semana y sus listas: se leen como un respaldo', async () => {
    const leido = leerDatos((await leerLiga(new URL(armarLiga(texto)).search))!)
    expect(leido.ok && leido.hojas?.velas.contenidos).toBe('Semana 1\nVideo 3/03 ✅')
  })

  it('una liga sin semana, cortada o con basura no rompe nada', async () => {
    expect(await leerLiga('')).toBeNull()
    expect(await leerLiga('#otra-cosa')).toBeNull()
    expect(await leerLiga('?semana=esto-no-es-nada')).toBeNull()
    const cortada = new URL(armarLiga(texto)).search.slice(0, 80)
    expect(await leerLiga(cortada)).toBeNull()
  })

  it('la liga no es enorme: cabe de sobra en un mensaje de WhatsApp', () => {
    expect(armarLiga(texto).length).toBeLessThan(6000)
  })
})
