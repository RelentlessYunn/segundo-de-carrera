# Nolan

Nolan's personal organizer. Today it covers the 2026/27 year at UC3M (Double Degree in Computer Engineering and Business Administration).
A static site (HTML, CSS and JavaScript, no libraries, no build step) published on GitHub Pages:
<https://relentlessyunn.github.io/with-nolan/>

> **For Claude:** read this whole file before touching anything. Clone the repo
> (`git clone https://github.com/RelentlessYunn/with-nolan`) to work on the
> latest published version, change only the files you need, bump the version
> (see *Publishing a version*) and run the tests. Answer the owner in Spanish.

---

## PIN

The site opens behind a PIN screen (`js/gate.js`, styles in `css/cinema.css`).

- The PIN is **not** in the code: only its PBKDF2-SHA256 hash (150 000 rounds, fixed salt), in `js/gate.js` and in the `<head>` script of `index.html`.
- A device that types the right PIN stores that hash in `localStorage` (`nolan-device`) and is never asked again. Clearing the browser's data, or a private window, asks again.
- **To change the PIN**: compute the new hash (`node -e 'console.log(require("crypto").pbkdf2Sync("NEWPIN","nolan·with-nolan·2026",150000,32,"sha256").toString("hex"))'`) and replace it in both places. Every device will ask again.
- **Limits:** this keeps people out of the page, but the repository is public: anyone who opens the code on GitHub can read `data.js` and the rest. A six-digit PIN can also be brute-forced offline from the hash. Real protection would need private hosting with a login in front (for example Cloudflare Access).

## The universe

The whole app is one universe, drawn in 3D on a canvas behind everything (`js/universe.js`).

- **Home is the Nolan galaxy.** After the PIN the camera flies from deep space into it (five seconds, the far stars fading in around you) and stays there: home's background *is* that galaxy, low on the left.
- **Each section is a galaxy you can see from home**: UC3M, Nolan (under construction), and two kept for future sections, Andrómeda and Sombrero (cards "Por explorar" on home, route `#soon/<id>`).
- **Opening a section** flies the camera into its galaxy (`Home.enter` → `Universe.go(id)`), and the section appears inside it: UC3M's timetable has UC3M's galaxy glowing over the header. **Going home** flies back out.
- Every galaxy has its own personality: shape (`oval`, `spiral`, `elliptical`, `edge`), colours of its core, stars and glow, and details such as Sombrero's dark dust lane. Nolan (home) is a golden oval; UC3M a blue spiral with a sea-green heart; Nolan-in-construction an amber ember; Andrómeda a violet spiral; Sombrero edge-on.
- Galaxies are clouds of thousands of stars (seeded: always the same). Far away they are drawn from a small pre-rendered picture; close, star by star. The scene is only redrawn while the camera moves or the window changes size.
- **To add a section**: add a galaxy to `GALAXIES` in `universe.js` (kind, size, angle, colours, where it sits seen from home), a card with `data-galaxy="<id>"` in home, and its view.
- **Notes and Settings belong to every section**: their buttons are in UC3M's header and on home, they open where you are without moving the camera, and "← Volver" takes you back there.
- **The logo is the home button** (top left in UC3M).
- The opening of home (the N drawing itself, NOLAN appearing) plays after the PIN and when the app starts.
- **Log out** (Settings, red button): `Gate.lock()` forgets the device, puts the camera back in deep space and returns to home, so the next PIN lands at home.
- With Animations = None or Quality = Low there are no flights: the camera jumps. Quality = Low and the light theme hide the universe.

## The astral theme

The whole site lives in the night sky:

- **Sea of stars** (`js/sky.js`, `css/sky.css`): a fixed `#sky` behind the page, almost black, with faint nebulae, a Milky Way band, four layers of stars in real star colours (drawn once on canvas and used as tiles), film grain and a vignette; slow drift, twinkling, scroll parallax and a rare shooting star. Only transforms and opacity move, so it is cheap.
- **Glass** (`css/astral.css`): cards, tab bar and buttons are dark translucent glass with starlight borders and glows; section titles end in a four-point star.
- **Effects** (`js/effects.js`): soft points of light where you tap, sparks and a ring of light when a task is ticked. Stars in the interface are round points of light, never geometric shapes.
- **The sky outside** (`js/weather.js`, on home): weather now, today's high and low, chance of rain and the next sunrise or sunset. The place is where the device is (the browser asks once); if not allowed, Getafe. Weather from Open-Meteo, place names from BigDataCloud, both free and without keys, saved for 20 minutes. Without connection the sun is still computed offline (`js/astro.js`).
- **Your constellation** (Tasks): one star per task, lit and joined when done.
- **Ticks light up** like stars, the red "now" line ends in a glowing point.

How much of it runs depends on Settings:

| | Quality High | Quality Low |
|---|---|---|
| **Animations All** | everything | plain background, no glass or glows; ripple and bursts only |
| **Animations Basic** | the sky stands still; no stardust, warp or shooting stars | plain and still |
| **Animations None** | nothing moves | everything off |

In code: `fullMotion()` for decorations that move, `lowMotion()` for any motion, `highQuality()` for heavy visuals, `fancy()` (both) for the showy extras. The light theme is daylight: no sea of stars, but the header, home and the constellation keep a night sky.

## Name and logo

The site is called **Nolan**. The logo is an astral N: four identical four-point stars joined by straight lines, symmetric (green → blue gradient): `favicon.svg` is the source; `favicon.ico`, `apple-touch-icon.png`, `icon-192.png` and `icon-512.png` are rendered from it. The same mark sits small in the header (`.brand-mark` in `index.html`).

## What the site has

| Part | What it does |
|---|---|
| **Home** (house icon, `#home`; also where the app starts) | Choose a section: **UC3M**, **Nolan**, and the galaxies still to explore. The UC3M card sums up the week, the class now and the next assessment. Also: a weather card (now, high, low, rain, next sunrise/sunset) for where you are, and buttons for Notes and Settings. |
| **Schedule** (`#schedule`) | *Today*: the day's classes with their room, the red "now" line and "X min left"; the next 7 days; the week's dates and advice. Below: weekly timetable and monthly planner. |
| **Subjects** (`#subjects`) | One card per subject: timetable and rooms, faculty, grading with a grade calculator, dates, and syllabus with progress. |
| **Exams** (`#exams`) | Everything graded, with filters. Past items are dimmed. |
| **Tasks** (`#tasks`) | Tasks per subject and general ones. Ticks are saved to the cloud. |
| **Faculty** (`#faculty`) | Table with email and office. |
| **Notes for Claude** (`#notes`, inside home) | Free text saved to the cloud. **Claude cannot read JSONBin**: to pass them on, press *Copy notes* and paste into the chat. |
| **Settings** (`#settings`, inside home) | Language (Spanish / English), theme (dark / light / system), animations (all / basic / none) and quality (high / low). Saved on each device. Animations = None plus Quality = Low turns every effect off. |
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
| `prefs.js` | Settings (`SETTINGS`, `saveSetting`), theme, and `lowMotion()` / `fullMotion()` / `highQuality()` / `fancy()`. |
| `i18n.js` | Spanish and English texts (`t`, `tn`) and date formatting. |
| `core.js` | Shared helpers: dates, weeks, term in force, classes on a day (`classesOn`), event labels (`eventLabel`, `whenLabel`), detail panel, error banner. |
| `gate.js` | The PIN screen and Log out. |
| `universe.js` | The universe: home's galaxy and one galaxy per section, and the camera flights between them. |
| `sky.js` | The sea of stars behind the page. |
| `validate.js` | Checks `data.js` and `eval.js` before rendering. Whatever would break the page is left out and reported at the top; odd things go to the console and `#debug`. |
| `derived.js` | Computed data: clashes between classes (added to `EVENTS`) and the timetable grid layout. |
| `cloud.js` | Saving to JSONBin, by changes, queued and without overwriting anything (see *The cloud*). |
| `header.js` | Clock, date, week and figures. It is the only clock: it emits the `minute` and `newDay` events. |
| `astro.js` | Sunrise and sunset for any place, offline. |
| `weather.js` | Weather and sun on home. |
| `schedule.js` | Weekly timetable (grid and list by day) and the clash status bar. |
| `today.js` | The *Today* viewer. |
| `subjects.js` | Subject cards and grade calculator (`subjectCard`, `recalc`). |
| `faculty.js` · `exams.js` · `tasks.js` · `notes.js` · `planner.js` · `settings.js` | One tab, page or block each. |
| `nolan.js` | **The Nolan section.** Everything new for Nolan goes here. |
| `home.js` | The home window (UC3M / Nolan). |
| `router.js` | Routes (`#schedule`, `#home`, `#nolan/…`), tabs, the swipe gesture and the Escape key. |
| `debug.js` | `#debug` panel with screen measurements, data warnings and missing translations. |
| `effects.js` | Ripple and stardust on tap, star burst on ticking a task, warp on changing tab, and *idle* (decorations pause after 45 s without touching anything). |

### Design (`css/`)

`base` · `sky` · `header` · `tabbar` · `today` · `schedule` · `planner` · `subjects` · `exams` · `tasks` · `home` · `nolan` · `settings` · `effects` · `astral` · `cinema` · `light`.
Each one has its own mobile tweaks at the end.

- **Colours** are tokens on `:root` in `base.css` (`--space`, `--paper`, `--card`, `--card-solid`, `--ink`, `--ink-2`, `--rule`, `--go`, `--warn`…). Use them instead of fixed colours. `--card` is see-through glass; use `--card-solid` where nothing may show through.
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

1. Versions are numbered 0.49, 0.50… Bump the number in `index.html`: the footer (`v0.49`) and every `?v=0.49` of the code files, all at once. If the logo changes, also bump the `?v=` of the icons in `index.html` and `manifest.webmanifest`: browsers keep favicons cached for a long time and only fetch them again when the URL changes.
2. Upload the changed files to GitHub, keeping the `js/` and `css/` folders.
3. GitHub Pages takes a minute or two. The footer number tells you which version you are seeing.

## Tests

```
node tests/run.js
```

Needs Node and Playwright. 63 checks in a real browser:

- the page loads without errors;
- the PIN screen (wrong PIN, the flight into the galaxy, remembered device, PIN not in the page, Log out), starting at home, the camera flights between galaxies (UC3M, back home, a galaxy to explore), and Notes and Settings inside home;
- the tabs, and old Spanish links;
- the red line at different times, the minute change and midnight;
- dates without a day and multi-day windows (and the line that joins them in the planner);
- the cloud, with a simulated JSONBin: a failed or slow first read and migration of old ticks;
- grades with a comma;
- the home window;
- settings: light theme, English after reloading, every text translated in both languages, English dates, and the animation levels;
- the astral layer: weather and sun on home, the sea of stars, Quality = Low and the tasks constellation;
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
