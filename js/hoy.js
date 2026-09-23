/* ==========================================================
   hoy.js — el visor del día: clases con su aula, línea roja de la hora,
   estado en vivo ("quedan 20 min"), avisos del día, próximos 7 días y
   recomendaciones de la semana. Se mueve entre días con las flechas.
   ========================================================== */
(function(){
  let ver=hoyISO();          /* día que se está viendo */
  let siguiendoHoy=true;     /* si miras hoy y pasa la medianoche, avanza solo */
  let clases=[];             /* clases del día que se está viendo */
  const lista=$("#todayList");

  /* ---------- pintado completo del día ---------- */
  function pintar(){
    const hoyK=hoyISO(), esHoy=ver===hoyK, d=deISO(ver), sem=semanaEn(ver);
    siguiendoHoy=esHoy;
    $("#todayName").textContent=(esHoy?"Hoy · ":"")+DIA_LARGO[d.getDay()]+", "+d.getDate()+" de "+MES_LARGO[d.getMonth()];
    $("#dHoy").hidden=esHoy;
    $("#todayVivo").hidden=true;

    /* avisos del día: festivos, periodos y lo que cae ese día */
    const flags=[], f=festivoDe(ver), tr=tramoDe(ver);
    if(f) flags.push(["sin","Sin clase"+(f.campus?" · solo "+CAMPUS[f.campus.toUpperCase()]:"")]);
    if(tr&&tr.tipo!=="clases") flags.push([tr.tipo==="examen"?"exa":"nol",tr.t]);
    CAL.filter(e=>caeEn(e,ver)).sort(ordenEv).forEach(e=>flags.push([e.type==="ex"?"exa":e.type==="cf"?"cf":"ev",
      SUBJ[e.id].n+" · "+e.what+(e.hasta&&e.hasta!==ver?" (hasta el "+DIA_LARGO[deISO(e.hasta).getDay()].toLowerCase()+")":"")]));
    $("#dayFlags").innerHTML=flags.length
      ? '<div class="d-flags">'+flags.map(x=>`<div class="d-flag f-${x[0]}">${esc(x[1])}</div>`).join("")+'</div>' : "";

    /* clases */
    clases=clasesDe(ver);
    lista.classList.remove("quieto");
    clearTimeout(lista.__q);
    /* las filas entran una vez; luego se quedan quietas aunque la pestaña se oculte y vuelva */
    lista.__q=setTimeout(()=>{ lista.classList.add("quieto"); delete lista.dataset.dir; },900);
    if(!clases.length){
      const motivo=sinClaseEl(ver);
      lista.innerHTML=`<div class="empty">${esc(motivo?motivo.texto:"No tienes clase este día.")}</div>`;
      $("#todayMeta").textContent=sem?`Semana ${sem.n} · ${ordinalCuatri(sem.c)} cuatrimestre`:"";
    }else{
      lista.innerHTML=clases.map((c,i)=>{
        const S=SUBJ[c.id];
        return `<button class="trow tap" data-peek="${c.id}" style="--sc:${S.c};--d:${i*70}ms">`+
          `<span class="sw" style="background:${S.c}"></span>`+
          `<time>${hhmm(c.a)}–${hhmm(c.b)}</time>`+
          `<span class="m"><b>${esc(S.n)}</b><em>${esc(c.t)} · ${campusDe(c.id)}</em></span>`+
          `<span class="aula">${esc(c.au)}</span></button>`;
      }).join("");
      const campus=[...new Set(clases.map(c=>campusDe(c.id)))].join(" y ");
      $("#todayMeta").textContent=plural(clases.length,"clase","clases")+" · "+campus+(sem?" · semana "+sem.n:"");
    }
    refrescar();
    proximos();
    recomendaciones(sem);
  }

  /* ---------- refresco de cada minuto: sin rehacer nada, solo lo que cambia ----------
     Las filas se actualizan en su sitio: no se pierde el foco ni se repite ninguna animación. */
  function refrescar(){
    const esHoy=ver===hoyISO(), m=minutosDe(new Date());
    const filas=$$("#todayList .trow");
    filas.forEach((fila,i)=>{
      const c=clases[i]; if(!c) return;
      const est=esHoy?estadoClase(c,m):"futura";
      fila.classList.toggle("now",est==="ahora");
      fila.classList.toggle("ya",est==="pasada");
      let p=fila.querySelector(".prog-clase");
      if(est==="ahora"){
        if(!p){ p=document.createElement("i"); p.className="prog-clase"; p.innerHTML="<u></u>"; fila.appendChild(p); }
        p.firstChild.style.width=Math.round((m-c.a)/(c.b-c.a)*100)+"%";
      } else if(p) p.remove();
    });
    barraDia(esHoy,m,filas);
  }

  /* ---------- línea roja: arriba antes de clase, abajo al terminar, y en medio sobre las filas ---------- */
  const falta=min=>min<60?min+" min":Math.floor(min/60)+" h"+(min%60?" "+(min%60)+" min":"");
  function barraDia(esHoy,m,filas){
    lista.querySelectorAll(".barra-dia").forEach(x=>x.remove());
    const vivo=$("#todayVivo");
    vivo.hidden=true;
    if(!esHoy||!clases.length||filas.length!==clases.length) return;
    /* con la sección oculta las filas no miden nada: se recoloca al volver */
    if(!lista.offsetParent) return;
    const ult=filas[filas.length-1], fin=Math.max(...clases.map(c=>c.b));
    let top=0, modo="", txt="";
    if(m<clases[0].a){ modo="arriba"; txt="empiezas en "+falta(clases[0].a-m); }
    else if(m>=fin){ modo="abajo"; top=ult.offsetTop+ult.offsetHeight-2; txt="día de clase terminado"; }
    else for(let i=0;i<clases.length;i++){
      const c=clases[i], y=filas[i].offsetTop, h=filas[i].offsetHeight;
      if(m<c.a){ top=y-1; txt="siguiente en "+falta(c.a-m); break; }
      if(m<c.b){ top=y+h*((m-c.a)/(c.b-c.a)); txt="quedan "+falta(c.b-m); break; }
    }
    const l=document.createElement("div");
    l.className="barra-dia"+(modo?" "+modo:"");
    l.style.top=top+"px";
    l.innerHTML='<span class="pt"></span>';
    lista.appendChild(l);
    /* el texto va en la cabecera del día: sobre la línea tapaba la hora o el aula */
    vivo.textContent=txt; vivo.className="vivo"+(modo?" "+modo:""); vivo.hidden=false;
  }

  /* ---------- lo que cae en los siete días siguientes al que estás viendo ---------- */
  function proximos(){
    const hasta=sumaDias(ver,7);
    const evs=CAL.filter(e=>finDe(e)>=ver&&e.date<=hasta
      /* las fechas sin día se ven toda su semana */
      || e.sinDia&&(()=>{ const w=semanaEn(e.date); return w&&w.to>=ver&&w.from<=hasta; })()).sort(ordenEv);
    const box=$("#countdown");
    if(!evs.length){ box.innerHTML='<div class="n7-empty">Nada evaluable en los próximos siete días.</div>'; return; }
    box.innerHTML=`<div class="n7-head">Próximos 7 días</div>`+evs.map(e=>{
      const S=SUBJ[e.id], cuando=cuandoEv(e,ver);
      const urge=!e.sinDia&&esPrueba(e)&&diasEntre(ver,e.date)<=1;
      return `<button class="n7-card ${e.type}${urge?" urg":""}" data-ev="${CAL.indexOf(e)}" style="--sc:${S.c}">`+
        `<span class="n7-txt"><b>${TIPO[e.type]} de ${esc(S.n)}</b>`+
        `<em>${esc(e.sinDia?etiquetaEv(e):e.hora||etiquetaEv(e))}</em></span>`+
        `<span class="n7-when">${esc(cuando)}</span></button>`;
    }).join("");
  }

  /* ---------- la semana: primero lo que cae (sale solo de CAL), luego los consejos de AVISOS ---------- */
  function recomendaciones(sem){
    const box=$("#reco");
    if(!sem){ box.innerHTML=""; return; }
    const evs=CAL.filter(e=>{ const w=semanaEn(e.date); return w&&w.c===sem.c&&w.n===sem.n; }).sort(ordenEv);
    const consejos=(AVISOS[sem.c]&&AVISOS[sem.c][sem.n])||[];
    if(!evs.length&&!consejos.length){ box.innerHTML=""; return; }
    const abierto=box.querySelector("details[open]")&&box.dataset.sem===sem.c+"-"+sem.n;
    box.dataset.sem=sem.c+"-"+sem.n;
    const cuenta=[evs.length?plural(evs.length,"fecha","fechas"):"",consejos.length?plural(consejos.length,"consejo","consejos"):""].filter(Boolean).join(" · ");
    const actual=semanaEn(hoyISO());
    box.innerHTML=`<details class="reco"${abierto?" open":""}><summary>${actual&&actual.c===sem.c&&actual.n===sem.n?"Esta semana":"Semana "+sem.n}`+
      `<span>${cuenta}</span></summary>`+
      (evs.length?`<ul class="reco-ev">`+evs.map(e=>`<li style="--sc:${SUBJ[e.id].c}"><b>${esc(e.sinDia?"sin día":e.hasta?etiquetaEv(e):DIA_CORTO[deISO(e.date).getDay()]+" "+deISO(e.date).getDate())}</b>`+
        `<span>${TIPO[e.type]} · ${esc(SUBJ[e.id].ab)} · ${esc(e.what)}</span></li>`).join("")+`</ul>`:"")+
      (consejos.length?`<ul class="tight">`+consejos.map(t=>`<li>${esc(t)}</li>`).join("")+`</ul>`:"")+
      `</details>`;
  }

  /* ---------- ficha de la asignatura bajo la lista (la misma de Asignaturas) ---------- */
  function pintarResumen(k){
    const box=$("#subjPeek");
    if(box.dataset.k===k && !box.hidden){ box.hidden=true; box.dataset.k=""; return; }
    box.dataset.k=k;
    box.innerHTML=`<button class="ev-close peek-x" aria-label="Cerrar ficha">×</button>`+
      fichaHTML(k,{acordeon:false, scope:"peek", editable:false});
    /* copia las notas de la ficha principal, que es donde se editan */
    box.querySelectorAll('.g-input[data-scope="peek"]').forEach(inp=>{
      const origen=document.getElementById(inp.id.replace("g_peek_","g_main_"));
      if(origen) inp.value=origen.value;
    });
    recalcular(k,"peek");
    const nota=box.querySelector(".calc");
    if(nota) nota.insertAdjacentHTML("beforeend",`<div class="calc-ro">Las notas se editan en <a href="#asignaturas">Asignaturas</a>.</div>`);
    box.hidden=false;
    box.scrollIntoView({block:"nearest",behavior:reducido()?"auto":"smooth"});
  }
  document.addEventListener("click",ev=>{
    const t=ev.target.closest("[data-peek]");
    if(t){ pintarResumen(t.dataset.peek); return; }
    if(ev.target.closest(".peek-x")){ const box=$("#subjPeek"); box.hidden=true; box.dataset.k=""; }
    const card=ev.target.closest(".n7-card");
    if(card) pintarDetalle("hoy-detail", CAL[+card.dataset.ev]);
  });
  cerrarDetalleAl("hoy-detail",".n7-card");

  /* ---------- tiempo ---------- */
  document.addEventListener("minuto",()=>{
    if($("#hoy").hidden) return;                    /* oculto no se mide: se hace al volver */
    if(ver===hoyISO()) refrescar();
  });
  document.addEventListener("nuevoDia",e=>{
    if(siguiendoHoy){ ver=e.detail; pintar(); } else proximos();
  });
  document.addEventListener("pestana",e=>{ if(e.detail==="horario") refrescar(); });
  let rz=0;
  window.addEventListener("resize",()=>{ cancelAnimationFrame(rz); rz=requestAnimationFrame(refrescar); });
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(refrescar);

  /* ---------- flechas: el día nuevo entra por el lado hacia el que te mueves ---------- */
  const irA=(dir,dia)=>{ ver=dia; lista.dataset.dir=dir; pintar(); };
  $("#dPrev").addEventListener("click",()=>irA("prev",sumaDias(ver,-1)));
  $("#dNext").addEventListener("click",()=>irA("next",sumaDias(ver,1)));
  $("#dHoy").addEventListener("click",()=>irA(ver>hoyISO()?"prev":"next",hoyISO()));

  pintar();
})();
