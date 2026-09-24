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

The whole app is one universe in real 3D, drawn by the graphics card (WebGL2) on a canvas behind everything (`js/universe.js`).

- **Home is the Nolan galaxy.** After the PIN the camera flies from deep space into it (five seconds, the far stars fading in around you) and stays there: home's background *is* that galaxy, low on the left.
- **Each section is a galaxy you can see from home**: UC3M, Nolan (under construction), and two kept for future sections, Andrómeda and Sombrero (cards "Por explorar" on home, route `#soon/<id>`).
- **Opening a section** flies the camera into its galaxy (`Home.enter` → `Universe.go(id)`), and the section appears inside it: UC3M's timetable has UC3M's galaxy glowing over the header. **A second click** (or Enter / Space) during the trip shows the section at once while the camera flies on to the end, so the sky never jumps (`Universe.skip()`). **Going home** flies back out.
- **Effects = Medium: a sky of stars you can fly through** (`window.Stars`, in `sky.js`). No 3D: each place is one still picture of stars, painted once. On home each section is a bright coloured star where its galaxy would be; opening it moves smoothly forward into that star, into the section's own sky, its star shining where it was — one move of about a second, quicker than the 3D flight, with no pull-back and no flare; the two skies cross by adding their light, and a sky drawn smaller than the screen repeats around itself, so the screen is never left without stars. Going home moves back out. `Universe.go` hands its flights to `Stars` when there is no 3D universe.
- **Nothing is recalculated frame by frame on the processor.** Every moving thing is an exact formula of time evaluated by the graphics card; each frame the page only passes the time and the camera. Galaxy stars and maps are built once, one galaxy at a time (home's first), in small steps so the page never stutters: the stars are worked out in a background worker, and each disk's map is painted on the graphics card in strips of about 512×512 pixels, one per turn (one big paint used to hold the graphics card for ~40 ms).
- **Spiral galaxies follow the density-wave model** (Lin & Shu, as in Ingo Berg's *Galaxy Renderer*): every star moves on an ellipse, each ellipse a little flatter and a little more turned the further out it is. The arms are where the ellipses crowd together, so they stay while the stars flow through them, and inner stars turn faster than outer ones. The whole pattern turns slowly too.
  - **Pink star-forming regions** only light up while they cross an arm (where neighbouring orbits squeeze together) and fade as they leave it; young blue stars and clouds of them live in the arms and fade between them.
  - **Resolved stars**: most are faint grain, a few are bright giants (a steep luminosity function), each at its own height above or below the disk, so they drift against the disk when the camera turns.
  - **Bulges** are swarms of stars on orbits in every direction; **globular clusters** (tight balls of old stars) circle each galaxy on their own tilted orbits; Andrómeda has two small companions.
- **Each disk is a real volume**, not a picture. Its light (old stars, young stars in clouds, pink regions) and its dust are painted once as a map on the graphics card, from the same orbits (plus patchiness and dust filaments), and the 3D noise for the dust clouds is made once too (only its three small grids of random values go to the graphics card, which blends them itself: a big cube of finished noise, read all over by the rays, was most of the cost of a frame). The page then walks every ray through the disk, front to back: old stars fill a thick layer that flares towards the edge, young stars and pink regions a thin one, and the dust forms clouds with a real 3D shape (made from the noise cube) that rise out of the middle plane and dip into it, brownish at their thin edges. Samples crowd where the ray is nearest the middle plane, where the light and the dust are. The dust darkens what lies behind it, so dust lanes cross the near side of a bulge and the edge-on Sombrero shows its dark band. Bulges and the elliptical are real 3D glows (brightest at the centre, sampled densely there), and every galaxy sits in a faint round **stellar halo**, so it glows into space instead of looking cut out.
- **The far sky**: thousands of stars fixed on the sky (a few twinkle slowly), a faint nebula painted once, dozens of tiny far galaxies (each drawn from a formula), and stars scattered through space that stretch into streaks while the camera flies. Galaxies away from the centre of the screen are turned to face home's camera, so they look as intended from home and reveal their depth when you fly to them.
- **A black hole** (`SIGHTS` in `universe.js`), seen from home and with a window of its own: its card on home (route `#blackhole`) flies the camera straight up to it, the text sits low and the hole fills the sky. It is **ray-traced**, not painted, in the last step of each frame: for every pixel near it the ray of light is followed backwards along its real path in the curved space around the hole (Schwarzschild; the step of Riccardo Antonelli's *Starless*: a = −1.5·h²·p/|p|⁵), and shows whatever that path meets — the hole, the thin disk of hot gas each time it crosses it, or the sky it escapes to. The shadow, the thin ring of light that went round it, the disk bent over the top and under the bottom and the Einstein ring of whatever lies behind (galaxies are bent into arcs) all come out of that. The gas glows like a black body at the thin disk's temperature (inner edge at the last stable orbit), bluer and brighter on the side coming at us and redder going away (Doppler), dimmer and redder deep in the pull (gravitational redshift); its clumps and streaks turn with it, the inside faster than the outside, in three rings of pattern blended by radius, so it never winds itself up or starts over. Farther out the bending is small and is done as a point lens. The disk leans against a fixed axis, so it is seen from above both from home and up close.
- **Other wonders** (`js/wonders.js`), each drawn from a formula by the graphics card, in its place in space (so flights and the slow turn move them like everything else), all visible from home: the **Orion Nebula** (pink hydrogen lit by the four Trapezium stars, a veil of dust filaments); the **Pillars of Creation** (three dark columns with gold-lit edges in teal gas); the **Pleiades** (nine blue-white stars at their real places, with spikes, in fine streaks of blue reflection nebula); the **Ring Nebula** (teal inside, red rim, the white dwarf in the middle); the **Crab pulsar** (a neutron star whose two beams sweep round like a lighthouse — its magnetic axis turns 70° from the spin axis, and it flashes when a beam points at us — inside the tangled filaments of its supernova); a **red giant feeding a white dwarf** (the giant pulled into a drop, a stream of gas curving onto a disk, the two orbiting in 70 s and hiding each other); the **Antennae** (two galaxies colliding: merging cores, dust lanes, pink knots of newborn stars, and two long curved tidal tails).
- **Now and then, a supernova**: every 3–9 minutes while the universe is alive, a star in a far galaxy flares in a second, blue-white with diffraction spikes, then over about a minute fades, turns yellow and red, and leaves a small ragged shell of glowing gas. `Wonders.nova(x, y, age)` sets one off (tests).
- **The opening starts at the Earth**: the first time the app opens in a session (Animations = All), the camera starts beside the Earth and the Moon and flies home. The Earth turns, its day side with oceans, coasts, forest, desert, ice and moving clouds, the Sun's small reflection on the sea, reddened light along the line between day and night; its night side dark with city lights (towns thicker on the coasts, joined by roads), green and crimson auroras over the poles, and its thin blue air glowing at the edge. The Moon beside it is lit in its **real phase for today** (`Astro.moon`).
- **Meteor showers on their real dates** (`Astro.shower`, after the IMO calendar: Quadrantids, Lyrids, η-Aquariids, Perseids, Draconids, Orionids, Leonids, Geminids, Ursids): around each peak there are more shooting stars, and many of them start near the shower's radiant and fly outwards from it.
- **Shooting stars and comets**: a shooting star every few seconds (now and then two together), starting anywhere and crossing in any direction: a hot blue-green head with a soft halo and a tapering tail that cools to orange, glows and flickers, and flares a little before it dies. Comets cross the screen from one side to the other, nearly level: they come in over one edge (tail and all) and leave over the other, bright all the way, often two or three at once; most drift across in about a minute, some shoot across in ten or fifteen seconds. Six kinds, after real ones (`COMET_KINDS`), and never two of the same kind at once: a great comet (curved dust tail and straight blue ion tail), an ion comet (a long blue tail split into streamers), a dusty golden comet (a wide curved fan), a small green comet (green coma, short faint tails), a comet breaking up into pieces, and a sungrazer with a very long bright tail. They live in space, nearer than the galaxies, so when the camera flies they grow, slide and pass by like everything else. Their tails always trail behind them along their path, turned a few degrees at most, the dust tail curving gently to that side: a soft fan that widens and dims as it spreads, brightest just behind the head, and a thin straight blue ion tail with soft knots drifting out along it. The comet grows and brightens as it passes closest and the coma breathes. Shooting stars glow up and fade away softly. Only with Animations = All.
- **Like a camera**: light is added up in high dynamic range and developed with a soft curve, a faint glow around bright things (bloom), a vignette and a fine dither against banding.
- **The universe is alive** (Animations = All and Quality = High): stars orbit, arms turn, the camera floats gently and slowly **turns around what it looks at** (at home around a point among the galaxies, in a section around its galaxy, which stays in the same place on the screen), so every galaxy is seen from changing angles and near things move against far ones: that is what makes the depth visible. With a mouse the view also leans a little towards the pointer. The turn fades out during flights and back in on arrival. While you scroll the sky holds still, so every frame goes to the scrolling (flights aside); it also pauses when the tab is hidden and after 45 s without touching anything; then nothing is drawn at all. `Universe.seek(seconds)` jumps that time forward and `Universe.shoot()` sends a shooting star and a comet (tests).
- **Budget**: phones draw about a third of the stars, smaller maps and at about 30 frames a second; computers about 60 (every frame of a 60 Hz screen, every other one of a faster screen; flights, shooting stars and comets every frame). Each galaxy's volume (its soft light and dust, the costliest part of a frame) is drawn at half the resolution and spread over the full picture; the stars stay sharp (about 40% less per frame, the same picture within 1/255). The render size adapts within a second or two if the device cannot keep up. Automated tests use a tiny budget (`?tier=phone` or `?tier=desk` forces one).
- Every galaxy has its own shape in `GALAXIES`, after beautiful real ones: Nolan (home) a golden **barred spiral** (like NGC 1300: a straight bar of old stars, made by long aligned inner orbits and a cigar-shaped bulge, with two open arms); UC3M a blue **grand-design spiral** seen face-on (like the Whirlpool, M51: tightly wound arms full of pink knots, and a small yellow companion, NGC 5195), and the liveliest: it turns visibly while you look; Nolan-in-construction an amber **elliptical**; Andrómeda a **ring galaxy** (like Hoag's Object: a round yellow core, a dark gap and a nearly perfect ring of young blue stars); Sombrero **edge-on**, a big bright bulge cut by its dark ring of dust.
- Without WebGL2 there is no 3D universe: `js/sky.js` draws a simpler sky with CSS layers instead.
- **To add a section** (a checklist, so nothing is forgotten):
  1. its galaxy in `GALAXIES` (`universe.js`): kind and shape, size, angle, colours, where it sits seen from home (`at.d` computer, `at.m` phone), and `star`, the colour of its bright star in the sky of stars (Effects = Medium) — `sky.js` reads it from there;
  2. a card on home (`index.html`) with `data-galaxy="<id>"`, and its texts in both languages (`i18n.js`);
  3. its page: a route in `router.js` (`isHome` if it opens inside home) and its view (`home.js`, `sceneOf`), or the ready-made "to explore" page (`#soon/<id>`, `SOON_NAMES` in `home.js`);
  4. a test in `tests/run.js` that opening it flies into its galaxy.
- **Just the sky**: the eye button (on home and in UC3M's header) hides the whole interface and leaves the universe on the screen; the button at the bottom or Escape brings it back (`js/view.js`). The button fades to almost nothing when left alone, and while you look the sky never goes to sleep. Not shown with Effects = Minimal.
- **Notes and Settings belong to every section**: their buttons are in UC3M's header and on home, they open where you are without moving the camera, and the back button (Nolan's logo, in a round of glass, as on every page that goes back) takes you back there.
- **The logo is the home button** (top left in UC3M).
- The opening of home (the N drawing itself, NOLAN appearing) plays after the PIN and when the app starts.
- **Log out** (Settings, red button): `Gate.lock()` forgets the device, puts the camera back in deep space and returns to home, so the next PIN lands at home.
- With Animations = Basic or None there are no flights (the camera jumps) and the universe stands still. Quality = Medium has no 3D universe: the sky of stars of `js/sky.js` (see above). Quality = Low has no universe at all: a plain dark background.

## The astral theme

The whole site lives in the night sky:

- **Sea of stars**: drawn by the 3D universe (see above). Only without WebGL2, `js/sky.js` and `css/sky.css` draw a fixed `#sky` instead: four layers of stars in real star colours (drawn once on canvas and used as tiles), film grain and a vignette, slow drift, twinkling, scroll parallax and shooting stars.
- **Glass** (`css/astral.css`): cards, tab bar and buttons are dark translucent glass with starlight borders and glows; section titles end in a four-point star.
- **Effects** (`js/effects.js`): soft points of light where you tap, sparks and a ring of light when a task is ticked. Stars in the interface are round points of light, never geometric shapes.
- **The sky outside** (`js/weather.js`, on home): weather now, today's high and low, chance of rain and the next sunrise or sunset. The place is where the device is (the browser asks once); if not allowed, Getafe. Weather from Open-Meteo, place names from BigDataCloud, both free and without keys, saved for 20 minutes. Without connection the sun is still computed offline (`js/astro.js`). Below it, **tonight's sky**, also computed offline: the Moon's phase (drawn as it looks, and how much is lit), the bright planets that climb above 10° during the dark hours from where you are (Paul Schlyter's orbital elements, worked out once a day), and the meteor shower going on, if any ("Máximo de las Perseidas" on the peak night).
- **Your constellation** (Tasks): one star per task, lit and joined when done.
- **Ticks light up** like stars, the red "now" line ends in a glowing point.

How much of it runs depends on the Effects setting (High = Animations All + Quality High; Medium = All + Medium; Minimal = None + Low; the table shows every pair, which the code still handles):

| | Quality High | Quality Medium | Quality Low |
|---|---|---|---|
| **Animations All** | everything | glass and glows over a still sky of simple stars; no galaxies, stardust, warp or shooting stars | plain background, no glass or glows; ripple and bursts only |
| **Animations Basic** | the sky stands still; no stardust, warp or shooting stars | the same, still | plain and still |
| **Animations None** | nothing moves | nothing moves | everything off |

In code: `fullMotion()` for decorations that move, `lowMotion()` for any motion, `highQuality()` for heavy visuals, `fancy()` (both) for the showy extras.

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
| **Settings** (`#settings`, inside home) | Language (Spanish / English) and **Effects**, one choice for animations and quality together (`LOOKS` in `prefs.js`): High (the living 3D universe: animations all, quality high), Medium (a sky of stars you can fly through: all, medium) and Minimal (a plain background, nothing moves: none, low). Saved on each device. There is only the dark look (the light theme was removed in v0.52). Changing any of them reloads the page through a passage: the screen fades softly (≈0.4 s) to the colour of the empty night sky, not a flat black, the page reloads behind it and the new look fades in (`js/shift.js`). The fades run on the compositor, so the busy start of the page behind cannot make them stutter; while the passage covers the screen completely (`html.shift-dark`) the universe draws nothing but the one frame the passage waits for. The passage opens when the page is ready — the universe built and drawn, the saved data read, the font in — but never waits more than 2.5 s: a galaxy still being built then fades in by itself. |
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
| `prefs.js` | Settings (`SETTINGS`, `saveSetting`) and `lowMotion()` / `fullMotion()` / `highQuality()` / `fancy()`. |
| `i18n.js` | Spanish and English texts (`t`, `tn`) and date formatting. |
| `core.js` | Shared helpers: dates, weeks, term in force, classes on a day (`classesOn`), event labels (`eventLabel`, `whenLabel`), detail panel, error banner. |
| `shift.js` | The passage (a soft fade) when a setting reloads the page. |
| `gate.js` | The PIN screen and Log out. |
| `wonders.js` | The other wonders drawn by the 3D universe: nebulae, the Pleiades, the Crab pulsar, a feeding binary, the Antennae, supernovae, the Earth and the Moon. They register themselves in `window.UNIVERSE_EXTRAS`, so it loads before `universe.js`. |
| `universe.js` | The 3D universe (WebGL2): galaxies on exact orbits, their dust and light, the far sky, shooting stars and comets, the camera flights, and its slow life. |
| `sky.js` | A simpler CSS sky, only for devices without WebGL2. |
| `validate.js` | Checks `data.js` and `eval.js` before rendering. Whatever would break the page is left out and reported at the top; odd things go to the console and `#debug`. |
| `derived.js` | Computed data: clashes between classes (added to `EVENTS`) and the timetable grid layout. |
| `cloud.js` | Saving to JSONBin, by changes, queued and without overwriting anything (see *The cloud*). |
| `header.js` | Clock, date, week and figures, and the compact header: scrolled down, the tab bar (computer) keeps the logo = home, the time, Aula Global, Notes and Settings; on a phone the header shrinks to one row with the time. It is the only clock: it emits the `minute` and `newDay` events. |
| `astro.js` | The real sky, offline: sunrise and sunset, the Moon's phase, the planets visible tonight, the meteor shower going on. |
| `weather.js` | Weather and sun on home. |
| `schedule.js` | Weekly timetable (grid and list by day) and the clash status bar. |
| `today.js` | The *Today* viewer. |
| `subjects.js` | Subject cards and grade calculator (`subjectCard`, `recalc`). |
| `faculty.js` · `exams.js` · `tasks.js` · `notes.js` · `planner.js` · `settings.js` | One tab, page or block each. |
| `nolan.js` | **The Nolan section.** Everything new for Nolan goes here. |
| `home.js` | The home window (UC3M / Nolan). |
| `router.js` | Routes (`#schedule`, `#home`, `#nolan/…`), tabs, the swipe gesture and the Escape key. |
| `view.js` | Just the sky: hides the interface to enjoy the universe. |
| `sw.js` (root) | The offline copy: a service worker (see *Offline*). |
| `debug.js` | `#debug` panel with screen measurements, data warnings and missing translations. |
| `effects.js` | Ripple and stardust on tap, star burst on ticking a task, warp on changing tab, and *idle* (decorations pause after 45 s without touching anything). |

### Design (`css/`)

`base` · `sky` · `header` · `tabbar` · `today` · `schedule` · `planner` · `subjects` · `exams` · `tasks` · `home` · `nolan` · `settings` · `effects` · `astral` · `cinema`.
Each one has its own mobile tweaks at the end.

- **Colours** are tokens on `:root` in `base.css` (`--space`, `--paper`, `--card`, `--card-solid`, `--ink`, `--ink-2`, `--rule`, `--go`, `--warn`…). Use them instead of fixed colours. `--card` is see-through glass; use `--card-solid` where nothing may show through.
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

**A new setting** → add its values to `SETTINGS_DEFAULTS` and `SETTINGS_OPTIONS` (`prefs.js`), a row in `ROWS` (`settings.js`) and its texts (`s.set.*` in `i18n.js`). Animations and quality are still two settings underneath (`SETTINGS.motion`, `SETTINGS.quality`, read by the rest of the code), but Settings only offers them together, as the levels of `LOOKS`.

**A new wonder in the sky** → `js/wonders.js`: `skyWonder("id",{at:{d:[x,y],m:[x,y]}, z, R, rot, blend:"add"|"over", shader, uniforms})`. `at` is where it sits seen from home (share of half the screen, computer and phone), `z` how far, `R` its radius in space; the shader gets `vQ` (−1…1 across the sprite), `uT` time, `uA` fade and `uS` a seed, plus `fbm`/`h12` from universe.js. Something that does not sit still writes its own `{id, shaders, layout(api), draw(api, phase, t, now)}` and pushes it to `window.UNIVERSE_EXTRAS` (see the supernova). A shader that does not compile is left out with a warning; the rest of the universe goes on. Add it to the list in the wonders test.

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
- **Dates** are `"YYYY-MM-DD"` strings. To work with them use `fromISO` (noon, safe from daylight-saving changes) and `addDays`.
- **Style**: English, comments that explain *why*, nothing written by hand if it can be computed from the data.

## Offline

The site works without a connection (`sw.js`, a service worker, registered at the end of `index.html` when the site is served over the web):

- **The page** comes from the network first, so a new version is seen as soon as there is signal; without signal, from the copy kept on the device.
- **Its files** (css, js, data, icons) carry the version in their address (`?v=…`), so the kept copy is always right and they load instantly.
- **What to keep is read from `index.html` itself** (every `href` and `src`, plus the manifest's icons): nothing to list by hand. Each fresh `index.html` drops the files of older versions and fetches the new ones, so only one version is ever kept. Publishing a version needs nothing extra.
- **Your data**: `cloud.js` keeps the last copy read on the device, so ticks, grades and notes show offline; changes made offline are kept on the device too and go up when the connection is back, even after closing the app.
- The weather keeps its last reading, and sunrise and sunset are computed offline.
- Installable: add it to the home screen (`manifest.webmanifest`) and it opens like an app, with or without signal.

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

Needs Node and Playwright. 90 checks in a real browser:

- the page loads without errors;
- the PIN screen (wrong PIN, the flight into the galaxy, remembered device, PIN not in the page, Log out), starting at home, the camera flights between galaxies (UC3M, back home, a galaxy to explore), and Notes and Settings inside home;
- the tabs, and old Spanish links;
- the red line at different times, the minute change and midnight;
- dates without a day and multi-day windows (and the line that joins them in the planner);
- the cloud, with a simulated JSONBin: a failed or slow first read and migration of old ticks;
- grades with a comma;
- the home window;
- settings: no light theme, the passage when a setting reloads the page, English after reloading, every text translated in both languages, English dates, and the animation levels;
- the astral layer: weather and sun on home, tonight's sky (Moon, planets, showers, checked against known dates), the nine wonders compiled and drawn, a supernova, the Earth at the opening, the sea of stars, Quality = Low and the tasks constellation;
- the swipe gesture;
- idle;
- offline: the site opens without a connection, and a task ticked offline survives reopening and is saved once online.

Add a test whenever you fix a bug.

---

## Roadmap

Ordered by how much it will be noticed.

1. **Final exam dates.** The official windows are 16–22 December and 11–25 January. The days are missing; add them to `EVENTS` as soon as they are out.
2. **Syllabus of each exam** (`syllabus` in `EVENTS`). It already shows in the detail panel when present.
3. **Term 2.** The structure is ready: only the data is missing (see above).
4. **Nolan.** Decide what it is and build it in `nolan.js`.
5. **Exams in the phone's calendar.** An "Add to my calendar" button that generates an `.ics` with all `EVENTS`, so the phone itself gives reminders.
6. **Term average.** With the calculator grades and the ECTS, the weighted average and what each final needs.
7. **Fixed Madrid time**, even when the phone is in another time zone (travel).
8. **Tests on GitHub.** Run `tests/run.js` with GitHub Actions on every upload.
