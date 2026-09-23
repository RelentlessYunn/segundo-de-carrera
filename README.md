# Segundo de Carrera

Dashboard for the 2026/27 year — Double Degree in Computer Engineering and Business Administration, UC3M.
A static site (HTML, CSS and JavaScript, no libraries, no build step) published on GitHub Pages:
<https://relentlessyunn.github.io/segundo-de-carrera/>

> **For Claude:** read this whole file before touching anything. Clone the repo
> (`git clone https://github.com/RelentlessYunn/segundo-de-carrera`) to work on the
> latest published version, change only the files you need, bump the version
> (see *Publishing a version*) and run the tests. Answer the owner in Spanish.

---

## What the site has

| Part | What it does |
|---|---|
| **Home** (house icon, `#home`) | Choose between **UC3M** and **Nolan**. The UC3M card sums up the week, the class now and the next assessment. |
| **Schedule** (`#schedule`) | *Today*: the day's classes with their room, the red "now" line and "X min left"; the next 7 days; the week's dates and advice. Below: weekly timetable and monthly planner. |
| **Subjects** (`#subjects`) | One card per subject: timetable and rooms, faculty, grading with a grade calculator, dates, and syllabus with progress. |
| **Exams** (`#exams`) | Everything graded, with filters. Past items are dimmed. |
| **Tasks** (`#tasks`) | Tasks per subject and general ones. Ticks are saved to the cloud. |
| **Faculty** (`#faculty`) | Table with email and office. |
| **Notes for Claude** (`#notes`) | Free text saved to the cloud. **Claude cannot read JSONBin**: to pass them on, press *Copy notes* and paste into the chat. |
| **Settings** (gear icon, `#settings`) | Language (Spanish / English), theme (dark / light / system) and animations (all / basic / none). Saved on each device. |
| **Nolan** (`#nolan`) | Under construction. |

On mobile the tabs sit at the bottom and you can swipe between them.
Old Spanish links (`#horario`, `#asignaturas`, `#notas`…) still work.

---

## Languages

- The **code** is in English: names, comments, files.
- The **interface** comes in Spanish and English (`js/i18n.js`). Every visible text goes through `t("key", {vars})`:
  - Add a new text to **both** `STRINGS.es` and `STRINGS.en`.
  - A plural is an object `{one, other}`, chosen by `vars.n` (or use `tn(key, n)`).
  - Static texts in `index.html` use `data-i18n` (text), `data-i18n-html`, `data-i18n-aria`, `data-i18n-title` and `data-i18n-placeholder`. The Spanish text is also written in the HTML, so the page reads fine before JavaScript runs.
  - Dates are formatted with `fmtLong`, `fmtShort`, `fmtDayShort`, `fmtDayMonth`, `fmtRange`, `fmtMonthYear`, `dayName` (mid-sentence form) and `termOrdinal`.
- The **data** (`data.js`, `eval.js`) stays in Spanish: it is copied from UC3M documents. Its keys are English.
- A missing translation falls back to Spanish and is listed in the `#debug` panel. The tests fail if any key is missing.

---

## File map

Each file does one thing. To change something you usually only need one or two.

### Data (what changes most)

| File | Contains |
|---|---|
| `data.js` | Subjects (`SUBJECTS`), timetable (`CLASSES`), faculty (`FACULTY`), graded dates (`EVENTS`), terms (`TERMS`), academic calendar (`CALENDAR`), weekly advice (`ADVICE`) and tasks (`TASKS`, `GENERAL_TASKS`). |
| `eval.js` | Grading and syllabus of each subject (`GRADING`). |
| `config.js` | JSONBin key for saving to the cloud. Without it the site works but does not save. |

### Code (`js/`), in load order

| File | What it does |
|---|---|
| `prefs.js` | Settings (`SETTINGS`, `saveSetting`), theme, and `lowMotion()` / `fullMotion()`. |
| `i18n.js` | Spanish and English texts (`t`, `tn`) and date formatting. |
| `core.js` | Shared helpers: dates, weeks, term in force, classes on a day (`classesOn`), event labels (`eventLabel`, `whenLabel`), detail panel, error banner. |
| `validate.js` | Checks `data.js` and `eval.js` before rendering. Whatever would break the page is left out and reported at the top; odd things go to the console and `#debug`. |
| `derived.js` | Computed data: clashes between classes (added to `EVENTS`) and the timetable grid layout. |
| `cloud.js` | Saving to JSONBin, by changes, queued and without overwriting anything (see *The cloud*). |
| `header.js` | Clock, date, week and figures. It is the only clock: it emits the `minute` and `newDay` events. |
| `schedule.js` | Weekly timetable (grid and list by day) and the clash status bar. |
| `today.js` | The *Today* viewer. |
| `subjects.js` | Subject cards and grade calculator (`subjectCard`, `recalc`). |
| `faculty.js` · `exams.js` · `tasks.js` · `notes.js` · `planner.js` · `settings.js` | One tab, page or block each. |
| `nolan.js` | **The Nolan section.** Everything new for Nolan goes here. |
| `home.js` | The home window (UC3M / Nolan). |
| `router.js` | Routes (`#schedule`, `#home`, `#nolan/…`), tabs, the swipe gesture and the Escape key. |
| `debug.js` | `#debug` panel with screen measurements, data warnings and missing translations. |
| `effects.js` | Ripple on tap, confetti and *idle* (decorations pause after 45 s without touching anything). |

### Design (`css/`)

`base` · `header` · `tabbar` · `today` · `schedule` · `planner` · `subjects` · `exams` · `tasks` · `home` · `nolan` · `settings` · `effects` · `light`.
Each one has its own mobile tweaks at the end.

- **Colours** are tokens on `:root` in `base.css` (`--paper`, `--card`, `--ink`, `--ink-2`, `--rule`, `--go`, `--warn`…). Use them instead of fixed colours.
- **Light theme**: `light.css` changes the tokens under `[data-theme=light]` and fixes the few fixed colours. The header and the home screen stay dark in both themes. If you add a fixed colour somewhere, add its light version there.
- **Animations setting**: `<html data-motion="full|basic|none">`. `basic` stops the decorations that move on their own; `none` stops everything (`effects.css`, section 13). In JavaScript, check `fullMotion()` for decorations and `lowMotion()` for everything else.

---

## How to add things

**A graded date** → `data.js`, list `EVENTS`:

```js
{subject:"ed", date:"2026-11-13", what:"Segundo parcial: bloque 2", weight:"25 %", type:"ex",
 time:"09:00–10:30", room:"Aula 2.2.C04", format:"Presencial y escrito", syllabus:"Temas 5 y 6"}
```

- `type`: `ex` exam · `en` submission · `cl` class or lab · `cf` clash.
- The week and the date label ("vie 13 nov") are computed.
- If **the day is unknown**: use that week's Saturday and `noDay:1`. It shows as "semana N". A custom text can go in `label`.
- If it **lasts several days** (an online test open Monday to Saturday): `until:"2026-10-31"`. The planner joins the first and last day with a line.
- If it is **online**: `online:1`, so there is no warning that there is no class that day.
- It shows up by itself in the subject card, *Today*, the planner, *Exams* and the week.

**A class** → `data.js`, list `CLASSES`:

```js
{subject:"ec", day:3, start:840, end:930, kind:"laboratorio", room:"INF 7.0.J04", when:"24 sep · 22 oct", group:"82",
 dates:["2026-09-24","2026-10-22"]}
```

- `day`: 0 = Monday … 4 = Friday.
- `start`/`end`: minutes since midnight (840 = 14:00).
- A weekly class has `from`/`to`; a class on loose dates has `dates`.
- Half width, hatching for loose dates and clashes are computed.

**A task** → `TASKS.<subject>` or `GENERAL_TASKS`: `["Title","Detail"]`.
Each tick is tied to the title, so tasks can be removed or reordered without moving the others.

**Advice for a week** → `ADVICE[term][week]`.
Advice only: that week's dates are added on top automatically.

**Term 2**:

1. New entries in `SUBJECTS` with `term:2`.
2. Their classes in `CLASSES`, grading in `GRADING` and faculty in `FACULTY`.
3. Optionally, advice in `ADVICE[2]`.

From 26 January the site shows those subjects by itself; syllabus progress, the header figures and the label change too. Until they are added, term 1 keeps showing.

**A new setting** → add its values to `SETTINGS_DEFAULTS` and `SETTINGS_OPTIONS` (`prefs.js`), a row in `ROWS` (`settings.js`) and its texts (`s.set.*` in `i18n.js`).

**Nolan** → `js/nolan.js` (content) and `css/nolan.css` (design). Sub-pages work: `#nolan/anything` reaches `Nolan.render(box, "anything")`.

---

## Code rules

- **No libraries, no build.** Each file in `js/` is a plain script. Anything declared at the top level with `const` or `function` in one file is visible from the next ones.
- **An error in one file does not take the others down.** A red banner at the top also shows the file and the message.
- **Events** (`document.addEventListener`):
  - `minute`: the minute changes.
  - `newDay`: the day changes; `detail` is the date.
  - `tab`: a tab opens; `detail` is its name.
  - `cloud`: the saving status changes; `detail` is `{kind, text}`.
  - `settings`: a setting changes without reloading (the theme); `detail` is `{key, value}`.
- **Dates** are `"YYYY-MM-DD"` strings. To work with them use `fromISO` (noon, safe from daylight-saving changes) and `addDays`.
- **Style**: English, comments that explain *why*, nothing written by hand if it can be computed from the data.

## The cloud

`cloud.js` saves to JSONBin the task ticks (`hechas`), the exam grades (`grades`) and the notes for Claude (`notas`). Those record keys stay in Spanish on purpose: renaming them would lose what is already saved.

- Nothing is written until the first read succeeds. It retries by itself and your changes wait in a queue.
- It saves **by changes** ("this task done", "this grade") on top of a fresh read, so it never overwrites what you did not touch.
- When the app is hidden or closed, pending changes are flushed. When you come back after a while, it reads again.

Settings are not in the cloud: they are per device (`localStorage`, key `settings`).

## Publishing a version

1. Bump the number in `index.html`: the footer (`<p class="version">v42</p>`) and every `?v=42`, all at once.
2. Upload the changed files to GitHub, keeping the `js/` and `css/` folders.
3. GitHub Pages takes a minute or two. The footer number tells you which version you are seeing.

## Tests

```
node tests/run.js
```

Needs Node and Playwright. 43 checks in a real browser:

- the page loads without errors;
- the tabs, and old Spanish links;
- the red line at different times, the minute change and midnight;
- dates without a day and multi-day windows (and the line that joins them in the planner);
- the cloud, with a simulated JSONBin: a failed or slow first read and migration of old ticks;
- grades with a comma;
- the home window;
- settings: light theme, English after reloading, every text translated in both languages, English dates, and the animation levels;
- the swipe gesture;
- idle.

Add a test whenever you fix a bug.

---

## Roadmap

Ordered by how much it will be noticed.

1. **Final exam dates.** The official windows are 16–22 December and 11–25 January. The days are missing; add them to `EVENTS` as soon as they are out.
2. **Syllabus of each exam** (`syllabus` in `EVENTS`). It already shows in the detail panel when present.
3. **Term 2.** The structure is ready: only the data is missing (see above).
4. **Nolan.** Decide what it is and build it in `nolan.js`.
5. **Exams in the phone's calendar.** An "Add to my calendar" button that generates an `.ics` with all `EVENTS`, so the phone itself gives reminders.
6. **Offline.** A *service worker* to open the site without signal and load instantly. Needs care with versions so an old copy is not kept.
7. **Term average.** With the calculator grades and the ECTS, the weighted average and what each final needs.
8. **Fixed Madrid time**, even when the phone is in another time zone (travel).
9. **Tests on GitHub.** Run `tests/run.js` with GitHub Actions on every upload.
