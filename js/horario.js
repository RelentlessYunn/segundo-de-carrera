/* ==========================================================
   horario.js — horario semanal: rejilla proporcional (escritorio),
   lista por días (móvil), barra de estado y leyenda de colores.
   Todo sale de CLASSES; la colocación y los choques vienen de derivados.js.
   ========================================================== */
const ESC=1.2;   /* píxeles por minuto en la rejilla */
(function(){
  const hoy=hoyISO();
  const ids=asignaturasEn(hoy);
  const filas=CLASSES.filter(c=>ids.includes(c.id));

  /* ---------- rejilla: las horas se ajustan a la primera y la última clase ---------- */
  const hIni=filas.length?Math.floor(Math.min(...filas.map(c=>c.a))/60):9;
  const hFin=filas.length?Math.ceil(Math.max(...filas.map(c=>c.b))/60):20;
  const T0=hIni*60;
  const diaHoy=deISO(hoy).getDay()-1;

  $("#calhead").innerHTML="<div></div>"+DAYS.map((d,i)=>`<div${i===diaHoy?' class="hoy"':""}>${d}</div>`).join("");
  let g='<div class="gutter">';
  for(let h=hIni;h<=hFin;h++) g+=`<b style="top:${(h*60-T0)*ESC}px">${String(h).padStart(2,"0")}:00</b>`;
  g+="</div>";
  let n=0;   /* orden de aparición, para la entrada escalonada */
  DAYS.forEach((_,d)=>{
    g+=`<div class="daycol${d===diaHoy?" hoy":""}">`;
    filas.filter(c=>c.d===d).forEach(c=>{
      const S=SUBJ[c.id], nc=c.ncol||1, col=c.col||0;
      const pos=nc===1?"left:5px;right:5px;"
        :`left:calc(${col*100/nc}% + ${col?2:5}px);width:calc(${100/nc}% - 7px);`;
      const cls="ev"+(nc>1?" half":"")+(c.choca?" dash":"")+(c.dates?" hatch":"");
      g+=`<div class="${cls}" style="${pos}top:${(c.a-T0)*ESC}px;height:${(c.b-c.a)*ESC}px;`+
         `background-image:linear-gradient(${S.s},${S.s});border-color:${S.c};--sc:${S.c};--i:${n++}">`+
         (c.choca?`<span class="mark" style="color:${S.c}" title="Choca con otra clase en alguna fecha">⚠</span>`:"")+
         `<div class="tags" style="color:${S.c}"><span class="tag grp">grp. ${esc(c.grp)}</span><span class="tag cam">${S.cam}</span></div>`+
         `<b>${esc(S.n)}</b><u>${hhmm(c.a)}–${hhmm(c.b)} · ${esc(c.t)}</u><s>${esc(c.au)}</s></div>`;
    });
    g+="</div>";
  });
  const cuerpo=$("#calbody");
  cuerpo.innerHTML=g;
  cuerpo.style.setProperty("--alto",((hFin*60-T0)*ESC+14)+"px");

  /* a medianoche, la columna iluminada pasa al día nuevo */
  document.addEventListener("nuevoDia",e=>{
    const d=deISO(e.detail).getDay()-1;
    $$("#calhead > div").forEach((x,i)=>x.classList.toggle("hoy",i-1===d));
    $$("#calbody .daycol").forEach((x,i)=>x.classList.toggle("hoy",i===d));
  });

  /* ---------- barra de estado: se calcula del horario, no se escribe a mano ---------- */
  const solapan=(x,y)=>x.a<y.b&&y.a<x.b;
  const fijos=[];
  filas.forEach((x,i)=>filas.slice(i+1).forEach(y=>{
    if(x.id!==y.id&&x.d===y.d&&!x.dates&&!y.dates&&solapan(x,y)&&x.from<=y.to&&y.from<=x.to) fijos.push([x,y]);
  }));
  const pares=new Map();
  /* los choques entre dos clases semanales ya salen como "fijos"; aquí van los de fechas sueltas */
  CHOQUES.filter(ch=>ids.includes(ch.x.id)&&ids.includes(ch.y.id)&&(ch.x.dates||ch.y.dates)).forEach(ch=>{
    const clave=[ch.x.id,ch.y.id].sort().join("×");
    if(!pares.has(clave)) pares.set(clave,{x:ch.x,y:ch.y,fechas:[]});
    pares.get(clave).fechas.push(ch.date);
  });
  const partes=[];
  partes.push(fijos.length
    ? `<span class="s wr">⚠ ${plural(fijos.length,"choque fijo","choques fijos")}: ${fijos.map(p=>SUBJ[p[0].id].ab+" y "+SUBJ[p[1].id].ab).join(", ")}</span>`
    : `<span class="s ok">✓ Sin choques fijos</span>`);
  pares.forEach(p=>{
    const dia=DIA_LARGO[deISO(p.fechas[0]).getDay()].toLowerCase();
    const cuando=p.fechas.length===1?`el ${dia} ${etiquetaEv({date:p.fechas[0]}).split(" ").slice(1).join(" ")}`:`${p.fechas.length} ${dia}`;
    const [u,v]=p.y.dates&&!p.x.dates?[p.y,p.x]:[p.x,p.y];   /* primero la de fechas sueltas */
    partes.push(`<span class="s wr">⚠ ${SUBJ[u.id].ab} y ${SUBJ[v.id].ab} chocan ${cuando}</span>`);
  });
  const mixtos=DAYS.filter((_,d)=>new Set(filas.filter(c=>c.d===d).map(c=>SUBJ[c.id].cam)).size>1)
    .map(x=>x.toLowerCase());
  if(mixtos.length) partes.push(`<span class="s">${Object.values(CAMPUS).join(" y ")} el mismo día: ${mixtos.join(" y ")}</span>`);
  partes.push(`<span class="sep"></span><span class="key">`+
    (CHOQUES.length?`<span><i class="kbox"></i>choque posible</span>`:"")+
    `<span><i class="kbox hatch"></i>fechas sueltas</span></span>`);
  $("#estadoHorario").innerHTML=partes.join("");

  /* ---------- leyenda y versión por días (móvil) ---------- */
  $("#subjkey").innerHTML=ids.map(k=>`<span><i class="sw" style="background:${SUBJ[k].c}"></i>${esc(SUBJ[k].n)}</span>`).join("");
  $("#dayblocks").innerHTML=DAYS.map((dn,d)=>{
    const lista=filas.filter(c=>c.d===d).sort((a,b)=>a.a-b.a);
    if(!lista.length) return "";
    const cam=[...new Set(lista.map(c=>campusDe(c.id)))].join(" y ");
    return `<div class="dayblock"><h3>${dn}<em>${cam}</em></h3>`+lista.map(c=>{
      const S=SUBJ[c.id];
      return `<div class="trow"><span class="sw" style="background:${S.c}"></span><time>${hhmm(c.a)}–${hhmm(c.b)}</time>`+
        `<div class="m"><b>${esc(S.n)}</b><em>${esc(c.t)} · grupo ${esc(c.grp)} · ${esc(c.r)}</em></div><span class="aula">${esc(c.au)}</span></div>`;
    }).join("")+"</div>";
  }).join("");
})();
