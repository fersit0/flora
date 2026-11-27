// El "tic" que se siente en el dedo al marcar algo, como en las apps del iPhone.
// En Safari no hay una forma directa: el truco es tocar un interruptor (<input switch>)
// escondido, que iOS acompaña con su tic. Solo funciona dentro de un toque. En Android
// se usa la vibración. Si el teléfono no sabe hacerlo, no pasa nada.

export function tic() {
  try {
    if (navigator.vibrate?.(10)) return
    const etiqueta = document.createElement('label')
    etiqueta.ariaHidden = 'true'
    etiqueta.style.display = 'none'
    const interruptor = document.createElement('input')
    interruptor.type = 'checkbox'
    interruptor.setAttribute('switch', '')
    etiqueta.append(interruptor)
    document.head.append(etiqueta)
    etiqueta.click()
    etiqueta.remove()
  } catch {
    // Sin tic, igual se marcó
  }
}
