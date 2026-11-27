import { agregarIdea, editarIdea, usarIdea, type DatosEspacio, type Idea } from '../logic/espacio'
import { Agregar, TextoEditable } from './Renglon'
import { nuevoId, type Cambiar } from './useEspacio'

export function Ideas({ datos, cambiar, borrador }: { datos: DatosEspacio; cambiar: Cambiar; borrador: string }) {
  const nuevas = datos.ideas.filter((i) => !i.usada)
  const usadas = datos.ideas.filter((i) => i.usada)

  return (
    <section className="seccion seccion-ideas" aria-label="ideas">
      <Agregar
        texto="+ anota una idea…"
        recordar={borrador}
        // Si pega varias, la primera queda hasta arriba
        onAgregar={(textos) => cambiar((d) => [...textos].reverse().reduce((x, t) => agregarIdea(x, t, nuevoId()), d))}
      />
      {nuevas.length === 0 && <p className="vacio">aquí van tus ideas ☆</p>}
      <ul className="renglones">
        {nuevas.map((i) => (
          <FilaIdea key={i.id} idea={i} cambiar={cambiar} />
        ))}
      </ul>
      {usadas.length > 0 && (
        <>
          <div className="sub">
            <h4>ya las usé</h4>
          </div>
          <ul className="renglones">
            {usadas.map((i) => (
              <FilaIdea key={i.id} idea={i} cambiar={cambiar} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function FilaIdea({ idea: i, cambiar }: { idea: Idea; cambiar: Cambiar }) {
  return (
    <li className={i.usada ? 'renglon idea usada' : 'renglon idea'}>
      <TextoEditable texto={i.texto} onCambiar={(t) => cambiar((d) => editarIdea(d, i.id, t))} />
      {!i.usada && (
        <button type="button" className="enlace" onClick={() => cambiar((d) => usarIdea(d, i.id))}>
          ya la usé
        </button>
      )}
    </li>
  )
}
