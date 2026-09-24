/* ==========================================================
   i18n.js — interface texts in Spanish and English, and date formatting.
   · t("key", {vars}) → text with {var} replaced. A value can be a plural
     object {one, other}, chosen by vars.n.
   · Missing keys fall back to Spanish and are listed in I18N_MISSING
     (shown in the #debug panel).
   · Static texts in index.html carry data-i18n* attributes and are
     translated by applyStatic() below.
   Data texts (exam descriptions, advice, rules, syllabus) are not translated.
   ========================================================== */
const LANG=SETTINGS.lang;
const I18N_MISSING=new Set();

const STRINGS={
es:{
  /* general */
  "and":"y", "close":"Cerrar", "copied.f":"Copiada",
  "term.name":"{n} cuatrimestre",
  /* days without class */
  "noClass.weekend":"Fin de semana.", "noClass.break":"No hay clase: {name}.",
  "noClass.outside":"Fuera del periodo de clases.", "noClass.holiday":"No hay clase: día festivo.",
  /* event types */
  "type.ex":"Examen", "type.en":"Entrega", "type.cl":"Clase", "type.cf":"Choque de horario",
  "typeLong.ex":"Examen", "typeLong.en":"Entrega", "typeLong.cl":"Laboratorio o clase", "typeLong.cf":"Conflicto de horario",
  "event.title":"{type} de {subject}", "event.noDay":"día por confirmar", "event.weekNoDay":"semana {n} · día por confirmar",
  "when.week":"semana {n}", "when.tbc":"por confirmar", "when.closesToday":"cierra hoy", "when.closesTomorrow":"cierra mañana",
  "when.openUntil":"abierto · cierra el {day}", "when.today":"hoy", "when.tomorrow":"mañana", "when.inDays":"en {n} días",
  /* roles */
  "role.theory":"Teoría y ejercicios", "role.lecture":"Magistral", "role.lab":"Prácticas", "role.assistant":"Asistente", "role.coord":"Coordina",
  /* detail panel */
  "detail.title":"{type} de {subject}", "detail.when":"Cuándo", "detail.where":"Dónde", "detail.format":"Formato",
  "detail.weight":"Peso", "detail.covers":"Entra", "detail.noDay":"día sin confirmar",
  "detail.noSyllabus":"Temario concreto: pendiente de que lo publique el profesor.",
  /* errors */
  "error.many":"{n} problemas. El primero: {first}", "error.inFile":"Error en {file}: {msg}", "error.page":"la página",
  "error.data":{one:"{first}", other:"{n} errores en los datos. El primero: {first}"},
  "subject.noGrading":"Sin datos de evaluación todavía.",
  /* generated clashes */
  "clash.weight":"conflicto", "clash.what":"{a} de {subjectA} ({room}) choca con {b} de {subjectB}",
  /* header */
  "header.week":"Semana {n}", "header.ofWeeks":"de {n}", "header.notStarted":"Aún no empieza", "header.noClasses":"Sin clases",
  "header.subjects":"asignaturas", "header.campus":"campus",
  /* weekly timetable */
  "schedule.clashTip":"Choca con otra clase en alguna fecha", "schedule.group":"grp. {g}", "schedule.groupLong":"grupo {g}",
  "schedule.fixed":{one:"1 choque fijo", other:"{n} choques fijos"}, "schedule.noFixed":"Sin choques fijos",
  "schedule.clashOn":"el {day} {date}", "schedule.clashTimes":"{n} {day}", "schedule.clash":"{a} y {b} chocan {when}",
  "schedule.bothCampus":"{campus} el mismo día: {days}", "schedule.keyClash":"choque posible", "schedule.keyLoose":"fechas sueltas",
  /* today */
  "today.prefix":"Hoy · ", "today.button":"Hoy", "today.noClass":"Sin clase", "today.onlyCampus":"solo {campus}",
  "today.until":"hasta el {day}", "today.noClassesDay":"No tienes clase este día.", "today.weekTerm":"Semana {n} · {term}",
  "today.week":"semana {n}", "today.classes":{one:"1 clase", other:"{n} clases"}, "today.closeCard":"Cerrar ficha",
  "today.gradesEditedIn":'Las notas se editan en <a href="#subjects">Asignaturas</a>.',
  "dur.min":"{m} min", "dur.h":"{h} h", "dur.hmin":"{h} h {m} min",
  "live.startsIn":"empiezas en {t}", "live.done":"día de clase terminado", "live.nextIn":"siguiente en {t}", "live.left":"quedan {t}",
  "next7.empty":"Nada evaluable en los próximos siete días.", "next7.title":"Próximos 7 días",
  "week.dates":{one:"1 fecha", other:"{n} fechas"}, "week.advice":{one:"1 consejo", other:"{n} consejos"},
  "week.this":"Esta semana", "week.n":"Semana {n}", "week.noDay":"sin día",
  /* subjects */
  "subjects.intro":"Las {n} con la misma ficha: horario y aulas, profesorado, evaluación y fechas propias.",
  "subjects.introOne":"La única con la misma ficha: horario y aulas, profesorado, evaluación y fechas propias.",
  "subject.progress":"{done} de {total} semanas · {pct}%", "subject.week":"Semana", "subject.block":"Bloque", "subject.content":"Contenido",
  "subject.group":"grupo {g}", "subject.timetable":"Horario y aulas", "subject.noClasses":"Sin clases en el horario.",
  "subject.faculty":"Profesorado", "subject.gmail":"Escribir en Gmail", "subject.copyEmail":"Copiar dirección",
  "subject.grading":"Evaluación", "subject.dates":"Fechas propias", "subject.noDates":"Sin fechas evaluables registradas.",
  "subject.rulesAndSyllabus":"Reglas de evaluación y contenido semanal",
  "calc.maxPoints":"máx. {n} ptos", "calc.placeholder":"Nota", "calc.total0":"Acumulado: <b>0.00</b> ptos",
  "calc.total":"Acumulado: {n} de 10", "calc.failMin":"Suspenso: falta {what}", "calc.reached":"Ya llegas al 5",
  "calc.cannot":"Ya no da para el 5", "calc.need":"Te faltan {need} de los {left} que quedan",
  "calc.fail":"Suspenso: {n} sobre 10", "calc.pass":"Aprobado", "calc.youNeed":"Necesitas {what}.",
  /* faculty */
  "faculty.email":"Correo", "faculty.office":"Despacho", "faculty.notPublished":"no publicado",
  /* exams */
  "exams.filter.all":"Todas", "exams.filter.type_ex":"Exámenes", "exams.filter.type_en":"Entregas y obligatorio",
  "exams.filter.type_cl":"Labs y clases", "exams.filter.type_cf":"Conflictos", "exams.weekShort":"S{n}", "exams.none":"Sin fechas para este filtro.",
  /* tasks and notes */
  "tasks.noneSubject":"Ninguna tarea de asignatura.", "tasks.noneGeneral":"Nada pendiente.",
  "notes.loading":"Cargando tus notas…", "notes.copied":"Copiadas", "notes.selectAndCopy":"Selecciona y copia", "notes.copy":"Copiar notas",
  /* planner */
  "planner.weekTag":"S{n}", "planner.closes":"cierra", "planner.prev":"Mes anterior", "planner.next":"Mes siguiente",
  /* home and Nolan */
  "home.night":"Buenas noches", "home.morning":"Buenos días", "home.afternoon":"Buenas tardes", "home.greeting":"{hello}, {name}",
  "home.now":"Ahora: {subject} · {time} · {room}", "home.next":"Siguiente: {subject} · {time} · {room}",
  "home.doneToday":"Clases de hoy terminadas", "home.noClassToday":"Hoy no tienes clase.", "home.nextExam":"{type} de {subject}: {when}",
  "nolan.wip":"En construcción. Aquí irá lo que me indiques.", "nolan.back":"← Volver al inicio",
  /* cloud */
  "gate.title":"Introduce el PIN", "gate.wrong":"PIN incorrecto", "gate.delete":"Borrar",
  "weather.max":"Máx.", "weather.min":"Mín.", "weather.rainLabel":"Lluvia", "weather.here":"Aquí",
  "weather.sunsetLabel":"Puesta de sol", "weather.sunriseLabel":"Amanecer", "weather.sunriseTomorrowLabel":"Amanece",
  "weather.clear":"Despejado", "weather.partly":"Parcialmente nuboso", "weather.cloudy":"Nublado", "weather.fog":"Niebla",
  "weather.drizzle":"Llovizna", "weather.rain_":"Lluvia", "weather.showers":"Chubascos", "weather.snow":"Nieve", "weather.storm":"Tormenta",
  "s.soonTag":"Por explorar", "s.soonInfo":"Una galaxia reservada para lo que venga.", "soon.text":"Esta galaxia está por explorar. Aquí irá una próxima sección de Nolan.",
  "s.viewSky":"Ver el cielo", "s.viewSkyExit":"Volver",
  "s.hole":"Agujero negro", "s.holeTag":"De cerca", "s.holeInfo":"Acércate al horizonte de sucesos.",
  "hole.text":"Aquí la luz se curva: el arco que ves sobre la sombra es la parte de atrás del disco, doblada hacia ti. El lado que gira hacia ti brilla más.",
  "s.backHome":"← Inicio", "s.back":"← Volver", "s.backAria":"Volver", "nolan.backAria":"Volver al inicio", "s.logout":"Cerrar sesión", "s.logoutHelp":"Este dispositivo olvida el PIN y lo volverá a pedir.",
  "tasks.constellation":{one:"1 de {total} hecha · tu constelación", other:"{n} de {total} hechas · tu constelación"},
  "tasks.constellationDone":"Constelación completa: todo hecho",
  "cloud.off":"Guardado desactivado: falta config.js.", "cloud.loading":"Cargando…", "cloud.synced":"Sincronizado.",
  "cloud.retrying":"Sin conexión con la nube. Reintento en {s} s; lo que cambies se guardará al conectar.",
  "cloud.saving":"Guardando…", "cloud.saved":"Guardado.", "cloud.saveFailed":"No se pudo guardar. Se reintentará.",
  "cloud.waiting":"Sin conexión: se guardará al conectar.",
  "cloud.offline":"Sin conexión: se guarda en este dispositivo y se subirá al volver la conexión.",

  /* ---- static texts of index.html ---- */
  "s.home":"Inicio", "s.brand":"Nolan · UC3M · ", "s.aulaGlobalAria":"Aula Global (se abre en otra pestaña)",
  "s.notes":"Notas", "s.settings":"Configuración", "s.sections":"Secciones",
  "s.tab.schedule":"Horario", "s.tab.subjects":"Asignaturas", "s.tab.exams":"Exámenes", "s.tab.tasks":"Pendientes", "s.tab.faculty":"Profesorado",
  "s.closeWarning":"Cerrar aviso", "s.prevDay":"Día anterior", "s.nextDay":"Día siguiente",
  "s.schedule.title":"Horario semanal", "s.schedule.lead":"Cada asignatura tiene su color y lo mantiene en toda la página.",
  "s.planner.title":"Planificador mensual", "s.planner.lead":"Todo el curso, de septiembre a junio. Pulsa cualquier evento para ver el detalle.",
  "s.subjects.title":"Asignaturas", "s.subjects.lead":"Las asignaturas con la misma ficha: horario y aulas, profesorado, evaluación y fechas propias.",
  "s.faculty.title":"Profesorado",
  "s.faculty.lead":"Directorio público de la UC3M, consultado el 9 de septiembre de 2026. La universidad no publica horarios de tutoría en abierto: se anuncian en Aula Global o se piden por correo.",
  "s.th.subject":"Asignatura", "s.th.lecturer":"Profesor", "s.th.email":"Correo", "s.th.office":"Despacho",
  "s.th.date":"Fecha", "s.th.week":"Sem.", "s.th.what":"Qué es", "s.th.weight":"Peso",
  "s.exams.title":"Exámenes y entregas", "s.exams.lead":"Todo lo evaluable del cuatrimestre en orden.",
  "s.tasks.title":"Pendientes", "s.tasks.lead":"Se guardan en la nube y siguen ahí al recargar.",
  "s.tasks.bySubject":"Por asignatura", "s.tasks.general":"Generales",
  "s.notes.title":"Notas para Claude",
  "s.notes.lead":"Texto plano que se guarda solo. Claude no puede abrir la nube por su cuenta: cuando quieras que aplique algo, pulsa <b>Copiar notas</b> y pégaselas en el chat.",
  "s.notes.placeholder":"Ejemplo:\n- El parcial de IS es el 8 de octubre a las 12:30 en el aula 4.0.E04\n- Cambiar el aula del viernes de ED a 2.2.C05",
  "s.footer":"Montado a partir de tu horario personal de la UC3M, el horario del grupo 1081, las guías docentes 2026/27 y los materiales de presentación de cada asignatura. Los datos de profesorado proceden del directorio público de la universidad. Lo que en los documentos originales estaba marcado como provisional sigue estándolo aquí.",
  "s.hello":"Hola, Nolan", "s.whereTo":"¿A dónde vamos?", "s.secondYear":"Segundo de carrera · ", "s.enter":"Entrar",
  "s.wip":"En construcción", "s.nolanSoon":"Pronto, con lo que me vayas contando.", "s.view":"Ver",
  /* settings */
  "s.settings.lead":"Se guarda en este dispositivo.",
  "s.set.lang":"Idioma", "s.set.langHelp":"Toda la interfaz. Los textos de las asignaturas (evaluación, consejos, temario) siguen en español.",
  "s.set.look":"Efectos",
  "s.set.lookHelp":"Alto: el universo en 3D vivo, con galaxias, un agujero negro, cometas y estrellas fugaces. Medio: un cielo de estrellas, mucho más ligero, donde cada sección es una estrella brillante hacia la que vuela la cámara. Mínimo: fondo liso y nada se mueve, para móviles lentos o ahorrar batería. Si tu sistema pide reducir el movimiento, no se anima nada.",
  "s.set.look.high":"Alto", "s.set.look.medium":"Medio", "s.set.look.low":"Mínimo",
  "s.set.reload":"Cambiar el idioma o los efectos recarga la página."
},
en:{
  "and":"and", "close":"Close", "copied.f":"Copied",
  "term.name":"{n} term",
  "noClass.weekend":"Weekend.", "noClass.break":"No class: {name}.",
  "noClass.outside":"Outside the teaching period.", "noClass.holiday":"No class: public holiday.",
  "type.ex":"Exam", "type.en":"Submission", "type.cl":"Class", "type.cf":"Timetable clash",
  "typeLong.ex":"Exam", "typeLong.en":"Submission", "typeLong.cl":"Lab or class", "typeLong.cf":"Timetable conflict",
  "event.title":"{type} · {subject}", "event.noDay":"day TBC", "event.weekNoDay":"week {n} · day TBC",
  "when.week":"week {n}", "when.tbc":"TBC", "when.closesToday":"closes today", "when.closesTomorrow":"closes tomorrow",
  "when.openUntil":"open · closes {day}", "when.today":"today", "when.tomorrow":"tomorrow", "when.inDays":"in {n} days",
  "role.theory":"Theory and exercises", "role.lecture":"Lectures", "role.lab":"Labs", "role.assistant":"Assistant", "role.coord":"Coordinator",
  "detail.title":"{type} · {subject}", "detail.when":"When", "detail.where":"Where", "detail.format":"Format",
  "detail.weight":"Weight", "detail.covers":"Covers", "detail.noDay":"day not confirmed",
  "detail.noSyllabus":"Exact syllabus: not published by the lecturer yet.",
  "error.many":"{n} problems. The first one: {first}", "error.inFile":"Error in {file}: {msg}", "error.page":"the page",
  "error.data":{one:"{first}", other:"{n} errors in the data. The first one: {first}"},
  "subject.noGrading":"No grading data yet.",
  "clash.weight":"clash", "clash.what":"{a} of {subjectA} ({room}) clashes with {b} of {subjectB}",
  "header.week":"Week {n}", "header.ofWeeks":"of {n}", "header.notStarted":"Not started yet", "header.noClasses":"No classes",
  "header.subjects":"subjects", "header.campus":"campus",
  "schedule.clashTip":"Clashes with another class on some date", "schedule.group":"grp. {g}", "schedule.groupLong":"group {g}",
  "schedule.fixed":{one:"1 fixed clash", other:"{n} fixed clashes"}, "schedule.noFixed":"No fixed clashes",
  "schedule.clashOn":"on {day} {date}", "schedule.clashTimes":"on {n} {day}", "schedule.clash":"{a} and {b} clash {when}",
  "schedule.bothCampus":"{campus} on the same day: {days}", "schedule.keyClash":"possible clash", "schedule.keyLoose":"one-off dates",
  "today.prefix":"Today · ", "today.button":"Today", "today.noClass":"No class", "today.onlyCampus":"{campus} only",
  "today.until":"until {day}", "today.noClassesDay":"No classes on this day.", "today.weekTerm":"Week {n} · {term}",
  "today.week":"week {n}", "today.classes":{one:"1 class", other:"{n} classes"}, "today.closeCard":"Close card",
  "today.gradesEditedIn":'Grades are edited in <a href="#subjects">Subjects</a>.',
  "dur.min":"{m} min", "dur.h":"{h} h", "dur.hmin":"{h} h {m} min",
  "live.startsIn":"starts in {t}", "live.done":"classes done for today", "live.nextIn":"next in {t}", "live.left":"{t} left",
  "next7.empty":"Nothing graded in the next seven days.", "next7.title":"Next 7 days",
  "week.dates":{one:"1 date", other:"{n} dates"}, "week.advice":{one:"1 tip", other:"{n} tips"},
  "week.this":"This week", "week.n":"Week {n}", "week.noDay":"no day",
  "subjects.intro":"{n} subjects, each with the same card: timetable and rooms, faculty, grading and key dates.",
  "subjects.introOne":"One subject, with its card: timetable and rooms, faculty, grading and key dates.",
  "subject.progress":"{done} of {total} weeks · {pct}%", "subject.week":"Week", "subject.block":"Block", "subject.content":"Content",
  "subject.group":"group {g}", "subject.timetable":"Timetable and rooms", "subject.noClasses":"No classes in the timetable.",
  "subject.faculty":"Faculty", "subject.gmail":"Write in Gmail", "subject.copyEmail":"Copy address",
  "subject.grading":"Grading", "subject.dates":"Key dates", "subject.noDates":"No graded dates recorded.",
  "subject.rulesAndSyllabus":"Grading rules and weekly content",
  "calc.maxPoints":"max. {n} pts", "calc.placeholder":"Grade", "calc.total0":"Total: <b>0.00</b> pts",
  "calc.total":"Total: {n} out of 10", "calc.failMin":"Fail: missing {what}", "calc.reached":"You already reach 5",
  "calc.cannot":"5 is out of reach now", "calc.need":"You need {need} of the {left} still to come",
  "calc.fail":"Fail: {n} out of 10", "calc.pass":"Pass", "calc.youNeed":"You need {what}.",
  "faculty.email":"Email", "faculty.office":"Office", "faculty.notPublished":"not published",
  "exams.filter.all":"All", "exams.filter.type_ex":"Exams", "exams.filter.type_en":"Submissions and required",
  "exams.filter.type_cl":"Labs and classes", "exams.filter.type_cf":"Clashes", "exams.weekShort":"W{n}", "exams.none":"No dates for this filter.",
  "tasks.noneSubject":"No subject tasks.", "tasks.noneGeneral":"Nothing pending.",
  "notes.loading":"Loading your notes…", "notes.copied":"Copied", "notes.selectAndCopy":"Select and copy", "notes.copy":"Copy notes",
  "planner.weekTag":"W{n}", "planner.closes":"closes", "planner.prev":"Previous month", "planner.next":"Next month",
  "home.night":"Good evening", "home.morning":"Good morning", "home.afternoon":"Good afternoon", "home.greeting":"{hello}, {name}",
  "home.now":"Now: {subject} · {time} · {room}", "home.next":"Next: {subject} · {time} · {room}",
  "home.doneToday":"Today's classes are over", "home.noClassToday":"No class today.", "home.nextExam":"{type} · {subject}: {when}",
  "nolan.wip":"Under construction. Whatever you tell me will go here.", "nolan.back":"← Back to home",
  "gate.title":"Enter your PIN", "gate.wrong":"Wrong PIN", "gate.delete":"Delete",
  "weather.max":"High", "weather.min":"Low", "weather.rainLabel":"Rain", "weather.here":"Here",
  "weather.sunsetLabel":"Sunset", "weather.sunriseLabel":"Sunrise", "weather.sunriseTomorrowLabel":"Sunrise",
  "weather.clear":"Clear", "weather.partly":"Partly cloudy", "weather.cloudy":"Cloudy", "weather.fog":"Fog",
  "weather.drizzle":"Drizzle", "weather.rain_":"Rain", "weather.showers":"Showers", "weather.snow":"Snow", "weather.storm":"Thunderstorm",
  "s.soonTag":"Unexplored", "s.soonInfo":"A galaxy saved for what comes next.", "soon.text":"This galaxy is still unexplored. A future section of Nolan will live here.",
  "s.viewSky":"View the sky", "s.viewSkyExit":"Back",
  "s.hole":"Black hole", "s.holeTag":"Up close", "s.holeInfo":"Get close to the event horizon.",
  "hole.text":"Here light bends: the arc you see over the shadow is the far side of the disk, bent towards you. The side turning towards you shines brighter.",
  "s.backHome":"← Home", "s.back":"← Back", "s.backAria":"Back", "nolan.backAria":"Back to home", "s.logout":"Log out", "s.logoutHelp":"This device forgets the PIN and will ask for it again.",
  "tasks.constellation":{one:"1 of {total} done · your constellation", other:"{n} of {total} done · your constellation"},
  "tasks.constellationDone":"Constellation complete: all done",
  "cloud.off":"Saving is off: config.js is missing.", "cloud.loading":"Loading…", "cloud.synced":"Synced.",
  "cloud.retrying":"No connection to the cloud. Retrying in {s} s; your changes will be saved once connected.",
  "cloud.saving":"Saving…", "cloud.saved":"Saved.", "cloud.saveFailed":"Could not save. It will retry.",
  "cloud.waiting":"Offline: it will save once connected.",
  "cloud.offline":"Offline: kept on this device, uploaded when the connection is back.",

  "s.home":"Home", "s.brand":"Nolan · UC3M · ", "s.aulaGlobalAria":"Aula Global (opens in a new tab)",
  "s.notes":"Notes", "s.settings":"Settings", "s.sections":"Sections",
  "s.tab.schedule":"Schedule", "s.tab.subjects":"Subjects", "s.tab.exams":"Exams", "s.tab.tasks":"Tasks", "s.tab.faculty":"Faculty",
  "s.closeWarning":"Close warning", "s.prevDay":"Previous day", "s.nextDay":"Next day",
  "s.schedule.title":"Weekly timetable", "s.schedule.lead":"Each subject has its own colour and keeps it across the whole page.",
  "s.planner.title":"Monthly planner", "s.planner.lead":"The whole year, from September to June. Tap any event to see its details.",
  "s.subjects.title":"Subjects", "s.subjects.lead":"Every subject with the same card: timetable and rooms, faculty, grading and key dates.",
  "s.faculty.title":"Faculty",
  "s.faculty.lead":"UC3M public directory, checked on 9 September 2026. The university does not publish office hours openly: they are announced on Aula Global or requested by email.",
  "s.th.subject":"Subject", "s.th.lecturer":"Lecturer", "s.th.email":"Email", "s.th.office":"Office",
  "s.th.date":"Date", "s.th.week":"Wk", "s.th.what":"What", "s.th.weight":"Weight",
  "s.exams.title":"Exams and submissions", "s.exams.lead":"Everything graded this term, in order.",
  "s.tasks.title":"Tasks", "s.tasks.lead":"Saved to the cloud, still there after reloading.",
  "s.tasks.bySubject":"By subject", "s.tasks.general":"General",
  "s.notes.title":"Notes for Claude",
  "s.notes.lead":"Plain text that saves itself. Claude cannot open the cloud on its own: when you want something applied, press <b>Copy notes</b> and paste them into the chat.",
  "s.notes.placeholder":"Example:\n- The SE midterm is on 8 October at 12:30 in room 4.0.E04\n- Change Friday's DS room to 2.2.C05",
  "s.footer":"Built from your personal UC3M timetable, the group 1081 timetable, the 2026/27 course guides and each subject's introduction materials. Faculty data comes from the university's public directory. Whatever was marked as provisional in the original documents is still provisional here.",
  "s.hello":"Hi, Nolan", "s.whereTo":"Where to?", "s.secondYear":"Second year · ", "s.enter":"Enter",
  "s.wip":"Under construction", "s.nolanSoon":"Coming soon, with whatever you tell me.", "s.view":"View",
  "s.settings.lead":"Saved on this device.",
  "s.set.lang":"Language", "s.set.langHelp":"The whole interface. Subject texts (grading, advice, syllabus) stay in Spanish.",
  "s.set.look":"Effects",
  "s.set.lookHelp":"High: the living 3D universe, with galaxies, a black hole, comets and shooting stars. Medium: a sky of stars, much lighter, where each section is a bright star the camera flies to. Minimal: a plain background and nothing moves, for slow phones or to save battery. If your system asks for reduced motion, nothing animates.",
  "s.set.look.high":"High", "s.set.look.medium":"Medium", "s.set.look.low":"Minimal",
  "s.set.reload":"Changing the language or the effects reloads the page."
}};

/* ---------- lookup ---------- */
function t(key,vars){
  let s=STRINGS[LANG][key];
  if(s===undefined){ I18N_MISSING.add(LANG+":"+key); s=STRINGS.es[key]; if(s===undefined) return key; }
  if(s&&typeof s==="object") s=vars&&vars.n===1?s.one:s.other;
  return vars?s.replace(/\{(\w+)\}/g,(m,k)=>vars[k]!==undefined?vars[k]:m):s;
}
const tn=(key,n,vars)=>t(key,Object.assign({n},vars));
const cap=s=>s?s.charAt(0).toUpperCase()+s.slice(1):s;

/* ---------- dates ---------- */
const WEEKDAY_LONG={es:["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"],
                    en:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]}[LANG];
/* the form used inside a sentence ("cierra el sábado" / "closes Saturday") */
const WEEKDAY_MID=LANG==="es"?WEEKDAY_LONG.map(d=>d.toLowerCase()):WEEKDAY_LONG;
const WEEKDAY_SHORT={es:["dom","lun","mar","mié","jue","vie","sáb"],en:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]}[LANG];
/* planner header, Monday first */
const WEEKDAY_LETTER={es:["L","M","X","J","V","S","D"],en:["M","T","W","T","F","S","S"]}[LANG];
const MONTH_SHORT={es:["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"],
                   en:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]}[LANG];
const MONTH_LONG={es:["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"],
                  en:["January","February","March","April","May","June","July","August","September","October","November","December"]}[LANG];

const dayName=d=>WEEKDAY_MID[d.getDay()];
/* "3 martes" / "3 Tuesdays" */
const dayNamePlural=d=>LANG==="es"?WEEKDAY_MID[d.getDay()]:WEEKDAY_MID[d.getDay()]+"s";
/* "Lunes, 21 de septiembre" / "Monday, 21 September"; mid=true → "lunes, 21 de septiembre" */
const fmtLong=(d,mid)=>(mid?WEEKDAY_MID:WEEKDAY_LONG)[d.getDay()]+", "+d.getDate()+(LANG==="es"?" de "+MONTH_LONG[d.getMonth()]:" "+MONTH_LONG[d.getMonth()]);
/* "jue 24 sep" / "Thu 24 Sep" */
const fmtShort=d=>WEEKDAY_SHORT[d.getDay()]+" "+d.getDate()+" "+MONTH_SHORT[d.getMonth()];
/* "lun 16" / "Mon 16" */
const fmtDayShort=d=>WEEKDAY_SHORT[d.getDay()]+" "+d.getDate();
/* "5 oct" / "5 Oct" */
const fmtDayMonth=d=>d.getDate()+" "+MONTH_SHORT[d.getMonth()];
/* "26–31 oct", "30 oct – 2 nov" */
const fmtRange=(a,b)=>a.getMonth()===b.getMonth()
  ? `${a.getDate()}–${b.getDate()} ${MONTH_SHORT[b.getMonth()]}`
  : `${fmtDayMonth(a)} – ${fmtDayMonth(b)}`;
/* "Septiembre 2026" / "September 2026" */
const fmtMonthYear=d=>cap(MONTH_LONG[d.getMonth()])+" "+d.getFullYear();
/* "1.er", "2.º" / "1st", "2nd" */
const termOrdinal=n=>LANG==="es"?(n===1?"1.er":n+".º"):n+(["th","st","nd","rd"][n%100>10&&n%100<14?0:n%10]||"th");

/* ---------- static texts of index.html ---------- */
function applyStatic(root){
  root=root||document;
  document.documentElement.lang=LANG;
  root.querySelectorAll("[data-i18n]").forEach(el=>{ el.textContent=t(el.dataset.i18n); });
  root.querySelectorAll("[data-i18n-html]").forEach(el=>{ el.innerHTML=t(el.dataset.i18nHtml); });
  [["i18nAria","aria-label"],["i18nTitle","title"],["i18nPlaceholder","placeholder"]].forEach(([k,attr])=>{
    root.querySelectorAll("[data-"+k.replace(/[A-Z]/g,c=>"-"+c.toLowerCase())+"]").forEach(el=>el.setAttribute(attr,t(el.dataset[k])));
  });
}
applyStatic();
