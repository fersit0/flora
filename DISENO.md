# DISEÑO: Flora

> **Dirección elegida por ella el 25 nov 2026: "tierna".** Vio cuatro (tierna, revista, rosa fuerte, suave) y se quedó con esta. Los mockups aprobados son `privado/mockups/flora_01_pantalla.png` y `flora_02_hoja.png`.

Cómo se ve y cómo se siente. Los mockups están en `privado/mockups/` (no se suben porque traen su semana real). La imagen de referencia que a ella le encantó está en `privado/referencia/mi_semana.png`: la app es esa imagen, viva.

## De dónde sale

Su estética es scrapbook: cuadros vichy, flores, estrellas, polaroids. Su símbolo es el sol. La app usa poco de eso y lo usa en un solo lugar (la franja vichy de arriba y el solecito), para que el horario sea lo que se ve.

## Colores

Definidos como variables en un solo archivo CSS.

| Variable | Valor | Uso |
|---|---|---|
| `--vino` | `#6E1E3B` | texto, bloques de "lo mío", botones principales |
| `--rosa` | `#E7A3BE` | bloques de un cliente, cuadros vichy |
| `--rosa-claro` | `#F7D3E0` | fondo del vichy |
| `--pistache` | `#CDD88F` | bloques del trabajo con horario fijo |
| `--olivo` | `#66742F` | horas, encabezados chicos, texto secundario |
| `--mantequilla` | `#F3E0A0` | sábado y domingo, columna de hoy (a 55%) |
| `--sol` | `#EFC24A` | bloques del otro cliente, el solecito |
| `--marfil` | `#FAF5E6` | fondo de la app y de las hojas |
| `--papel` | `#FFFDF6` | bloques "para mí", campos de texto |

Texto sobre cada color (ya revisado que se lee):

- sobre pistache `#3C4619`, sobre rosa `#57152E`, sobre sol `#553C00`, sobre vino `--marfil`, sobre papel `--vino`.

Reglas:

- Cada color significa una responsabilidad. No se usa un color de responsabilidad para adornar.
- Los bloques "para mí" son papel con un borde fino vino al 22%.
- El bloque de pendientes sueltos es transparente con borde y rayas diagonales muy suaves.
- Sin rojo de error, sin verde de éxito. Lo hecho se ve con el círculo relleno vino y el texto tachado a media opacidad.
- Sin sombras grises. Sin degradados.

## Letras

- **Lora itálica 600** para títulos: el nombre de la app ("Flora"), los días, el título de cada hoja y sus secciones.
- **DM Sans** (500, 600, 700) para todo lo demás.
- Las dos van dentro de la app (no se piden a internet), para que funcione sin conexión.
- Emojis del sistema.

Tamaños en la pantalla principal (medidos en el mockup a 440 de ancho):

| Elemento | Tamaño |
|---|---|
| "Flora" (título) | 31 px |
| días (lun, mar…) | 15 px |
| nombre del bloque | 11.2 px, peso 700, interlineado 1.12 |
| emoji del bloque | 14 px |
| horas | 10.5 px |
| sábado, domingo | 15 px título, 11.5 px texto |

En las hojas el texto es grande, porque ahí sí se lee y se escribe: título 29 px, secciones 20 px, renglones 15.5 px, campo 15 px.

## Pantalla principal

```
┌──────────────────────────────────────┐
│ ▓▓▓▓▓▓ franja vichy (hora, isla) ▓▓▓ │  56
│ Flora                             ☀  │  50
│      lun   mar  (mié)  jue   vie     │  24   hoy = pastilla vino
│  8  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐    │
│  9  │   │ │   │ │   │ │   │ │   │    │
│ 10  ├───┤ ├───┤ ├───┤ ├───┤ ├───┤    │  14 horas
│ 11  │   │ │   │ │───│ │   │ │   │    │  ≈ 52 px cada una
│  …  │   │ │   │ │   │ │   │ │   │    │  (línea = ahora)
│  9  └───┘ └───┘ └───┘ └───┘ └───┘    │
│ [    sábado     ] [    domingo     ] │  50
│              ────                    │  30   indicador de inicio
└──────────────────────────────────────┘
```

- La franja vichy ocupa la zona de la hora y la isla del iPhone. Es lo único decorado.
- El solecito es el botón de ajustes. No dice "ajustes".
- La cuadrícula llena el alto que quede: el alto de cada hora se calcula, no es fijo. En su teléfono da unos 52 px.
- Columnas con 4 px entre ellas; margen izquierdo de 34 px para las horas y derecho de 10 px.
- Bloque: esquinas de 9 px, relleno de 4 px, emoji arriba y nombre abajo, alineados a la izquierda. Entre bloques, 3 px.
- Líneas de hora punteadas, vino al 16%.
- Columna de hoy con fondo mantequilla al 55% detrás de los bloques. Línea de "ahora" de 2 px vino con un punto a la izquierda.
- En fin de semana no hay columna de hoy; se resalta el recuadro de sábado o domingo.
- Área de toque mínima: 44 × 44 px. Los bloques de una hora miden unos 73 × 49, sí cumplen.

Nombres cortos: máximo dos renglones de unos 10 caracteres. Si un nombre no cabe, se acorta el nombre en los datos, no se achica la letra.

## Hojas

```
┌──────────────────────────────────────┐
│ (horario oscurecido, se alcanza a ver)│
│ ╭──────────────────────────────────╮ │
│ │              ───                 │ │  asa
│ │ 🎬 Nombre del cliente   [días]   │ │
│ │ pendientes                       │ │
│ │ ○ pendiente uno                  │ │
│ │ ○ pendiente dos                  │ │
│ │ ● pendiente hecho                │ │
│ │ [ + escribe un pendiente…      ] │ │
│ │ contenidos        editar · copiar│ │
│ │ Semana 1                         │ │
│ │ ● Video largo …            3/03  │ │
│ │ ○ Video corto …            5/03  │ │
│ ╰──────────────────────────────────╯ │
└──────────────────────────────────────┘
```

- Sube desde abajo y deja ver arriba un pedazo del horario, para que se sienta que no saliste.
- Se cierra tocando fuera, jalando el asa hacia abajo o con el gesto de atrás.
- Esquinas superiores de 28 px. Fondo marfil. Velo vino oscuro al 38%.
- La pastilla junto al título dice en qué días toca esa responsabilidad, con su color.
- Renglón: círculo de 22 px, texto, y a la derecha la fecha en olivo. Separador punteado.
- El campo para agregar se queda visible arriba del teclado cuando escribe.
- Adentro de la hoja sí se desliza si la lista es larga. La regla de no deslizar es de la pantalla principal.
- Animación: solo la hoja al subir y bajar (200 ms). Si el teléfono pide menos movimiento, aparece sin animación.

## Voz de los textos

- Primera persona y minúsculas, como su imagen: "mi semana", "lo mío", "a mi ritmo".
- Corto y cálido. Nunca una orden, nunca una cuenta de lo que falta.
- Campo vacío: "+ escribe un pendiente…", "+ anota una idea…".
- Lista vacía: "aquí van tus pendientes de Nombre ☆". Sin "no tienes nada".
- Error al pegar datos: "ese texto no lo pude leer. Tu semana sigue igual."
- Respaldo copiado: "copiado ☆ pégalo en tu WhatsApp".
- La estrella ☆ es su signo. Una por pantalla, máximo.

## Ícono

Elegido por ella: el sol con carita (el mismo de la pantalla) centrado sobre fondo vino `#6E1E3B`. Referencia a 1024 px en `privado/mockups/flora_icono.png`. Pidió "sol y fondo rosa fuerte" y de ocho opciones eligió esta.

El ícono se dibuja en SVG y se exporta a los tamaños que pide iOS. La pantalla de arranque es marfil.

## Lo que este diseño no hace

- Sin modo oscuro en la primera versión.
- Sin ilustraciones dentro del horario.
- Sin barra de navegación ni pestañas: solo hay una pantalla.
