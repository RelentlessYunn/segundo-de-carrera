/* ==========================================================
   base.js — utilidades y reglas compartidas.
   Todo lo que se declara aquí arriba (const / function) es visible desde
   los demás archivos de js/, que se cargan después en el orden de index.html.
   Aquí no se pinta nada: solo herramientas.
   ========================================================== */

/* ---------- atajos ---------- */
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const plural=(n,uno,varios)=>n+" "+(n===1?uno:varios);
const reducido=()=>matchMedia("(prefers-reduced-motion:reduce)").matches;
/* nombre estable para ids: "Instalar WepSIM y CREATOR" → "instalar-wepsim-y-creator" */
const slug=s=>String(s).normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase()
  .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,48);
/* avisa a quien escuche: document.addEventListener("nombre", …) */
const emitir=(nombre,detalle)=>document.dispatchEvent(new CustomEvent(nombre,{detail:detalle}));

/* ---------- fechas y horas ----------
   Las fechas viajan como texto "AAAA-MM-DD" (clave). Para convertirlas se usa
   el mediodía, así el cambio de hora de marzo y octubre nunca mueve un día. */
const hhmm=m=>String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0");
const isoD=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const deISO=k=>new Date(k+"T12:00:00");
const hoyISO=()=>isoD(new Date());
const minutosDe=d=>d.getHours()*60+d.getMinutes();
const diasEntre=(a,b)=>Math.round((deISO(b)-deISO(a))/864e5);
const sumaDias=(k,n)=>{ const d=deISO(k); d.setDate(d.getDate()+n); return isoD(d); };
const DIA_CORTO=["dom","lun","mar","mié","jue","vie","sáb"];
const DIA_LARGO=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const MES_CORTO=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const MES_LARGO=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

/* ---------- cuatrimestres y semanas (se calculan de CUATRIS) ---------- */
function semanasDe(c){
  const out=[], fin=deISO(c.fin);
  /* el cuatrimestre puede empezar en martes: las semanas se anclan al lunes */
  const d=deISO(c.ini); d.setDate(d.getDate()-((d.getDay()+6)%7));
  for(let n=1; d<=fin; n++){
    const a=isoD(d); d.setDate(d.getDate()+6);
    out.push({c:c.n, n, from:a, to:isoD(d)});
    d.setDate(d.getDate()+1);
  }
  return out;
}
const SEMANAS=CUATRIS.flatMap(semanasDe);
const semanaEn=k=>SEMANAS.find(w=>k>=w.from&&k<=w.to)||null;
const totalSemanas=c=>SEMANAS.filter(w=>w.c===c).length;

/* Cuatrimestre en vigor: el último que ya ha empezado.
   Durante los exámenes de enero sigue siendo el 1.º. */
function cuatriEn(k){
  let n=CUATRIS[0].n;
  CUATRIS.forEach(c=>{ if(k>=c.ini) n=c.n; });
  return n;
}
const ordinalCuatri=n=>n===1?"1.er":n+".º";
/* Asignaturas del cuatrimestre en vigor. Si las del siguiente aún no están
   metidas en data.js, se siguen viendo las anteriores en vez de nada. */
function asignaturasEn(k){
  for(let n=cuatriEn(k); n>=1; n--){
    const ids=Object.keys(SUBJ).filter(id=>(SUBJ[id].cuatri||1)===n);
    if(ids.length) return ids;
  }
  return Object.keys(SUBJ);
}
/* Semana del cuatrimestre de una asignatura para el progreso del temario:
   0 si aún no ha empezado, 99 si ya terminó. */
function semanaProgresoDe(id, k){
  const c=CUATRIS.find(x=>x.n===(SUBJ[id].cuatri||1)); if(!c) return 0;
  if(k<c.ini) return 0;
  if(k>c.fin) return 99;
  const w=semanaEn(k);
  return w&&w.c===c.n ? w.n : 0;
}

/* ---------- campus, periodos y festivos ---------- */
const CAMPUS={GET:"Getafe",LEG:"Leganés"};
const campusDe=id=>CAMPUS[SUBJ[id].cam]||SUBJ[id].cam;
const PRIORIDAD_TRAMO={nolectivo:0,examen:1,clases:2};
/* el periodo que manda en un día (vacaciones > exámenes > clases) */
const tramoDe=k=>ACAD.tramos.filter(t=>k>=t.from&&k<=t.to)
  .sort((a,b)=>(PRIORIDAD_TRAMO[a.tipo]??9)-(PRIORIDAD_TRAMO[b.tipo]??9))[0]||null;
const festivoDe=k=>ACAD.sinClase.find(x=>x.date===k)||null;

/* Motivo por el que un día no hay ninguna clase, o null si es día de clase.
   Un festivo de un solo campus no cuenta aquí: ese día hay clase en el otro. */
function sinClaseEl(k){
  const dow=deISO(k).getDay();
  if(dow===0||dow===6) return {motivo:"finde", texto:"Fin de semana."};
  const tr=tramoDe(k);
  if(tr&&tr.tipo==="nolectivo") return {motivo:"nolectivo", texto:"No hay clase: "+tr.t+"."};
  if(tr&&tr.tipo==="examen") return {motivo:"examen", texto:tr.t+"."};
  if(!tr) return {motivo:"fuera", texto:"Fuera del periodo de clases."};
  const f=festivoDe(k);
  if(f&&!f.campus) return {motivo:"festivo", texto:"No hay clase: día festivo."};
  return null;
}
/* Clases de un día, ordenadas por hora. Respeta vacaciones, exámenes,
   festivos y festivos de un solo campus. */
function clasesDe(k){
  if(sinClaseEl(k)) return [];
  const idx=deISO(k).getDay()-1, f=festivoDe(k);
  return CLASSES.filter(c=>c.d===idx
      && (c.dates ? c.dates.includes(k) : (k>=c.from && k<=c.to))
      && !(f&&f.campus&&SUBJ[c.id].cam.toLowerCase()===f.campus))
    .sort((x,y)=>x.a-y.a);
}
/* estado de una clase a un minuto dado; el final no cuenta como "ahora" */
const estadoClase=(c,m)=>m<c.a?"futura":m<c.b?"ahora":"pasada";

/* ---------- fechas evaluables (CAL) ---------- */
const TIPO={ex:"Examen",en:"Entrega",cl:"Clase",cf:"Choque de horario"};
const TIPO_LARGO={ex:"Examen",en:"Entrega",cl:"Laboratorio o clase",cf:"Conflicto de horario"};
const finDe=e=>e.hasta||e.date;                       /* último día (ventanas de varios días) */
const semanaDeEv=e=>{ const w=semanaEn(e.date); return w?w.n:null; };
const esPrueba=e=>e.type==="ex"||e.type==="en";
/* "jue 24 sep", "26–31 oct", o el texto propio de las fechas sin día */
function etiquetaEv(e){
  if(e.sinDia){
    const w=semanaEn(e.date);
    return e.label || (w?"semana "+w.n+" · día por confirmar":"día por confirmar");
  }
  const a=deISO(e.date);
  if(e.hasta){
    const b=deISO(e.hasta);
    return a.getMonth()===b.getMonth()
      ? `${a.getDate()}–${b.getDate()} ${MES_CORTO[b.getMonth()]}`
      : `${a.getDate()} ${MES_CORTO[a.getMonth()]} – ${b.getDate()} ${MES_CORTO[b.getMonth()]}`;
  }
  return `${DIA_CORTO[a.getDay()]} ${a.getDate()} ${MES_CORTO[a.getMonth()]}`;
}
/* cuánto falta, mirado desde el día k: "hoy", "mañana", "en 6 días",
   "cierra el sábado" si la ventana ya está abierta, "semana 13" si no tiene día */
function cuandoEv(e,k){
  if(e.sinDia){ const w=semanaEn(e.date); return w?"semana "+w.n:"por confirmar"; }
  const d=diasEntre(k,e.date);
  if(e.hasta && d<=0){
    const r=diasEntre(k,e.hasta);
    return r===0?"cierra hoy":r===1?"cierra mañana":"abierto · cierra el "+DIA_LARGO[deISO(e.hasta).getDay()].toLowerCase();
  }
  return d===0?"hoy":d===1?"mañana":"en "+d+" días";
}
/* ¿Cae el evento en el día k? Las fechas sin día confirmado nunca "caen" en su sábado de aparcamiento. */
const caeEn=(e,k)=>!e.sinDia && e.date<=k && finDe(e)>=k;
const ordenEv=(a,b)=>a.date.localeCompare(b.date)||(a.sinDia?1:0)-(b.sinDia?1:0);

/* ---------- profesorado: etiqueta de rol unificada ----------
   Leganés: un profesor para teoría y ejercicios. Getafe: magistral y prácticas
   por separado. La coordinación se añade aparte. */
function rolPartes(p){
  const t=[];
  if(p.rol==="teoria") t.push(["Teoría y ejercicios","r-teo"]);
  if(p.rol==="magistral") t.push(["Magistral","r-mag"]);
  if(p.rol==="practicas") t.push(["Prácticas","r-pra"]);
  if(p.rol==="magistral+practicas"){ t.push(["Magistral","r-mag"]); t.push(["Prácticas","r-pra"]); }
  if(p.rol==="asistente") t.push(["Asistente","r-asi"]);
  if(p.coord) t.push(["Coordina","r-coo"]);
  return t;
}
function rolLabel(p){ return rolPartes(p).map(x=>x[0]).join(" · "); }
function rolChips(p){
  const t=rolPartes(p);
  return t.length?`<div class="roles">`+t.map(x=>`<span class="rol ${x[1]}">${x[0]}</span>`).join("")+`</div>`:"";
}

/* ---------- paneles de detalle (Hoy y el planificador) ---------- */
function pintarDetalle(idBox, ev){
  const box=document.getElementById(idBox); if(!box) return;
  const S=SUBJ[ev.id];
  const cuando=etiquetaEv(ev)+(ev.hora?" · "+ev.hora:"")+(ev.sinDia&&!/confirmar/.test(etiquetaEv(ev))?" · día sin confirmar":"");
  const filas=[["Cuándo",cuando]];
  if(ev.aula) filas.push(["Dónde", ev.aula]);
  if(ev.formato) filas.push(["Formato", ev.formato]);
  filas.push(["Peso", ev.w]);
  if(ev.temario) filas.push(["Entra", ev.temario]);
  const w=semanaEn(ev.date);
  box.hidden=false;
  box.style.borderLeftColor=S.c;
  box.innerHTML=`<div class="ev-head"><b style="color:${S.c}">${TIPO_LARGO[ev.type]} de ${esc(S.n)}</b>`+
    `<button class="ev-close" aria-label="Cerrar">×</button></div>`+
    `<div class="ev-meta">${esc(ev.what)}${w?" · semana "+w.n:""}</div>`+
    `<dl class="ev-dl">`+filas.map(f=>`<dt>${esc(f[0])}</dt><dd>${esc(f[1])}</dd>`).join("")+`</dl>`+
    (ev.temario||ev.type==="cf"||ev.type==="cl"?"":`<p class="nodata">Temario concreto: pendiente de que lo publique el profesor.</p>`);
  box.scrollIntoView({block:"nearest",behavior:reducido()?"auto":"smooth"});
}
/* Cierra un panel al pulsar la equis o fuera de él */
function cerrarDetalleAl(idBox, selectorAbre){
  document.addEventListener("click",ev=>{
    const box=document.getElementById(idBox); if(!box||box.hidden) return;
    if(ev.target.closest("#"+idBox+" .ev-close")){ box.hidden=true; return; }
    if(!ev.target.closest(selectorAbre) && !ev.target.closest("#"+idBox)) box.hidden=true;
  });
}

/* ---------- aviso visible cuando algo falla ----------
   Los errores de datos o de código no rompen la página entera (cada archivo
   se ejecuta por separado), pero sí se avisan aquí arriba para que no pasen
   desapercibidos. El detalle completo sale en la consola y en #debug. */
const AVISOS_FALLO=[];
function avisarFallo(texto){
  AVISOS_FALLO.push(texto);
  const box=document.getElementById("avisoFallo"); if(!box) return;
  box.hidden=false;
  box.querySelector("span").textContent=AVISOS_FALLO.length===1?texto:
    `${AVISOS_FALLO.length} problemas. El primero: ${AVISOS_FALLO[0]}`;
}
window.addEventListener("error",e=>{
  const archivo=(e.filename||"").split("/").pop().split("?")[0]||"la página";
  avisarFallo(`Error en ${archivo}: ${e.message}`);
});
