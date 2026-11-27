// Cambiar un bloque de su semana (o agregar uno nuevo en un hueco). Cada cambio se guarda
// solo, en cuanto queda bien. Si algo no queda (el nombre no cabe, se encima con otro),
// lo dice en una frase y se queda lo último que sí quedaba bien.

import { useRef, useState } from 'react'
import { HojaQueSube } from '../componentes/HojaQueSube'
import { cabeEnElBloque } from '../componentes/medirBloque'
import {
  borrarBloque,
  horaTexto,
  horasPosibles,
  ponerBloque,
  tipoDeBloque,
  tiposDeBloque,
  type Cambio,
  type Lugar,
} from '../logic/editar'
import { DIAS, type Dia, type Semana } from '../logic/semana'

interface Props {
  semana: Semana
  /** El bloque que se toca, o `null` si es uno nuevo */
  lugar: Lugar | null
  /** Dónde va el nuevo: su día, su hora y hasta dónde llega el hueco */
  nuevo?: { dia: Dia; de: number; hasta: number }
  /** Guarda la semana; regresa si se pudo */
  onGuardar: (semana: Semana) => Promise<boolean>
  onCerrada: () => void
}

const NO_CABE = 'ese nombre no cabe en el bloque: prueba uno más corto.'

export function EditarBloque({ semana, lugar: lugarInicial, nuevo, onGuardar, onCerrada }: Props) {
  const tipos = tiposDeBloque(semana)
  // La semana con lo último que quedó bien y dónde quedó el bloque. Se actualizan al momento
  // (no hasta que termina de guardarse), para que dos cambios seguidos no se pisen.
  const trabajo = useRef(semana)
  const lugar = useRef(lugarInicial)
  const [yaExiste, setYaExiste] = useState(lugarInicial !== null)
  const [cambio, setCambio] = useState<Cambio>(() => {
    const b = lugarInicial ? semana.dias[lugarInicial.dia][lugarInicial.indice] : null
    if (b) {
      return { nombre: b.nombre, emoji: b.emoji, detalle: b.detalle, tipo: tipoDeBloque(b), dia: lugarInicial!.dia, de: b.de, a: b.a }
    }
    const tipo = tipos.find((t) => t.clave === 'nada:papel') ?? tipos[0]
    const { dia, de, hasta } = nuevo!
    return { nombre: '', emoji: tipo.emoji, detalle: '', tipo: tipo.clave, dia, de, a: Math.min(de + 1, hasta) }
  })
  const [motivo, setMotivo] = useState('')
  const [borrando, setBorrando] = useState(false)

  function cambiar(parte: Partial<Cambio>) {
    const siguiente = { ...cambio, ...parte }
    // En un bloque nuevo, al escoger de qué es, trae su emoji (en uno que ya existe, el suyo se queda)
    if (parte.tipo && !yaExiste) {
      const despues = tipos.find((t) => t.clave === parte.tipo)
      if (despues) siguiente.emoji = despues.emoji
    }
    setCambio(siguiente)
    setBorrando(false)
    const r = ponerBloque(trabajo.current, lugar.current, siguiente)
    if (!r.ok) return setMotivo(r.motivo)
    const tipo = tipos.find((t) => t.clave === siguiente.tipo)!
    const horas = semana.horas.fin - semana.horas.inicio
    if (!cabeEnElBloque({ ...siguiente, nombre: siguiente.nombre.trim(), color: tipo.color, horas })) return setMotivo(NO_CABE)
    setMotivo('')
    trabajo.current = r.semana
    lugar.current = r.lugar
    setYaExiste(true)
    void onGuardar(r.semana)
  }

  async function borrar(cerrar: () => void) {
    if (!lugar.current) return cerrar()
    if (!borrando) return setBorrando(true)
    const sinEl = borrarBloque(trabajo.current, lugar.current)
    if (await onGuardar(sinEl)) {
      trabajo.current = sinEl
      lugar.current = null
      cerrar()
    }
  }

  const horas = horasPosibles(semana)
  const titulo = cambio.nombre.trim() ? `${cambio.emoji} ${cambio.nombre}`.trim() : 'bloque nuevo'

  return (
    <HojaQueSube titulo={titulo} onCerrada={onCerrada}>
      {(cerrar) => (
        <form className="editor" onSubmit={(e) => e.preventDefault()}>
          <div className="editor-renglon">
            <label className="editor-campo editor-emoji">
              <span className="etiqueta">emoji</span>
              <input className="campo" value={cambio.emoji} onChange={(e) => cambiar({ emoji: e.target.value })} />
            </label>
            <label className="editor-campo">
              <span className="etiqueta">nombre</span>
              <input
                className="campo"
                value={cambio.nombre}
                autoFocus={!lugarInicial}
                enterKeyHint="done"
                onChange={(e) => cambiar({ nombre: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              />
            </label>
          </div>

          <fieldset className="editor-grupo">
            <legend className="etiqueta">de qué es</legend>
            <div className="opciones">
              {tipos.map((t) => (
                <button
                  key={t.clave}
                  type="button"
                  className="opcion"
                  aria-pressed={cambio.tipo === t.clave}
                  onClick={() => cambiar({ tipo: t.clave })}
                >
                  <span className={`punto color-${t.color}`} aria-hidden="true" />
                  {t.etiqueta}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="editor-grupo">
            <legend className="etiqueta">día</legend>
            <div className="opciones">
              {DIAS.map((d) => (
                <button key={d} type="button" className="opcion" aria-pressed={cambio.dia === d} onClick={() => cambiar({ dia: d })}>
                  {d}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="editor-renglon editor-horas">
            <label className="editor-campo">
              <span className="etiqueta">empieza</span>
              <select className="campo" value={cambio.de} onChange={(e) => cambiar({ de: Number(e.target.value) })}>
                {horas.slice(0, -1).map((h) => (
                  <option key={h} value={h}>
                    {horaTexto(h)}
                  </option>
                ))}
              </select>
            </label>
            <label className="editor-campo">
              <span className="etiqueta">acaba</span>
              <select className="campo" value={cambio.a} onChange={(e) => cambiar({ a: Number(e.target.value) })}>
                {horas.slice(1).map((h) => (
                  <option key={h} value={h}>
                    {horaTexto(h)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="editor-campo">
            <span className="etiqueta">qué toca ahí</span>
            <input
              className="campo"
              value={cambio.detalle}
              placeholder="si quieres, una línea"
              enterKeyHint="done"
              onChange={(e) => cambiar({ detalle: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            />
          </label>

          {/* El lugar del aviso ya está apartado: cuando sale o se va, nada se mueve */}
          <p className="pegar-error" role="status">
            {motivo}
          </p>
          <button type="button" className="boton" onClick={cerrar}>
            listo
          </button>
          {yaExiste && (
            <button type="button" className="enlace enlace-suelto" onClick={() => borrar(cerrar)}>
              {borrando ? 'toca otra vez para borrarlo' : 'borrar este bloque'}
            </button>
          )}
        </form>
      )}
    </HojaQueSube>
  )
}
