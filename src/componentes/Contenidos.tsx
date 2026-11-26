// La lista de contenidos de un cliente. Se guarda como el texto que ella escribe;
// aquí solo se dibuja bonito. Tocar el círculo pone o quita el ✅ en ese renglón.

import { useState, type ReactNode } from 'react'
import { cambiarContenidos, type DatosEspacio } from '../logic/espacio'
import { leerLista, marcarRenglon } from '../logic/lista'
import { copiarTexto } from './copiar'
import { Circulo } from './Renglon'
import type { Cambiar } from './useEspacio'

export function Contenidos({ datos, cambiar }: { datos: DatosEspacio; cambiar: Cambiar }) {
  const [editando, setEditando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const hayLista = datos.contenidos.trim() !== ''

  async function copiar() {
    if (await copiarTexto(datos.contenidos)) {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }
  }

  return (
    <section className="seccion" aria-label="contenidos">
      <div className="seccion-cabeza">
        <h3 className="seccion-titulo">contenidos</h3>
        <div className="acciones">
          {editando ? (
            <button type="button" className="enlace" onClick={() => setEditando(false)}>
              listo
            </button>
          ) : (
            <>
              <button type="button" className="enlace" onClick={() => setEditando(true)}>
                editar
              </button>
              {hayLista && (
                <>
                  <span aria-hidden="true"> · </span>
                  <button type="button" className="enlace" onClick={copiar}>
                    {copiado ? 'copiado' : 'copiar'}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {editando ? (
        <textarea
          className="lista-texto"
          aria-label="tu lista de contenidos"
          value={datos.contenidos}
          onChange={(e) => {
            const texto = e.target.value
            cambiar((d) => cambiarContenidos(d, texto))
          }}
          autoFocus
        />
      ) : hayLista ? (
        <Lista texto={datos.contenidos} cambiar={cambiar} />
      ) : (
        <p className="vacio">aquí va tu lista de contenidos, tal cual la escribes</p>
      )}
    </section>
  )
}

function Lista({ texto, cambiar }: { texto: string; cambiar: Cambiar }) {
  // Los renglones seguidos van juntos en una lista; títulos y semanas van sueltos
  const partes: ReactNode[] = []
  let grupo: ReactNode[] = []
  const cerrarGrupo = () => {
    if (grupo.length) partes.push(<ul key={`g${partes.length}`} className="renglones">{grupo}</ul>)
    grupo = []
  }

  for (const r of leerLista(texto)) {
    if (r.tipo === 'cosa') {
      grupo.push(
        <li key={r.linea} className={r.hecho ? 'renglon hecho' : 'renglon'}>
          <Circulo
            hecho={r.hecho}
            texto={r.texto || r.fecha}
            onTocar={() => cambiar((d) => cambiarContenidos(d, marcarRenglon(d.contenidos, r.linea)))}
          />
          <span className="renglon-texto">{r.texto}</span>
          {r.fecha && <span className="fecha">{r.fecha}</span>}
        </li>,
      )
      continue
    }
    cerrarGrupo()
    partes.push(
      r.tipo === 'titulo' ? (
        <p key={r.linea} className="lista-titulo">{r.texto}</p>
      ) : (
        <h4 key={r.linea} className="lista-semana">{r.texto}</h4>
      ),
    )
  }
  cerrarGrupo()
  return <div className="lista">{partes}</div>
}
