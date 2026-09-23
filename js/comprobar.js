/* ==========================================================
   comprobar.js — revisa data.js y eval.js antes de pintar nada.
   · Lo que rompería la página (una asignatura que no existe, una fecha mal
     escrita…) se aparta, se avisa arriba y en la consola, y el resto sigue.
   · Lo que solo es raro (una prueba en festivo, dos coordinadores…) se avisa
     en la consola y en el panel #debug.
   ========================================================== */
const REVISION={graves:[],avisos:[]};
(function(){
  const grave=t=>REVISION.graves.push(t), aviso=t=>REVISION.avisos.push(t);
  const esFecha=k=>typeof k==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(k)&&isoD(deISO(k))===k;
  /* quita de una lista las entradas que no pasan la prueba, avisando de cada una */
  function filtrar(lista,nombre,prueba){
    for(let i=lista.length-1;i>=0;i--){
      const fallo=prueba(lista[i]);
      if(fallo){ grave(`${nombre} n.º ${i+1}: ${fallo}. Se ha dejado fuera.`); lista.splice(i,1); }
    }
  }

  /* asignaturas */
  Object.keys(SUBJ).forEach(k=>{
    const S=SUBJ[k];
    ["n","ab","c","s","cam"].forEach(c=>{ if(!S[c]) grave(`SUBJ.${k}: falta "${c}".`); });
    if(S.cam&&!CAMPUS[S.cam]) aviso(`SUBJ.${k}: campus "${S.cam}" desconocido (GET o LEG).`);
    if(!CUATRIS.some(c=>c.n===(S.cuatri||1))) aviso(`SUBJ.${k}: cuatrimestre ${S.cuatri} no existe en CUATRIS.`);
    /* sin evaluación la ficha no se puede pintar: se pone una vacía */
    const E=EVAL[k];
    if(!E){ grave(`EVAL.${k}: no existe. Se muestra la ficha sin evaluación.`); EVAL[k]={bar:[],rules:[],min:"Sin datos de evaluación todavía."}; return; }
    if(!Array.isArray(E.rules)){ aviso(`EVAL.${k}: falta "rules".`); E.rules=[]; }
    if(typeof E.min!=="string"){ aviso(`EVAL.${k}: falta "min".`); E.min=""; }
    if(E.bar){
      const suma=E.bar.reduce((s,b)=>s+b[1],0);
      if(Math.abs(suma-100)>.01) aviso(`EVAL.${k}: los porcentajes suman ${suma}, no 100.`);
    }
  });
  Object.keys(EVAL).forEach(k=>{ if(!SUBJ[k]) aviso(`EVAL.${k}: no corresponde a ninguna asignatura.`); });

  /* horario */
  filtrar(CLASSES,"CLASSES",c=>{
    if(!SUBJ[c.id]) return `asignatura "${c.id}" desconocida`;
    if(!(c.d>=0&&c.d<=4)) return `día ${c.d} fuera de lunes (0) a viernes (4)`;
    if(!(c.a<c.b)) return `empieza (${c.a}) después de acabar (${c.b})`;
    if(c.dates){ const mal=c.dates.find(x=>!esFecha(x)); if(mal) return `fecha "${mal}" mal escrita`; }
    else if(!esFecha(c.from)||!esFecha(c.to)) return `faltan "from"/"to" o están mal escritos`;
    return null;
  });
  CLASSES.forEach(c=>{ if(c.dates) c.dates.forEach(x=>{
    if(deISO(x).getDay()-1!==c.d) aviso(`Clase de ${SUBJ[c.id].ab}: el ${x} no es ${DIA_LARGO[c.d+1].toLowerCase()}.`);
  }); });

  /* profesorado */
  filtrar(PROFS,"PROFS",p=>SUBJ[p.id]?null:`asignatura "${p.id}" desconocida`);
  Object.keys(SUBJ).forEach(k=>{
    const coords=PROFS.filter(p=>p.id===k&&p.coord);
    if(coords.length>1) aviso(`${SUBJ[k].n}: ${coords.length} coordinadores (${coords.map(p=>p.name).join(", ")}). Solo puede haber uno.`);
    if(!coords.length) aviso(`${SUBJ[k].n}: sin coordinador.`);
    if(!PROFS.some(p=>p.id===k&&p.rol)) aviso(`${SUBJ[k].n}: sin nadie que dé clase.`);
  });

  /* fechas evaluables */
  filtrar(CAL,"CAL",e=>{
    if(!SUBJ[e.id]) return `asignatura "${e.id}" desconocida`;
    if(!TIPO[e.type]) return `tipo "${e.type}" desconocido (ex, en, cl o cf)`;
    if(!esFecha(e.date)) return `fecha "${e.date}" mal escrita`;
    if(e.hasta&&(!esFecha(e.hasta)||e.hasta<e.date)) return `"hasta" (${e.hasta}) mal escrito o anterior a la fecha`;
    if(!e.what) return `falta "what"`;
    return null;
  });
  CAL.filter(e=>!e.sinDia).forEach(e=>{
    const S=SUBJ[e.id], txt=`${S.ab} · "${e.what.slice(0,40)}" (${e.date})`;
    const motivo=sinClaseEl(e.date);
    if(motivo&&motivo.motivo!=="finde"&&!e.online) aviso(`${txt}: ese día no hay clase (${motivo.texto})`);
    else if(!motivo&&!e.online&&e.type!=="cf"&&!clasesDe(e.date).some(c=>c.id===e.id))
      aviso(`${txt}: ese día no hay clase de ${S.ab}.`);
  });

  /* tareas */
  Object.keys(TAREAS).forEach(k=>{ if(!SUBJ[k]){ grave(`TAREAS.${k}: asignatura desconocida. Se ha dejado fuera.`); delete TAREAS[k]; } });
  const repes=(lista,donde)=>{ const vistos=new Set(); lista.forEach(t=>{ const s=slug(t[0]);
    if(vistos.has(s)) aviso(`${donde}: dos tareas se llaman igual ("${t[0]}"); sus marcas se confundirían.`); vistos.add(s); }); };
  Object.keys(TAREAS).forEach(k=>repes(TAREAS[k],`TAREAS.${k}`));
  repes(GENERALES,"GENERALES");

  if(REVISION.graves.length){
    console.error("Datos con errores (apartados para que la página siga funcionando):\n- "+REVISION.graves.join("\n- "));
    avisarFallo(REVISION.graves.length===1?REVISION.graves[0]:`${REVISION.graves.length} errores en los datos. El primero: ${REVISION.graves[0]}`);
  }
  if(REVISION.avisos.length) console.warn("Revisar datos:\n- "+REVISION.avisos.join("\n- "));
})();
