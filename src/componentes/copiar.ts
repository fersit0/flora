/** Copia el texto tal cual. Regresa si se pudo. */
export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    // Plan B para navegadores que no dejan usar el portapapeles directo
    try {
      const campo = document.createElement('textarea')
      campo.value = texto
      campo.setAttribute('readonly', '')
      campo.style.position = 'fixed'
      campo.style.opacity = '0'
      document.body.append(campo)
      campo.select()
      const pudo = document.execCommand('copy')
      campo.remove()
      return pudo
    } catch {
      return false
    }
  }
}
