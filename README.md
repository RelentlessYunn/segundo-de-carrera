# Segundo de Carrera

Panel del curso 2026/27 — Doble Grado en Ingeniería Informática y ADE, UC3M.

Horario semanal, calendario del curso, fichas por asignatura con evaluación
y temario, avisos por semana y lista de pendientes.

## Archivos

| Archivo | Qué contiene |
|---|---|
| `index.html` | Estructura de la página |
| `styles.css` | Diseño |
| `data.js` | Asignaturas, horario, profesorado, fechas, calendario académico, avisos |
| `eval.js` | Sistema de evaluación y temario de cada asignatura |
| `app.js` | Toda la lógica de renderizado |

Para cambiar contenido: `data.js` casi siempre, `eval.js` para evaluación y temario.

## Guardado

El guardado de marcas y notas necesita un `config.js` local:

```js
window.CONFIG = { BIN_ID: "...", API_KEY: "..." };
```

Está en `.gitignore` y no se sube. Sin él la página funciona igual,
pero las marcas duran solo la sesión.
