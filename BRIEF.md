# BRIEF: Flora

Este documento dice qué hace la app y qué no. La IA lo lee completo antes de tocar código. Si algo no está aquí ni en `DISENO.md`, pregunta antes de inventarlo.

Este archivo se publica en GitHub. No lleva nombres ni datos de la usuaria. Todo lo personal vive en `privado/`, que no se sube (ver `CLAUDE.md`).

## Qué es

Una app web que se instala en el iPhone (PWA) y usa una sola persona. Es su semana en una pantalla: abre y ve su horario de lunes a viernes, con un color por cada responsabilidad. Cada bloque es una puerta: lo toca y se abre lo que necesita en ese momento (sus pendientes de ese trabajo, su lista de contenidos, sus ideas, una liga).

No tiene servidor ni cuentas. Todo se guarda en el teléfono. Se publica gratis en GitHub Pages, con la misma receta que FM.

## Para quién y por qué

Una creadora de contenido con varias responsabilidades a la vez (un trabajo con horario fijo, dos clientes, su propio contenido y su vida). Hoy lleva sus listas en un grupo de WhatsApp consigo misma y su horario en una imagen. Pidió "todo en un mismo lugar": su horario al abrir y, con un toque, lo de cada cosa.

Lo que sabemos de cómo usa las herramientas, y que manda sobre cualquier idea de diseño:

- Suelta todo lo que hay que mantener o que se siente pesado. Conserva lo que no le pide nada.
- Anota en WhatsApp porque es lo más rápido. Si anotar aquí es más lento que eso, regresa a WhatsApp.
- Los muros de texto y sentirse evaluada la estresan. Lo visual, corto y cálido le funciona.
- Usa casi puro celular.

## Las cinco reglas del producto

1. **Abrir es ver.** La app abre directo en el horario. Sin bienvenida, sin menú, sin inicio de sesión.
2. **Cabe en una pantalla.** El horario completo se ve sin deslizar en su iPhone 17 Pro (402 × 874 puntos; Fer lo confirmó el 26 nov 2026). El detalle va adentro de cada bloque, no en la pantalla principal.
3. **Un toque y llegaste.** Tocar un bloque abre una hoja que sube desde abajo. Se cierra y sigues en tu semana. Nunca más de un nivel de profundidad.
4. **Anotar tan rápido como en WhatsApp.** Un campo siempre visible, escribes, Enter. Y se puede pegar una lista entera tal como ella la escribe.
5. **Nunca regaña.** Sin rachas, sin atrasos en rojo, sin avisos, sin contadores de pendientes. Si un día no la abre, no pasa nada.

## La idea central: la semana son datos, no código

La app no trae "su" semana escrita en el código. Trae un motor que dibuja cualquier semana a partir de un archivo de datos (ver `privado/semana.json` para el formato real).

Esto resuelve tres cosas:

- **Privacidad.** El repo y la página son públicos. Su horario (dónde está cada día y a qué hora) no puede estar ahí. En el repo solo va una semana de ejemplo inventada. La suya entra a su teléfono con su liga de instalación (ver "Datos y respaldo").
- **Que no se quede vieja.** Su semana va a cambiar (cuando termine su servicio, cuando cambie un cliente). Ella misma la edita desde la app, sin volver a programar.
- **Pruebas.** La semana de ejemplo sirve para probar todo sin tocar datos reales.

Modelo:

- **Bloque:** día, hora de inicio y fin, color, emoji, nombre corto, detalle, y qué abre.
- **Qué abre un bloque:** un *espacio*, una *liga*, las *comidas*, o nada.
- **Espacio:** una hoja con contenido que ella edita. Tres tipos:
  - `pendientes`: solo lista de pendientes.
  - `cliente`: pendientes + lista de contenidos por semana.
  - `ideas`: lista de ideas.
- Varios bloques pueden abrir el mismo espacio (grabar, editar y propuesta de un mismo cliente abren la misma hoja).

## Qué hace (primera versión)

### Pantalla principal
- Horario de lunes a viernes, de 8 am a 10 pm, con los bloques de colores.
- Cada bloque muestra emoji y nombre corto. Nada más.
- El día de hoy se distingue (columna resaltada) y una línea delgada marca la hora actual. *Propuesta de Claude, no lo pidió ella; se quita si no le gusta.*
- Abajo: sábado y domingo.

### Hoja de un espacio tipo `pendientes`
- Lista de pendientes. Tocar el círculo lo marca como hecho.
- Campo fijo para agregar: escribir y Enter.
- Tocar el texto lo edita. Los hechos se juntan abajo en "hechos", con un botón para borrarlos.

### Hoja de un espacio tipo `cliente`
- Lo mismo de pendientes, y debajo su **lista de contenidos**.
- La lista se guarda como texto en el formato que ella ya usa:
  ```
  Semana 1
  Video largo Velas 3/03 ✅
  Video corto Tazas 5/03

  Semana 2
  Carrusel Regalos 10/03
  ```
  (Ejemplo inventado. Sus listas reales están en `privado/CONTENIDO.md`.)
- La app lo dibuja bonito: "Semana n" como encabezado, cada renglón con su círculo, la fecha a la derecha si el renglón termina en algo tipo `16/11`.
- Tocar el círculo pone o quita el ✅ en el texto.
- "Editar" abre el texto tal cual para escribir o **pegar la lista completa**. "Copiar" lo copia igualito, para WhatsApp.
- El texto que entra es el que sale: pegar, marcar y copiar no le cambia ni un espacio a lo demás.

### Hoja de ideas
- Lista de ideas, la más nueva arriba. Campo fijo para agregar.
- Tocar para editar. "Ya la usé" la manda al final.

### Ligas
- Un bloque puede abrir una liga: su planeador de contenido, la app del gimnasio, el correo.
- **Hay que probarlo en su teléfono.** Las ligas web normales abren. Las que brincan a otra app pueden no abrir. Si una no abre, el bloque se queda sin acción; nunca un botón que no hace nada.

### Sábado, domingo y el resumen de cada cosa
- Sábado y domingo muestran su texto corto; al tocarlos, el largo.
- El resumen por responsabilidad (por ejemplo "viernes mando la propuesta, martes grabo, miércoles edito") no es un botón. Va como una línea bajo el título de la hoja de cada espacio. En el primer mockup era un botón "por cada cosa" y ella no lo entendió.

### Datos y respaldo
- **Abre con su semana desde la primera vez, sin pegar nada.** Fer corre `node scripts/liga.mjs` en su compu: lee `privado/semana.json` y sus listas de `privado/CONTENIDO.md` y deja en `privado/liga-de-instalacion.txt` una liga de Flora con todo eso comprimido después de `?semana=`. Se la manda por WhatsApp; ella la abre en Safari y la agrega a inicio, y la app instalada abre ya con su semana y sus listas.
  - Esa liga es privada: trae su horario adentro. No se publica en ningún lado; solo pasa por el servidor de GitHub cuando ella la abre.
  - Lo que se probó en el simulador (27 nov 2026): al agregar a inicio, el iPhone instala la app en la dirección que dice el manifiesto (`/flora/`) y tira todo lo que trae la liga, sea después de `#` o de `?`. Por eso, cuando la página se abre con su liga, no lleva manifiesto: así el iPhone instala la liga completa.
  - La liga solo carga la semana la primera vez. Si ya hay una semana guardada, no la pisa.
- Quien abre la página sin su liga ve directo la semana de ejemplo. En ajustes puede pegar su semana o un respaldo.
- Ajustes (se llega tocando el solecito): **editar mi semana**, pegar semana nueva, **copiar respaldo** de todo (semana + pendientes + listas + ideas) y **pegar respaldo** para restaurar.
- El texto que se pega es JSON. La semana y el respaldo usan el mismo formato: un respaldo es la semana más lo que ella escribió. Así se le puede instalar la app ya con sus listas cargadas.
- Si se borra el ícono de la app, iOS borra sus datos. Por eso el respaldo es texto que ella puede guardar en su WhatsApp.
- Guardado: IndexedDB con `idb`, y se pide `navigator.storage.persist()`.
- Aviso discreto cuando hay versión nueva de la app.

### Editar su semana
- En ajustes, "editar mi semana": el horario entra en modo edición (dice "editando", con un botón "listo" para salir).
- Tocar un bloque abre una hoja para cambiar nombre, emoji, de qué es, día, hora de inicio y de fin, y qué toca ahí; ahí también se borra (pide un segundo toque).
- Tocar un hueco crea ahí un bloque nuevo de una hora (o menos, si no cabe).
- Lo que abre cada bloque sale de "de qué es" (los tipos que hay en su semana: sus clientes, sus ligas, las comidas, "para mí"…). No se configura.
- Si el nombre no cabe en el bloque o dos bloques se enciman, lo dice en una frase amable y no lo guarda: se queda lo último que sí quedaba bien.
- Sábado y domingo: su texto corto y el largo.
- Los cambios se guardan solos y entran al respaldo. Fuera del modo edición todo funciona igual.

## Después (no entra en la primera versión)

- **Comidas.** Desayuno, comida y cena abren opciones, con dos modos: en casa y en la calle. Las opciones salen del plan que ella misma va a mandar. Las "recomendaciones" a partir de sus equivalentes se preparan antes (las arma Claude con Fer y entran como datos); la app no tiene IA adentro. Mientras no exista, esos bloques no abren nada.

## Qué no hace

- No es calendario: no tiene fechas reales ni eventos. Es una semana tipo que se repite.
- No lleva dinero.
- No manda avisos ni recordatorios.
- No mide hábitos, rachas ni cumplimiento.
- No sincroniza con otros dispositivos ni tiene cuentas.
- No tiene IA adentro.
- No guarda historial de meses pasados.
- No reemplaza su planeador de contenido propio: ese vive aparte y aquí solo hay una liga.
- El bloque de "lo que quedó pendiente" y el de arreglarse no abren nada.

## Cómo sabemos que quedó bien

Pruebas automáticas (si fallan, no se publica):

1. **Cabe sin deslizar** a 440 × 956 y a 393 × 852: la página no mide más que la pantalla y ningún bloque corta su texto.
2. **Ida y vuelta de la lista:** pegar un texto en su formato, marcar un renglón y copiar regresa el mismo texto con solo ese ✅ de diferencia.
3. **Lo guardado sobrevive** a cerrar y volver a abrir.
4. **Pegar datos malos no rompe nada:** si el texto pegado no sirve, lo dice en una frase y conserva lo que había.
5. Ningún dato de `privado/` aparece en el código, las pruebas ni los ejemplos.

Pruebas a mano en su teléfono, antes de dársela:

6. Instalada desde su liga, abre a pantalla completa y directo en su semana. Aquí se revisa en su pantalla real (iPhone 17 Pro, 402 × 874; al principio se asumió 440 × 956).
7. Cada liga: abre o se quita.
8. Agregar un pendiente toma menos de 5 segundos desde que toca el bloque.
9. El respaldo copiado se puede pegar en WhatsApp y volver a pegar en la app.

La prueba que cuenta, a las dos semanas de uso:

- El ícono sigue en su primera pantalla y la abre sin que nadie se lo recuerde.
- Dejó de llevar las listas de sus clientes en WhatsApp.
- Pidió algún cambio (señal de que la siente suya).

Si la suelta en la primera semana, no se le agregan funciones: se le pregunta qué le estorbó.

## Fases

Cada fase se ve funcionando antes de pasar a la siguiente.

0. **Mockups aprobados.** Hecho el 25 nov 2026: vio la pantalla principal y una hoja y eligió la dirección. Los aprobados son `privado/mockups/flora_01_pantalla.png` y `flora_02_hoja.png`.
1. **Base y pantalla principal.** Proyecto, semana de ejemplo, horario dibujado desde datos, cabe sin deslizar, día de hoy.
2. **Hojas.** Pendientes, cliente (con la lista en su formato) e ideas. Guardado en el teléfono.
3. **Datos.** Pegar semana, copiar y pegar respaldo, ajustes.
4. **Lo demás de la pantalla.** Sábado y domingo, ligas.
5. **Diseño fino, ícono, instalar y publicar.** Prueba en su teléfono con sus datos reales.
6. **Su semana desde la primera vez y editarla desde la app.** Pedido por Fer el 27 nov 2026: la liga de instalación y el modo edición.
7. **Comidas**, cuando ella mande su plan.

## Nombre e ícono

Decidido por ella el 25 nov 2026:

- **Nombre: Flora.** Repo: `flora`. Es el título de la pantalla y el nombre bajo el ícono.
- **Ícono:** el sol con carita sobre fondo vino (`privado/mockups/flora_icono.png`).
- **Dirección visual: tierna.** Es la que describe `DISENO.md`. Las otras tres que vio (revista, rosa fuerte, suave) quedan en `privado/mockups/vibra_*.png` solo como registro.
