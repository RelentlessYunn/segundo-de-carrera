/* ==========================================================
   planificador.js — calendario mensual de todo el curso (de ACAD.curso),
   con periodos, festivos, número de semana, avance en amarillo y las fechas
   de CAL como fichas que abren su detalle.
   ========================================================== */
(function(){
  const DOW=["L","M","X","J","V","S","D"];
  /* meses del curso, sacados de ACAD.curso */
  const meses=[];
  for(let d=deISO(ACAD.curso.from.slice(0,8)+"01"); isoD(d)<=ACAD.curso.to; d.setMonth(d.getMonth()+1))
    meses.push({y:d.getFullYear(),m:d.getMonth()});
  const indiceDe=k=>{ const d=deISO(k), i=meses.findIndex(mo=>mo.y===d.getFullYear()&&mo.m===d.getMonth()); return i<0?0:i; };
  let cur=indiceDe(hoyISO());
  const caja=$("#month-grids");

  /* número de semana lectiva, solo en el lunes de cada fila */
  const etiquetaSemana=k=>{
    if(deISO(k).getDay()!==1) return "";
    const w=semanaEn(k);
    return w?`<div class="m-wk">S${w.n}</div>`:"";
  };
  const ficha=(e,extra)=>{
    const S=SUBJ[e.id];
    return `<button class="m-chip ${e.type}${e.sinDia?" pend":""}${extra?" "+extra:""}" data-ev="${CAL.indexOf(e)}" style="--sc:${S.c}" `+
      `aria-label="${esc(TIPO[e.type]+" de "+S.n+(e.sinDia?", día por confirmar":"")+(extra?", cierra":""))}">`+
      `<i></i><span>${esc(S.ab)} · ${extra?"cierra":TIPO[e.type]}</span></button>`;
  };

  function pintar(){
    const mo=meses[cur], hoy=hoyISO();
    let html=`<div class="month"><div class="m-title">`+
      `<button class="m-nav" data-go="-1"${cur===0?" disabled":""} aria-label="Mes anterior">‹</button>`+
      `<span class="m-name">${MES_LARGO[mo.m].charAt(0).toUpperCase()+MES_LARGO[mo.m].slice(1)} ${mo.y}</span>`+
      `<button class="m-nav" data-go="1"${cur===meses.length-1?" disabled":""} aria-label="Mes siguiente">›</button>`+
      `<button class="m-hoy" data-go="hoy">Hoy</button></div>`;
    html+='<div class="m-grid head">'+DOW.map(d=>`<div>${d}</div>`).join("")+'</div><div class="m-grid days">';

    const primero=new Date(mo.y,mo.m,1).getDay(), hueco=primero===0?6:primero-1;
    const total=new Date(mo.y,mo.m+1,0).getDate();
    /* días del mes anterior y del siguiente para completar las filas */
    const fuera=dt=>`<div class="m-day out">${etiquetaSemana(isoD(dt))}<div class="m-date">${dt.getDate()}</div></div>`;
    for(let i=hueco;i>0;i--) html+=fuera(new Date(mo.y,mo.m,1-i));

    for(let d=1;d<=total;d++){
      const dt=new Date(mo.y,mo.m,d), k=isoD(dt);
      const finde=dt.getDay()===0||dt.getDay()===6;
      const f=festivoDe(k), tr=tramoDe(k), marca=ACAD.marcas.find(x=>x.date===k);
      const vacaciones=tr&&tr.tipo==="nolectivo";
      let cls="m-day", etiqueta="";
      if(finde) cls+=" finde";
      if(vacaciones){ cls+=" nolectivo"; if(k===tr.from||d===1) etiqueta=`<div class="m-tag">${esc(tr.t)}</div>`; }
      else if(tr&&tr.tipo==="examen"){ cls+=" examen"; if(k===tr.from||d===1) etiqueta=`<div class="m-tag">${esc(tr.t)}</div>`; }
      if(f&&!finde&&!vacaciones){ cls+=" sinclase"; etiqueta=`<div class="m-tag">Sin clase${f.campus?" · solo "+CAMPUS[f.campus.toUpperCase()]:""}</div>`; }
      /* amarillo de avance: cualquier día ya pasado que no tenga otro color */
      const neutro=!finde&&!(f&&!vacaciones)&&!(tr&&(tr.tipo==="examen"||vacaciones));
      if(neutro&&k<hoy&&k>=ACAD.curso.from) cls+=" past";
      if(k===hoy) cls+=" today";
      if(marca) etiqueta=`<div class="m-tag mark">${esc(marca.t)}</div>`+etiqueta;
      /* la ficha va el día de la fecha; en las ventanas de varios días, también el día que cierra */
      const fichas=CAL.filter(e=>e.date===k).map(e=>ficha(e))
        .concat(CAL.filter(e=>e.hasta===k&&e.date!==k).map(e=>ficha(e,"cierre")));
      html+=`<div class="${cls}"${k===hoy?' aria-current="date"':""}>${etiquetaSemana(k)}<div class="m-date">${d}</div>${etiqueta}${fichas.join("")}</div>`;
    }
    const resto=(hueco+total)%7;
    if(resto) for(let i=1;i<=7-resto;i++) html+=fuera(new Date(mo.y,mo.m+1,i));
    caja.innerHTML=html+'</div></div><div id="ev-detail" class="ev-detail" hidden></div>';
  }

  caja.addEventListener("click",ev=>{
    const chip=ev.target.closest(".m-chip");
    if(chip){ pintarDetalle("ev-detail",CAL[+chip.dataset.ev]); return; }
    const b=ev.target.closest("[data-go]"); if(!b) return;
    if(b.dataset.go==="hoy") cur=indiceDe(hoyISO());
    else { const n=cur+(+b.dataset.go); if(n<0||n>=meses.length) return; cur=n; }
    pintar();
  });
  cerrarDetalleAl("ev-detail",".m-chip");
  /* a medianoche: el recuadro de hoy y el amarillo avanzan; si mirabas el mes de hoy, se queda en él */
  document.addEventListener("nuevoDia",e=>{
    const antes=sumaDias(e.detail,-1);
    if(cur===indiceDe(antes)) cur=indiceDe(e.detail);
    pintar();
  });
  pintar();
})();
