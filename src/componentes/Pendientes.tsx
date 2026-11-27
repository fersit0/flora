import { agregarPendiente, borrarHechos, editarPendiente, marcarPendiente, type DatosEspacio, type Pendiente } from '../logic/espacio'
import { Agregar, Circulo, TextoEditable } from './Renglon'
import { nuevoId, type Cambiar } from './useEspacio'

interface Props {
  datos: DatosEspacio
  cambiar: Cambiar
  nombre: string
  /** Dónde se guarda lo que lleva escrito en el campo */
  borrador: string
}

export function Pendientes({ datos, cambiar, nombre, borrador }: Props) {
  const faltan = datos.pendientes.filter((p) => !p.hecho)
  const hechos = datos.pendientes.filter((p) => p.hecho)

  return (
    <section className="seccion seccion-pendientes" aria-label="pendientes">
      <h3 className="seccion-titulo">pendientes</h3>
      {faltan.length === 0 && <p className="vacio">aquí van tus pendientes de {nombre} ☆</p>}
      <ul className="renglones">
        {faltan.map((p) => (
          <FilaPendiente key={p.id} pendiente={p} cambiar={cambiar} />
        ))}
      </ul>
      <Agregar
        texto="+ escribe un pendiente…"
        recordar={borrador}
        onAgregar={(textos) => cambiar((d) => textos.reduce((x, t) => agregarPendiente(x, t, nuevoId()), d))}
      />
      {hechos.length > 0 && (
        <>
          <div className="sub">
            <h4>hechos</h4>
            <button type="button" className="enlace" onClick={() => cambiar(borrarHechos)}>
              borrar
            </button>
          </div>
          <ul className="renglones">
            {hechos.map((p) => (
              <FilaPendiente key={p.id} pendiente={p} cambiar={cambiar} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function FilaPendiente({ pendiente: p, cambiar }: { pendiente: Pendiente; cambiar: Cambiar }) {
  return (
    <li className={p.hecho ? 'renglon hecho' : 'renglon'}>
      <Circulo hecho={p.hecho} texto={p.texto} onTocar={() => cambiar((d) => marcarPendiente(d, p.id))} />
      <TextoEditable texto={p.texto} onCambiar={(t) => cambiar((d) => editarPendiente(d, p.id, t))} />
    </li>
  )
}
