/* ===================== DATOS ===================== */
const DAYS=["Lunes","Martes","Miércoles","Jueves","Viernes"];
const T0=540;

const SUBJ={
 ed :{n:"Estructura de Datos",ab:"ED",       c:"#D01F63",s:"#FCE7EF",ects:6,dept:"Informática",grp:"1081",cam:"LEG"},
 talf:{n:"Tª Autómatas y Leng. Formales",ab:"TALF",c:"#BE7000",s:"#FBEEDA",ects:6,dept:"Informática",grp:"82",cam:"LEG"},
 is :{n:"Ingeniería del Software",ab:"IS",   c:"#1E6FC4",s:"#E4EFFA",ects:6,dept:"Informática",grp:"82",cam:"LEG"},
 ec :{n:"Estructura de Computadores",ab:"EC",c:"#0F7A63",s:"#DFF1EC",ects:6,dept:"Informática",grp:"82",cam:"LEG"},
 eco:{n:"Principios de Economía",ab:"ECO",    c:"#6B3FC8",s:"#EDE6FA",ects:6,dept:"Economía",grp:"801",cam:"GET"},
 dcp:{n:"Int. Dcho. Civil Patrimonial",ab:"DCP",c:"#A02E8F",s:"#F8E5F4",ects:6,dept:"Derecho Privado",grp:"801",cam:"GET"},
 est:{n:"Estadística II",ab:"EST",            c:"#3F51A8",s:"#E6E9F7",ects:6,dept:"Estadística",grp:"801",cam:"GET"}
};

const CLASSES=[
 {id:"est", d:0,a:540,b:630, t:"prácticas",  au:"Aula 5.1.04",  r:"7 sep – 30 nov",grp:"801",from:"2026-09-07",to:"2026-11-30"},
 {id:"dcp", d:0,a:645,b:735, t:"magistral",  au:"Aula 10.2.1",  r:"7 sep – 30 nov",grp:"76 y 801",from:"2026-09-07",to:"2026-11-30"},
 {id:"eco", d:0,a:750,b:840, t:"magistral",  au:"Aula 10.2.1",  r:"7 sep – 30 nov",grp:"27, 76 y 801",half:0,dash:1,mark:"⚠",from:"2026-09-07",to:"2026-11-30"},
 {id:"ed",  d:0,a:750,b:840, t:"prácticas",  au:"Aulas varias", r:"5 y 19 oct · 16 y 30 nov",grp:"1081",half:1,dash:1,hatch:1,mark:"⚠",dates:["2026-10-05","2026-10-19","2026-11-16","2026-11-30"]},
 {id:"talf",d:1,a:540,b:630, t:"teoría",     au:"Aula 2.3.B05", r:"8 sep – 1 dic",grp:"82",from:"2026-09-08",to:"2026-12-01"},
 {id:"is",  d:1,a:645,b:735, t:"teoría",     au:"Aula 4.0.E04", r:"8 sep – 1 dic",grp:"82",from:"2026-09-08",to:"2026-12-01"},
 {id:"est", d:2,a:540,b:630, t:"magistral",  au:"Aula 10.2.1",  r:"9 sep – 9 dic",grp:"78 y 801",from:"2026-09-09",to:"2026-12-09"},
 {id:"eco", d:2,a:645,b:735, t:"prácticas",  au:"Aula 10.1.6",  r:"9 sep – 9 dic",grp:"801",from:"2026-09-09",to:"2026-12-09"},
 {id:"dcp", d:2,a:750,b:840, t:"prácticas",  au:"Aula 6.1.02",  r:"9 sep – 9 dic",grp:"801",from:"2026-09-09",to:"2026-12-09"},
 {id:"ec",  d:2,a:930,b:1020,t:"teoría",     au:"Aula 2.3.A01", r:"9 sep – 9 dic",grp:"82",from:"2026-09-09",to:"2026-12-09"},
 {id:"ed",  d:3,a:540,b:630, t:"teoría",     au:"Aula 2.3.C01", r:"10 sep – 10 dic",grp:"1081",from:"2026-09-10",to:"2026-12-10"},
 {id:"is",  d:3,a:645,b:735, t:"teoría",     au:"Aula 2.3.D01", r:"10 sep – 10 dic",grp:"82",from:"2026-09-10",to:"2026-12-10"},
 {id:"talf",d:3,a:930,b:1020,t:"prácticas",  au:"1.0.F03 · INF 7.0.J02",r:"24 sep · 5 nov · 10 dic",grp:"82",hatch:1,dates:["2026-09-24","2026-11-05","2026-12-10"]},
 {id:"ec",  d:3,a:1035,b:1125,t:"teoría",    au:"Aula 2.3.D03", r:"10 sep – 10 dic",grp:"82",from:"2026-09-10",to:"2026-12-10"},
 {id:"ed",  d:4,a:540,b:630, t:"teoría",     au:"Aula INF 2.2.C.04 DUAL",r:"11 sep – 11 dic",grp:"1081",from:"2026-09-11",to:"2026-12-11"},
 {id:"talf",d:4,a:645,b:735, t:"teoría",     au:"Aula 2.3.C03", r:"11 sep – 11 dic",grp:"82",from:"2026-09-11",to:"2026-12-11"},
 {id:"talf",d:4,a:750,b:840, t:"prácticas",  au:"Aula 4.0.E04", r:"solo 13 nov",grp:"82",hatch:1,dates:["2026-11-13"]},
 {id:"is",  d:4,a:1035,b:1125,t:"prácticas", au:"Aula 4.1.E06", r:"2, 16 y 30 oct · 20 nov",grp:"82",hatch:1,dates:["2026-10-02","2026-10-16","2026-10-30","2026-11-20"]}
];

const PROFS=[
 /* rol: "teoria" (Leganés) · "magistral" / "practicas" (Getafe) · "asistente" · coord:true si coordina */
 {id:"ed",name:"Isabel Segura Bedmar",rol:"teoria",coord:false,mail:"isegura@inf.uc3m.es",office:"",
  note:""},
 {id:"ed",name:"Israel González Carrasco",rol:"",coord:true,mail:"igcarras@inf.uc3m.es",office:"2.2.B13 · Sabatini, Leganés",
  note:"Tutorías por cita previa por correo. En el asunto: nombre completo, curso, asignatura y número de grupo (81)."},
 {id:"talf",name:"Araceli Sanchis de Miguel",rol:"teoria",coord:true,mail:"masm@inf.uc3m.es",office:"2.1.B11 · Sabatini, Leganés",
  note:"Pregúntale por las fechas de JFLAP 3 y de la EC2, que siguen sin cuadrar."},
 {id:"is",name:"José María Álvarez Rodríguez",rol:"teoria",coord:false,mail:"joalvare@inf.uc3m.es",office:"",
  note:""},
 {id:"is",name:"Eduardo Cibrián Sánchez",rol:"",coord:true,mail:"ecibrian@inf.uc3m.es",office:"",
  note:""},
 {id:"ec",name:"Alejandro Calderón Mateos",rol:"teoria",coord:false,mail:"acaldero@inf.uc3m.es",office:"2.2.B17 · Sabatini, Leganés",
  note:"Autor de WepSIM, el simulador que vais a usar."},
 {id:"ec",name:"Félix García Carballeira",rol:"",coord:true,mail:"fgcarbal@inf.uc3m.es",office:"",
  note:""},
 {id:"eco",name:"Javier Sánchez Bachiller",rol:"magistral",coord:false,mail:"javiersb@eco.uc3m.es",office:"",
  note:""},
 {id:"eco",name:"Martha Moya Laos",rol:"practicas",coord:false,mail:"mamoyal@eco.uc3m.es",office:"",
  note:""},
 {id:"eco",name:"Ángel Hernando Veciana",rol:"",coord:true,mail:"angel.hernando@uc3m.es",office:"15.1.63 · López Aranguren, Getafe",
  note:""},
 {id:"dcp",name:"Sergio Del Bosque Gómez",rol:"magistral+practicas",coord:false,mail:"sdelbosq@der-pr.uc3m.es",office:"",
  note:""},
 {id:"dcp",name:"Yolanda Bergel Sainz de Baranda",rol:"",coord:true,mail:"ybergel@der-pr.uc3m.es",office:"15.2.77 · López Aranguren, Getafe",
  note:""},
 {id:"est",name:"Regina Kaiser Remiro",rol:"magistral",coord:true,mail:"kaiser@est-econ.uc3m.es",office:"",
  note:""},
 {id:"est",name:"Carmen Vanessa Montero Contreras",rol:"practicas",coord:false,mail:"carmonte@est-econ.uc3m.es",office:"",
  note:""},
 {id:"est",name:"Sandra Benítez Peña",rol:"",coord:false,mail:"sbenitez@est-econ.uc3m.es",office:"",
  note:"Aparece como coordinadora del curso de magistral en Aula Global, pero la coordinación de la asignatura es de Regina Kaiser. Confírmalo en clase."}
];

const CAL=[
 {id:"ed",  date:"2026-09-16",wk:"S2", label:"16–17 sep",   what:"Cambio efectivo de grupo 1082 → 1081",w:"gestión",type:"cf"},
 {id:"talf",date:"2026-09-24",wk:"S3", label:"jue 24 sep",  what:"Sesión de ejercicios, aula 1.0.F03, 15:30",w:"clase",type:"cl"},
 {id:"ec",  date:"2026-09-25",wk:"S3", label:"21–25 sep",   what:"Laboratorio 1",w:"laboratorio",type:"cl"},
 {id:"talf",date:"2026-10-02",wk:"S4", label:"vie 2 oct",   what:"JFLAP 1 · autómatas finitos, temas 2 y 3",w:"obligatorio",type:"en",hora:"10:45–12:15",aula:"INF 7.0.J04",formato:"Práctica en parejas, con entrega"},
 {id:"is",  date:"2026-10-02",wk:"S4", label:"vie 2 oct",   what:"Práctica en aula, 17:15",w:"clase",type:"cl"},
 {id:"ed",  date:"2026-10-05",wk:"S5", label:"lun 5 oct",   what:"Sesión extra del 1081, 12:30, aula 4.0.E06 — choca con Economía",w:"conflicto",type:"cf"},
 {id:"eco", date:"2026-10-07",wk:"S5", label:"mié 7 oct",   what:"Evaluación en clase 1, en grupo reducido",w:"12 % final",type:"ex",hora:"10:45–12:15",aula:"Aula 10.1.6",formato:"Escrito en clase, folios en blanco y bolígrafo"},
 {id:"is",  date:"2026-10-09",wk:"S5", label:"5–9 oct",     what:"Examen parcial I de teoría",w:"15 %",type:"ex"},
 {id:"ed",  date:"2026-10-15",wk:"S6", label:"jue 15 oct",  what:"Primer parcial: bloque 1, ítems 1 a 5. Presencial y escrito, aula 2.3.C01",w:"25 %",type:"ex",hora:"09:00–10:30",aula:"Aula 2.3.C01",formato:"Presencial y escrito"},
 {id:"is",  date:"2026-10-16",wk:"S6", label:"vie 16 oct",  what:"Práctica en aula, 17:15",w:"clase",type:"cl"},
 {id:"ed",  date:"2026-10-19",wk:"S7", label:"lun 19 oct",  what:"Sesión extra del 1081, 12:30, aula 2.3.C04 — choca con Economía",w:"conflicto",type:"cf"},
 {id:"ec",  date:"2026-10-23",wk:"S7", label:"19–23 oct",   what:"Laboratorio 2 y entrega de la Práctica 1",w:"entrega",type:"en"},
 {id:"eco", date:"2026-10-26",wk:"S8", label:"26–31 oct",   what:"Test online 1 en Aula Global",w:"8 % final",type:"ex",hora:"Abre lunes 9:00, cierra sábado 14:00",formato:"10 preguntas, intentos ilimitados de 8 min 30, cuenta el mejor"},
 {id:"dcp", date:"2026-10-28",wk:"S8", label:"mié 28 oct",  what:"Cuestionario de autoevaluación tipo test",w:"1 pto / 10",type:"ex",hora:"12:30–14:00",aula:"Aula 6.1.02",formato:"Tipo test"},
 {id:"ec",  date:"2026-10-30",wk:"S8", label:"26–30 oct",   what:"Laboratorio 3",w:"laboratorio",type:"cl"},
 {id:"is",  date:"2026-10-30",wk:"S8", label:"vie 30 oct",  what:"Práctica en aula, 17:15",w:"clase",type:"cl"},
 {id:"talf",date:"2026-11-05",wk:"S9", label:"jue 5 nov",   what:"JFLAP 2 · gramáticas, tema 4",w:"obligatorio",type:"en",hora:"15:30–17:00",aula:"INF 7.0.J02",formato:"Práctica en parejas, con entrega"},
 {id:"ec",  date:"2026-11-05",wk:"S9", label:"jue 5 nov",   what:"Examen parcial",w:"parte del 30 %",type:"ex",hora:"17:15–18:45",aula:"Aula 2.3.D03",formato:"Presencial, teoría y práctica"},
 {id:"talf",date:"2026-11-06",wk:"S9", label:"vie 6 nov",   what:"EC1: temas 2, 3 y 4 más JFLAP 1",w:"25 % aprox.",type:"ex",hora:"10:45–12:15",aula:"Aula 2.3.C03",formato:"Presencial y escrito"},
 {id:"ed",  date:"2026-11-13",wk:"S10",label:"vie 13 nov",  what:"Segundo parcial: bloque 2, ítem 6. Presencial y escrito, aula 2.2.C04",w:"25 %",type:"ex",hora:"09:00–10:30",aula:"Aula 2.2.C04",formato:"Presencial y escrito"},
 {id:"talf",date:"2026-11-13",wk:"S10",label:"vie 13 nov",  what:"Sesión de ejercicios, aula 4.0.E04, 12:30",w:"clase",type:"cl"},
 {id:"ed",  date:"2026-11-16",wk:"S11",label:"lun 16 nov",  what:"Sesión extra del 1081, 12:30, aula 2.3.D05 — choca con Economía",w:"conflicto",type:"cf"},
 {id:"eco", date:"2026-11-18",wk:"S11",label:"mié 18 nov",  what:"Evaluación en clase 2",w:"12 % final",type:"ex",hora:"10:45–12:15",aula:"Aula 10.1.6",formato:"Escrito en clase, folios en blanco y bolígrafo"},
 {id:"ec",  date:"2026-11-20",wk:"S11",label:"16–20 nov",   what:"Laboratorio 4",w:"laboratorio",type:"cl"},
 {id:"is",  date:"2026-11-20",wk:"S11",label:"vie 20 nov",  what:"Práctica en aula, 17:15",w:"clase",type:"cl"},
 {id:"talf",date:"2026-11-27",wk:"S12",label:"vie 27 nov",  what:"JFLAP 3 · autómatas a pila, tema 6",w:"obligatorio",type:"en",hora:"Sin cerrar: 10:45 o 19:00–21:00",aula:"INF 7.0.J04",formato:"Práctica en parejas, con entrega"},
 {id:"ed",  date:"2026-11-30",wk:"S13",label:"lun 30 nov",  what:"Sesión extra del 1081, 12:30, aula 2.3.C04 — choca con Economía",w:"conflicto",type:"cf"},
 {id:"is",  date:"2026-12-04",wk:"S13",label:"30 nov – 4 dic",what:"Examen parcial II de teoría",w:"15 %",type:"ex"},
 {id:"ec",  date:"2026-12-04",wk:"S13",label:"30 nov – 4 dic",what:"Entrega de la Práctica 2",w:"entrega",type:"en"},
 {id:"eco", date:"2026-12-07",wk:"S14",label:"7–12 dic",    what:"Test online 2 en Aula Global",w:"8 % final",type:"ex",hora:"Abre lunes 9:00, cierra sábado 14:00",formato:"10 preguntas, intentos ilimitados de 8 min 30, cuenta el mejor"},
 {id:"dcp", date:"2026-12-09",wk:"S14",label:"mié 9 dic",   what:"Caso práctico final de recapitulación, en clase",w:"2 ptos / 10",type:"ex",hora:"12:30–14:00",aula:"Aula 6.1.02",formato:"Caso práctico con los textos legales delante"},
 {id:"talf",date:"2026-12-10",wk:"S14",label:"jue 10 dic",  what:"JFLAP 4 · máquinas de Turing",w:"obligatorio",type:"en",hora:"15:30–17:00",aula:"INF 7.0.J02",formato:"Práctica en parejas, con entrega"},
 {id:"is",  date:"2026-12-11",wk:"S14",label:"7–11 dic",    what:"Entrega del trabajo individual, parte práctica",w:"20 %",type:"en"},
 {id:"talf",date:"2026-12-11",wk:"S14",label:"vie 11 dic",  what:"EC2: temas 5, 6 y 7 más JFLAP 2, 3 y 4",w:"25 % aprox.",type:"ex",hora:"10:45–12:15",formato:"Presencial y escrito"}
];

const WEEKS=[
 ["S1","7 – 11 sep","Arranque de las siete asignaturas"],
 ["S2","14 – 18 sep","Cambio de grupo de Estructura de Datos"],
 ["S3","21 – 25 sep","Laboratorio 1 de Estructura de Computadores"],
 ["S4","28 sep – 2 oct","JFLAP 1"],
 ["S5","5 – 9 oct","Parcial I de Ingeniería del Software y evaluación en clase 1 de Economía"],
 ["S6","12 – 16 oct","Primer parcial de Estructura de Datos"],
 ["S7","19 – 23 oct","Laboratorio 2 y entrega de la Práctica 1"],
 ["S8","26 – 30 oct","Test online 1 de Economía, cuestionario de Derecho Civil y laboratorio 3"],
 ["S9","2 – 6 nov","JFLAP 2, parcial de Estructura de Computadores y EC1 de TALF"],
 ["S10","9 – 13 nov","Segundo parcial de Estructura de Datos"],
 ["S11","16 – 20 nov","Evaluación en clase 2 de Economía y laboratorio 4"],
 ["S12","23 – 27 nov","JFLAP 3"],
 ["S13","30 nov – 4 dic","Parcial II de Ingeniería del Software y entrega de la Práctica 2"],
 ["S14","7 – 11 dic","Test online 2, trabajo de Ingeniería del Software, caso final de Derecho Civil, JFLAP 4 y EC2"]
];

const CHECKS=[
 ["Rellenar la ficha de Estadística II","Falta el sistema de evaluación, los porcentajes, los mínimos y el calendario de continua. Es la única asignatura incompleta. Está en Aula Global, curso M1.204.13160-77 (magistral) y C2.233.13160-801 (prácticas)."],
 ["Confirmar el grupo de magistral de Getafe","Tu horario dice 76 en Derecho, 76 en Economía y 78 en Estadística, pero Aula Global los llama 75, 75 y 77. Para las entregas manda el código de Aula Global."],
 ["Apuntar las fechas de los exámenes finales","El calendario oficial solo da las ventanas: 16–22 de diciembre y 11–25 de enero. El día de cada asignatura lo publica el calendario de exámenes de la titulación."],
 ["Dejar por escrito el cambio de grupo","Correo a Israel González Carrasco confirmando que asistes al 1081 desde el 16 de septiembre. Hasta que Aula Global lo refleje sigues matriculado en el 1082 y las entregas van a ese grupo."],
 ["Preguntar por las cuatro prácticas de los lunes","Si son obligatorias o evaluables, el 1081 no te sirve tal cual. Es la pregunta más urgente."],
 ["Formar pareja para los JFLAP","Las cuatro sesiones son en parejas y la primera cae el 2 de octubre."],
 ["Confirmar el horario de JFLAP 3 y de la EC2","Tu horario dice 10:45 y el calendario de la asignatura dice 19–21 h."],
 ["Esperar el calendario oficial de exámenes","Las diapositivas de TALF llevan fechas del curso pasado sin actualizar."],
 ["Adelantar el trabajo de Ingeniería del Software","Se entrega en la semana 14, la peor del cuatrimestre. Trabájalo en las prácticas de octubre y noviembre."]
];

/* ===== Calendario académico oficial 2026/27 (v9, 3 jun 2026) =====
   Tramos con from/to inclusivos. tipo: clases · examen · nolectivo · sinclase   */
const ACAD={
 curso:{from:"2026-09-01", to:"2027-06-30"},
 c1:{from:"2026-09-07", to:"2026-12-11"},
 c2:{from:"2027-01-26", to:"2027-05-07"},
 tramos:[
  {from:"2026-09-07",to:"2026-12-11",tipo:"clases",  t:"Clases · 1.º cuatrimestre"},
  {from:"2026-12-14",to:"2026-12-15",tipo:"examen",  t:"Recuperación y anticipados"},
  {from:"2026-12-16",to:"2026-12-22",tipo:"examen",  t:"Exámenes ordinarios 1.º cuat."},
  {from:"2026-12-23",to:"2027-01-08",tipo:"nolectivo",t:"Navidad"},
  {from:"2027-01-11",to:"2027-01-25",tipo:"examen",  t:"Exámenes ordinarios 1.º cuat."},
  {from:"2027-01-26",to:"2027-05-07",tipo:"clases",  t:"Clases · 2.º cuatrimestre"},
  {from:"2027-03-22",to:"2027-03-29",tipo:"nolectivo",t:"Semana Santa"},
  {from:"2027-05-10",to:"2027-05-10",tipo:"nolectivo",t:"Día no lectivo"},
  {from:"2027-05-11",to:"2027-05-28",tipo:"examen",  t:"Exámenes ordinarios 2.º cuat."},
  {from:"2027-06-14",to:"2027-06-30",tipo:"examen",  t:"Exámenes extraordinarios"}
 ],
 /* campus solo cuando no afecta a los dos: "leg" o "get" */
 sinClase:[
  {date:"2026-10-09",campus:"leg"},
  {date:"2026-10-12"},
  {date:"2026-11-02"},
  {date:"2026-12-07"},
  {date:"2026-12-08"},
  {date:"2026-12-25"},
  {date:"2027-01-01"},
  {date:"2027-01-06"},
  {date:"2027-03-25"},
  {date:"2027-03-26"},
  {date:"2027-05-01"},
  {date:"2027-05-06",campus:"get"},
  {date:"2027-05-17",campus:"get"}
 ],
 marcas:[
  {date:"2026-09-07",t:"Empiezan las clases"},
  {date:"2026-12-11",t:"Acaban las clases"},
  {date:"2027-01-26",t:"Empiezan las clases"},
  {date:"2027-05-07",t:"Acaban las clases"}
 ]
};

/* ===== Avisos por semana. Redactados a mano; los eventos se añaden solos ===== */
const AVISOS={
1:["Semana de arranque. Baja de Aula Global la guía docente de las siete asignaturas y comprueba cuáles te faltan.","Estadística II es la única de la que no tienes nada: ni evaluación, ni porcentajes, ni calendario. Empieza por ahí."],
2:["Es la semana del cambio de grupo de Estructura de Datos. Manda el correo a Israel González Carrasco y guarda su respuesta.","Hasta que Aula Global refleje el 1081 sigues matriculado en el 1082: si cae alguna entrega, pregunta dónde se sube.","Busca pareja para los JFLAP de TALF. La primera sesión es el 2 de octubre y es obligatoria."],
3:["El jueves 24 tienes sesión extra de TALF a las 15:30 en el aula 1.0.F03, fuera de tu horario normal.","Primer laboratorio de Estructura de Computadores. Instala WepSIM antes para no perder la sesión montando el entorno."],
4:["JFLAP 1 el viernes: asistencia obligatoria y entrega en parejas, sobre los temas 2 y 3.","Empieza el proyecto individual de Ingeniería del Software en la práctica del viernes. Se entrega en la semana 14, la peor del cuatrimestre: todo lo que adelantes ahora te lo quitas de diciembre."],
5:["Semana de dos pruebas: parcial I de Ingeniería del Software y evaluación en clase 1 de Economía el miércoles.","En Economía se entra con folios en blanco y bolígrafo, y quien llega tarde no se presenta. Sal con margen desde casa.","El lunes 5 es la primera sesión extra del 1081 y choca con la magistral de Economía. Si aún no has preguntado si es obligatoria, hazlo hoy."],
6:["Primer parcial de Estructura de Datos el jueves 15 en el aula 2.3.C01: bloque 1, ítems 1 a 5. Vale 2,5 puntos.","Entra modelado orientado a objetos, diseño y análisis de algoritmos, ordenación, búsqueda y recursividad."],
7:["Entrega de la práctica 1 de Estructura de Computadores junto con el laboratorio 2.","El viernes 23 se resuelve el parcial de Estructura de Datos en clase. Ve con el examen mirado: es la mejor pista de cómo pregunta."],
8:["Semana cargada: test online de Economía, cuestionario de Derecho Civil y laboratorio 3.","El test de Economía abre el lunes a las 9:00 y cierra el sábado a las 14:00 en punto, con intentos ilimitados y cuenta el mejor. Hazlo pronto y repítelo, no lo dejes para el sábado.","Recuerda la fórmula: acertar el 25 % es un cero y el 85 % ya es un 100. En blanco y mal puntúan igual, así que responde todo."],
9:["La peor semana del cuatrimestre. El jueves encadenas JFLAP 2 a las 15:30 y el parcial de Estructura de Computadores a las 17:15, sin hueco entre medias.","El viernes cae la EC1 de TALF: temas 2, 3 y 4 más JFLAP 1.","Llega con todo preparado desde el miércoles. Esta semana no se improvisa."],
10:["Segundo parcial de Estructura de Datos el viernes 13 en el aula 2.2.C04: bloque 2, ítem 6, estructuras lineales.","Es el último examen antes de un mes tranquilo. Aprovecha la semana 12 para adelantar el trabajo de Ingeniería del Software."],
11:["Evaluación en clase 2 de Economía el miércoles y laboratorio 4 de Estructura de Computadores.","El lunes 16 hay sesión extra del 1081, otra vez chocando con Economía."],
12:["Semana ligera: solo JFLAP 3, y su horario está sin cerrar entre las 10:45 y las 19–21 h. Confirma con Araceli Sanchis cuál manda.","Úsala para el trabajo de Ingeniería del Software y para empezar a repasar árboles y grafos de cara al final."],
13:["Parcial II de Ingeniería del Software y entrega de la práctica 2 de Estructura de Computadores.","Última sesión extra del 1081 el lunes 30, con el mismo choque de siempre."],
14:["Cinco cosas en cinco días: test online 2 de Economía, entrega del trabajo de Ingeniería del Software, caso final de Derecho Civil, JFLAP 4 y EC2 de TALF.","Si has ido adelantando el trabajo de Ingeniería del Software, esta semana es llevadera. Si no, va a doler.","Las clases acaban el viernes 11. Los exámenes ordinarios van del 16 al 22 de diciembre y del 11 al 25 de enero."]
};