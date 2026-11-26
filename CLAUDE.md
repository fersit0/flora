# Reglas para la IA en este proyecto

Esta es la app "Flora". Antes de tocar nada, lee `BRIEF.md` y `DISENO.md` completos, y `privado/CONTENIDO.md` para entender a quién le sirve. Si algo no está en esos documentos, pregunta.

## Con quién trabajas

Con Fer. No programa: todo lo construye con IA. Explícale sin jerga, en español mexicano directo, y dile qué tiene que hacer él con pasos concretos (por ejemplo, qué botón de GitHub Desktop). La app es para su novia; ella da el visto bueno de cómo se ve.

## Privacidad: la regla que no se rompe

El repo y la página son públicos.

- La carpeta `privado/` nunca se sube. Está en `.gitignore`; no la saques de ahí ni copies nada de ella a otro lado.
- Nada de `privado/` entra al código, a las pruebas, a los datos de ejemplo, a los nombres de archivos, a los commits ni a las capturas de las pruebas. Eso incluye su nombre, su usuario, los nombres de sus clientes, sus horarios y sus listas.
- La semana de ejemplo del repo es inventada: otros nombres, otros horarios.
- Antes de cada commit, revisa que no vaya nada personal. Si dudas, pregunta.

## Lo técnico (fijo, igual que FM)

- Vite, React y TypeScript.
- CSS propio con variables en un solo archivo. Sin Tailwind ni librerías de componentes.
- Datos en el teléfono: IndexedDB con `idb`, preferencias en localStorage, `navigator.storage.persist()`.
- PWA con `vite-plugin-pwa`: instalable desde Safari, funciona sin internet, avisa cuando hay versión nueva.
- Dependencias de producción: `react`, `react-dom` e `idb`. Para agregar otra, primero pregunta y explica por qué.
- Fuentes Lora y DM Sans dentro del proyecto, no desde internet.
- Publicación: GitHub Actions en cada push a `main` instala, corre pruebas, arma y publica en GitHub Pages. Si fallan las pruebas, no se publica. En `vite.config.ts` va `base: '/NOMBRE-DEL-REPO/'`.
- La lógica va separada de las pantallas en `src/logic/`, con pruebas en vitest: leer y escribir la lista en su formato de texto, leer los datos de la semana, armar y leer el respaldo.
- Pruebas de pantalla con Playwright a 440 × 956 y a 393 × 852.
- `?demo=1` carga la semana de ejemplo sin tocar los datos guardados.

## Cómo se trabaja

- Por fases, en el orden de `BRIEF.md`. Cada fase se le enseña a Fer funcionando antes de empezar la siguiente.
- No agregues nada que no esté pedido. Si se te ocurre algo útil, propónlo en una línea y espera.
- Arregla solo lo que se rompe. No reescribas lo que ya funciona.
- Para pulir: mide, haz una lista numerada, espera a que Fer la apruebe y luego cambia.
- Cada cambio en su rama, con pruebas y commit en español.
- Nunca digas que algo funciona sin haberlo corrido. Si no pudiste probarlo (por ejemplo, una liga que solo se puede probar en su teléfono), dilo.

## Lo que más importa de esta app

- La pantalla principal cabe sin deslizar. Hay una prueba para eso; no la aflojes.
- El texto de sus listas entra y sale idéntico. Hay una prueba para eso también.
- Nada regaña: sin contadores de pendientes, sin rojo, sin avisos.
- Los textos de la app siguen la voz de `DISENO.md`.
- Una liga que no abre se quita. No se deja un botón que no hace nada.
