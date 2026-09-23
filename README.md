# Segundo de Carrera

Panel del curso 2026/27 — Doble Grado en Ingeniería Informática y ADE, UC3M.
Web estática (HTML, CSS y JavaScript sin librerías ni compilación) publicada en GitHub Pages:
<https://relentlessyunn.github.io/segundo-de-carrera/>

> **Para Claude:** antes de tocar nada, lee este archivo entero. Clona el repo
> (`git clone https://github.com/RelentlessYunn/segundo-de-carrera`) para trabajar
> sobre la última versión publicada, cambia solo los archivos que hagan falta,
> sube el número de versión (ver *Publicar una versión*) y pasa las pruebas.

---

## Qué hay en la web

| Parte | Qué hace |
|---|---|
| **Inicio** (casita, `#home`) | Elegir entre **UC3M** y **Nolan**. La tarjeta UC3M resume la semana, la clase de ahora y la próxima prueba. |
| **Horario** | *Hoy*: clases del día con su aula, línea roja de la hora y "quedan X min"; próximos 7 días; fechas y consejos de la semana. Debajo, horario semanal y calendario mensual. |
| **Asignaturas** | Una ficha por asignatura: horario y aulas, profesorado, evaluación con calculadora de nota, fechas y temario con progreso. |
| **Exámenes** | Todo lo evaluable, con filtros. Lo ya pasado sale atenuado. |
| **Pendientes** | Tareas por asignatura y generales. Las marcas se guardan en la nube. |
| **Profesorado** | Tabla con correo y despacho. |
| **Notas para Claude** (`#notas`) | Texto libre guardado en la nube. **Claude no puede leer JSONBin**: para pasárselas, botón *Copiar notas* y pegar en el chat. |
| **Nolan** (`#nolan`) | En construcción. |

En el móvil las pestañas van abajo y se cambia de una a otra deslizando el dedo.

---

## Mapa de archivos

Cada archivo hace una sola cosa. Para cambiar algo, normalmente basta con abrir uno o dos.

### Datos (lo que más se toca)

| Archivo | Contiene |
|---|---|
| `data.js` | Asignaturas (`SUBJ`), horario (`CLASSES`), profesorado (`PROFS`), fechas evaluables (`CAL`), cuatrimestres (`CUATRIS`), calendario académico (`ACAD`), consejos por semana (`AVISOS`) y tareas (`TAREAS`, `GENERALES`). |
| `eval.js` | Evaluación y temario de cada asignatura (`EVAL`). |
| `config.js` | Clave de JSONBin para guardar en la nube. Sin él, la web funciona pero no guarda. |

### Código (`js/`), en el orden en que se carga

| Archivo | Qué hace |
|---|---|
| `base.js` | Herramientas comunes: fechas, semanas, cuatrimestre en vigor, qué clases hay un día (`clasesDe`), textos de las fechas (`etiquetaEv`, `cuandoEv`), panel de detalle, aviso de fallos. |
| `comprobar.js` | Revisa `data.js` y `eval.js` antes de pintar. Lo que rompería la página se aparta y se avisa arriba. Lo raro se avisa en la consola y en `#debug`. |
| `derivados.js` | Calcula solo: choques entre clases (se añaden a `CAL`) y colocación en la rejilla. |
| `nube.js` | Guardado en JSONBin, por cambios, en cola y sin pisar nada (ver *La nube*). |
| `cabecera.js` | Reloj, fecha, semana y cifras. Es el único reloj: emite los eventos `minuto` y `nuevoDia`. |
| `horario.js` | Horario semanal (rejilla y lista por días) y barra de estado de choques. |
| `hoy.js` | El visor de *Hoy*. |
| `asignaturas.js` | Fichas y calculadora de notas (`fichaHTML`, `recalcular`). |
| `profesorado.js` · `examenes.js` · `pendientes.js` · `notas.js` · `planificador.js` | Una pestaña o bloque cada uno. |
| `nolan.js` | **La sección Nolan.** Todo lo nuevo de Nolan va aquí. |
| `inicio.js` | La ventana de inicio (UC3M / Nolan). |
| `pestanas.js` | Rutas (`#horario`, `#home`, `#nolan/…`), pestañas, gesto de deslizar y tecla Escape. |
| `diagnostico.js` | Panel `#debug` con medidas de pantalla y avisos de datos. |
| `magia.js` | Onda al pulsar, confeti y *reposo* (pausa los adornos tras 45 s sin tocar nada). |

### Diseño (`css/`)

`base` · `cabecera` · `barra` · `hoy` · `horario` · `planificador` · `asignaturas` · `examenes` · `pendientes` · `inicio` · `nolan` · `efectos`.
Cada uno trae sus propios ajustes para móvil al final.

---

## Cómo añadir cosas

**Una fecha evaluable** → `data.js`, lista `CAL`:

```js
{id:"ed", date:"2026-11-13", what:"Segundo parcial: bloque 2", w:"25 %", type:"ex",
 hora:"09:00–10:30", aula:"Aula 2.2.C04", formato:"Presencial y escrito", temario:"Temas 5 y 6"}
```

- `type`: `ex` examen · `en` entrega · `cl` clase o laboratorio · `cf` choque.
- La semana y el texto de la fecha ("vie 13 nov") se calculan solos.
- Si **no se sabe el día**: pon el sábado de esa semana y `sinDia:1`. Sale como "semana N".
- Si **dura varios días** (un test online abierto de lunes a sábado): `hasta:"2026-10-31"`.
- Si es **online**: `online:1`. Así no se avisa de que ese día no hay clase.
- En la ficha de la asignatura, en *Hoy*, en el calendario, en *Exámenes* y en la semana aparece sola.

**Una clase** → `data.js`, lista `CLASSES`:

```js
{id:"ec", d:3, a:840, b:930, t:"laboratorio", au:"INF 7.0.J04", r:"24 sep · 22 oct", grp:"82",
 dates:["2026-09-24","2026-10-22"]}
```

- `d`: 0 = lunes … 4 = viernes.
- `a`/`b`: minutos desde medianoche (840 = 14:00).
- Una clase semanal lleva `from`/`to`; una de fechas sueltas lleva `dates`.
- La media anchura, el rayado de fechas sueltas y los choques se calculan solos.

**Una tarea** → `TAREAS.<asignatura>` o `GENERALES`: `["Título","Detalle"]`.
Cada marca va ligada al título, así que se pueden borrar o reordenar tareas sin que se muevan las demás.

**Consejos de una semana** → `AVISOS[cuatrimestre][semana]`.
Solo consejos: las fechas de esa semana se añaden solas encima.

**El 2.º cuatrimestre**:

1. Nuevas entradas en `SUBJ` con `cuatri:2`.
2. Sus clases en `CLASSES`, su evaluación en `EVAL` y su profesorado en `PROFS`.
3. Si quieres, consejos en `AVISOS[2]`.

A partir del 26 de enero la web enseña sola esas asignaturas. El progreso del temario, las cifras de arriba y el rótulo cambian también. Mientras no estén metidas, sigue enseñando las del 1.º.

**Nolan** → `js/nolan.js` (contenido) y `css/nolan.css` (diseño). Admite subpáginas: `#nolan/lo-que-sea` llega a `Nolan.pintar(caja, "lo-que-sea")`.

---

## Reglas del código

- **Sin librerías ni compilación.** Cada archivo de `js/` es un script normal. Lo que se declara arriba del todo con `const` o `function` en uno se ve desde los siguientes.
- **Un error en un archivo no tumba los demás.** Además, aparece un aviso rojo arriba con el archivo y el mensaje.
- **Eventos** (`document.addEventListener`):
  - `minuto`: cambia el minuto.
  - `nuevoDia`: cambia el día; lleva la fecha en `detail`.
  - `pestana`: se abre una pestaña.
  - `nube`: cambia el estado del guardado; lleva `{tipo, texto}` en `detail`.
- **Fechas** como texto `"AAAA-MM-DD"`. Para operar con ellas, `deISO` (mediodía, a prueba de cambio de hora) y `sumaDias`.
- **Estilo del código**: español, comentarios que explican el *porqué*, nada escrito a mano si se puede calcular de los datos.

## La nube

`nube.js` guarda en JSONBin las marcas de tareas (`hechas`), las notas de examen (`grades`) y las notas para Claude (`notas`).

- Hasta que la primera lectura va bien **no se escribe nada**. Se reintenta sola y lo que cambies espera en cola.
- Se guarda **por cambios** ("esta tarea hecha", "esta nota") sobre una relectura fresca, así nunca se pisa lo que no has tocado.
- Al esconder o cerrar la app se vacía lo pendiente. Al volver tras un rato, se relee.

## Publicar una versión

1. Sube el número en `index.html`: el pie (`<p class="ver">v40</p>`) y todos los `?v=40`, que se cambian a la vez.
2. Sube a GitHub los archivos cambiados, respetando las carpetas `js/` y `css/`.
3. GitHub Pages tarda uno o dos minutos. El número del pie dice qué versión estás viendo.

## Pruebas

```
node pruebas/pruebas.js
```

Hacen falta Node y Playwright. Son 32 comprobaciones en un navegador real:

- que la página carga sin errores;
- las pestañas;
- la línea roja a distintas horas, el cambio de minuto y la medianoche;
- las fechas sin día y las de varios días;
- la nube, con JSONBin simulado: primera lectura fallida o lenta y migración de marcas antiguas;
- las notas con coma;
- la ventana de inicio;
- el gesto de deslizar;
- el reposo.

Añade una prueba cuando arregles un fallo.

---

## Hoja de ruta

Ordenada por lo que más se va a notar.

1. **Fechas de exámenes finales.** Las ventanas oficiales son del 16 al 22 de diciembre y del 11 al 25 de enero. Faltan los días; en cuanto salgan, a `CAL`.
2. **Temario de cada examen** (`temario` en `CAL`). Ya se muestra en el detalle cuando existe.
3. **2.º cuatrimestre.** La estructura ya está preparada: solo faltan los datos (ver arriba).
4. **Nolan.** Definir qué es y construirlo en `nolan.js`.
5. **Exámenes al calendario del móvil.** Un botón "Añadir a mi calendario" que genere un `.ics` con todo `CAL`, para tener avisos del propio teléfono sin depender de la web.
6. **Funcionar sin conexión.** Un *service worker* para abrir la web sin cobertura y cargar al instante. Pide cuidado con las versiones, para no quedarse con una copia vieja.
7. **Media del cuatrimestre.** Con las notas de la calculadora y los ECTS, la media ponderada y qué hace falta en cada final.
8. **Hora de Madrid fija**, aunque el móvil esté en otra zona horaria (viajes).
9. **Pruebas automáticas en GitHub.** Pasar `pruebas/pruebas.js` con GitHub Actions cada vez que se sube algo.
10. **Modo claro** opcional, para leer a pleno sol.
