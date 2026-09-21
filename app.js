/* ===================== RENDER ===================== */
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;");

/* Etiqueta de rol unificada. Leganés: un profesor para teoría y ejercicios.
   Getafe: magistral y prácticas por separado. La coordinación se añade aparte. */
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
/* versión en texto plano, para la tabla y para lectores de pantalla */
function rolLabel(p){ return rolPartes(p).map(x=>x[0]).join(" · "); }
function rolChips(p){
  const t=rolPartes(p);
  if(!t.length) return "";
  return `<div class="roles">`+t.map(x=>`<span class="rol ${x[1]}">${x[0]}</span>`).join("")+`</div>`;
}

const hhmm=m=>String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0");
const CURSO_INI=new Date(2026,8,7), CURSO_FIN=new Date(2026,11,12);
const ESC=1.2;   /* píxeles por minuto en la rejilla del horario */
const isoD=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const TIPO={ex:"Examen",en:"Entrega",cl:"Clase",cf:"Choque de horario"};
const TIPO_LARGO={ex:"Examen",en:"Entrega",cl:"Laboratorio o clase",cf:"Conflicto de horario"};

/* Panel de detalle de una fecha. Lo usan el visor de día y el calendario. */
function pintarDetalle(idBox, ev){
  const box=document.getElementById(idBox); if(!box) return;
  const S=SUBJ[ev.id];
  const filas=[["Cuándo", ev.label+(ev.hora?" · "+ev.hora:"")+(ev.sinDia?" · día sin confirmar":"")]];
  if(ev.aula) filas.push(["Dónde", ev.aula]);
  if(ev.formato) filas.push(["Formato", ev.formato]);
  filas.push(["Peso", ev.w]);
  if(ev.temario) filas.push(["Entra", ev.temario]);
  box.hidden=false;
  box.style.borderLeftColor=S.c;
  box.innerHTML=`<div class="ev-head"><b style="color:${S.c}">${TIPO_LARGO[ev.type]} de ${esc(S.n)}</b>`+
    `<button class="ev-close" aria-label="Cerrar">×</button></div>`+
    `<div class="ev-meta">Semana ${ev.wk}</div>`+
    `<dl class="ev-dl">`+filas.map(f=>`<dt>${esc(f[0])}</dt><dd>${esc(f[1])}</dd>`).join("")+`</dl>`+
    (ev.temario?"":`<p class="nodata">Temario concreto: pendiente de que lo publique el profesor.</p>`);
  box.scrollIntoView({block:"nearest",behavior:"smooth"});
}
/* Cierra un panel al pulsar la equis o fuera de él */
function cerrarDetalleAl(idBox, selectorAbre){
  document.addEventListener("click",ev=>{
    const box=document.getElementById(idBox); if(!box) return;
    if(ev.target.classList.contains("ev-close")){ box.hidden=true; return; }
    if(!ev.target.closest(selectorAbre) && !ev.target.closest("#"+idBox)) box.hidden=true;
  });
}

/* Semanas de un cuatrimestre, calculadas de sus fechas de inicio y fin. */
function semanasDe(c){
  const out=[], ini=new Date(c.ini+"T12:00:00"), fin=new Date(c.fin+"T12:00:00");
  /* el cuatrimestre puede empezar en martes: las semanas se anclan al lunes */
  const d=new Date(ini); d.setDate(d.getDate()-((d.getDay()+6)%7));
  let n=1;
  while(d<=fin){
    const a=new Date(d), b=new Date(d); b.setDate(b.getDate()+6);
    const v=new Date(a); v.setDate(v.getDate()+4);
    out.push({c:c.n, n, from:isoD(a), to:isoD(b), label:etiquetaRango(a,v)});
    d.setDate(d.getDate()+7); n++;
  }
  return out;
}
function etiquetaRango(a,b){
  const M=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return a.getMonth()===b.getMonth()
    ? `${a.getDate()} – ${b.getDate()} ${M[b.getMonth()]}`
    : `${a.getDate()} ${M[a.getMonth()]} – ${b.getDate()} ${M[b.getMonth()]}`;
}
const SEMANAS=CUATRIS.flatMap(semanasDe);
/* En qué semana cae una fecha */
const semanaEn=key=>SEMANAS.find(w=>key>=w.from&&key<=w.to)||null;
const HOY_KEY=isoD(new Date());
const semActual=semanaEn(HOY_KEY);
const semanaActual=semActual&&semActual.c===1?semActual.n:0;
/* Para el progreso del temario: si el cuatrimestre ya acabó, cuenta como completo */
const semanaProgreso=(()=>{
  const hoy=new Date();
  if(hoy<new Date(CUATRIS[0].ini+"T12:00:00")) return 0;
  if(hoy>new Date(CUATRIS[0].fin+"T12:00:00")) return 99;
  return semanaActual||0;
})();


/* Ficha de la asignatura desplegada desde el visor de día.
   Es la misma que en la pestaña Asignaturas, sin el acordeón del temario. */
function pintarResumen(k){
  const box=document.getElementById("subjPeek"); if(!box) return;
  if(box.dataset.k===k && !box.hidden){ box.hidden=true; box.dataset.k=""; return; }
  box.dataset.k=k;
  box.innerHTML=`<button class="ev-close peek-x" aria-label="Cerrar">×</button>`+
    window.fichaHTML(k,{acordeon:false, scope:"peek", editable:false});
  /* copia las notas de la ficha principal, que es donde se editan */
  box.querySelectorAll('.g-input[data-scope="peek"]').forEach(inp=>{
    const origen=document.getElementById(inp.id.replace("g_peek_","g_main_"));
    if(origen) inp.value=origen.value;
  });
  if(window.recalcular) window.recalcular(k,"peek");
  const nota=box.querySelector(".calc");
  if(nota) nota.insertAdjacentHTML("beforeend",
    `<div class="calc-ro">Las notas se editan en <a href="#asignaturas">Asignaturas</a>.</div>`);
  box.hidden=false;
  box.scrollIntoView({block:"nearest",behavior:"smooth"});
}
document.addEventListener("click",ev=>{
  const t=ev.target.closest("[data-peek]");
  if(t){ pintarResumen(t.dataset.peek); return; }
  const box=document.getElementById("subjPeek");
  if(box && ev.target.classList.contains("peek-x")){ box.hidden=true; box.dataset.k=""; }
});

/* --- rejilla --- */
(function(){
 $("#calhead").innerHTML="<div></div>"+DAYS.map(d=>"<div>"+d+"</div>").join("");
 let g='<div class="gutter">';
 for(let h=9;h<=20;h++) g+='<b style="top:'+((h*60-T0)*ESC)+'px">'+String(h).padStart(2,"0")+":00</b>";
 g+="</div>";
 DAYS.forEach((_,d)=>{
   g+='<div class="daycol">';
   CLASSES.filter(c=>c.d===d).forEach(c=>{
     const S=SUBJ[c.id];
     let pos="left:5px;right:5px;";
     if(c.half===0)pos="left:5px;width:calc(50% - 7px);";
     if(c.half===1)pos="left:calc(50% + 2px);right:5px;";
     g+='<div class="ev'+(c.dash?" dash":"")+(c.hatch?" hatch":"")+'" style="'+pos+"top:"+((c.a-T0)*ESC)+"px;height:"+((c.b-c.a)*ESC)+"px;background:"+S.s+";border-color:"+S.c+'">'+
        (c.mark?'<span class="mark" style="color:'+S.c+'">'+c.mark+"</span>":"")+
        '<div class="tags" style="color:'+S.c+'"><span class="tag grp">grp. '+c.grp+'</span><span class="tag cam">'+S.cam+"</span></div>"+
        "<b>"+esc(S.n)+"</b><u>"+hhmm(c.a)+"–"+hhmm(c.b)+" · "+esc(c.t)+"</u><s>"+esc(c.au)+"</s></div>";
   });
   g+="</div>";
 });
 $("#calbody").innerHTML=g;

 $("#subjkey").innerHTML=Object.keys(SUBJ).map(k=>'<span><i class="sw" style="background:'+SUBJ[k].c+'"></i>'+esc(SUBJ[k].n)+"</span>").join("");

 $("#dayblocks").innerHTML=DAYS.map((dn,d)=>{
   const list=CLASSES.filter(c=>c.d===d).sort((a,b)=>a.a-b.a);
   const cam=[...new Set(list.map(c=>SUBJ[c.id].cam==="GET"?"Getafe":"Leganés"))].join(" y ");
   return '<div class="dayblock"><h3>'+dn+"<em>"+cam+"</em></h3>"+list.map(c=>{
     const S=SUBJ[c.id];
     return '<div class="trow"><span class="sw" style="background:'+S.c+'"></span><time>'+hhmm(c.a)+"–"+hhmm(c.b)+'</time><div class="m"><b>'+esc(S.n)+"</b><em>"+esc(c.t)+" · grupo "+c.grp+" · "+esc(c.r)+'</em></div><span class="aula">'+esc(c.au)+"</span></div>";
   }).join("")+"</div>";
 }).join("");
})();

/* --- hoy, con navegación por días --- */
(function(){
  const DN=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const MN=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const hoy=new Date(); const hoyStr=isoD(hoy);
  let ver=new Date(hoy);

  /* contador de semana en la cabecera */
  /* reloj en vivo: los dígitos se renuevan solo cuando cambian */
  (function(){
    const DIAS=["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
    const MESES=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
    function pintaHora(txt){
      const cont=$("#rHora"); if(!cont) return;
      const digs=cont.querySelectorAll(".dig");
      [txt.slice(0,2), txt.slice(3,5)].forEach((par,i)=>{
        if(digs[i] && digs[i].textContent!==par){
          digs[i].textContent=par;
          digs[i].classList.remove("late"); void digs[i].offsetWidth; digs[i].classList.add("late");
        }
      });
    }
    function tic(){
      const n=new Date();
      pintaHora(String(n.getHours()).padStart(2,"0")+":"+String(n.getMinutes()).padStart(2,"0"));
      const eF=$("#rFecha"), eS=$("#rSemana");
      if(eF) eF.textContent=DIAS[n.getDay()]+", "+n.getDate()+" de "+MESES[n.getMonth()];
      if(!eS) return;
      const w=semanaEn(isoD(n));
      if(w){
        const tot=SEMANAS.filter(x=>x.c===w.c).length;
        eS.innerHTML=`<b>Semana ${w.n}</b><span>de ${tot}</span>`+
          `<i class="w-bar"><u style="width:${Math.round(w.n/tot*100)}%"></u></i>`;
      } else {
        eS.innerHTML=`<b>${n<new Date(CUATRIS[0].ini+"T12:00:00")?"Aún no empieza":"Sin clases"}</b>`;
      }
    }
    tic();
    setTimeout(()=>{ tic(); setInterval(tic,60000); }, (60-new Date().getSeconds())*1000);
  })();

  /* una clase cuenta ese día si cae en su rango semanal o en su lista de días sueltos */
  const clasesDe=(key,idx)=>CLASSES
    .filter(c=>c.d===idx && (c.dates ? c.dates.includes(key) : (key>=c.from && key<=c.to)))
    .sort((x,y)=>x.a-y.a);

  function draw(){
    const key=isoD(ver), idx=ver.getDay()-1;
    const esHoy=key===hoyStr;
    $("#todayName").textContent=(esHoy?"Hoy · ":"")+DN[ver.getDay()]+", "+ver.getDate()+" de "+MN[ver.getMonth()];

    /* avisos del día */
    const flags=[];
    const sin=ACAD.sinClase.find(x=>x.date===key);
    const tr=ACAD.tramos.filter(t=>key>=t.from&&key<=t.to)
             .sort((x,y)=>({nolectivo:0,examen:1,clases:2})[x.tipo]-({nolectivo:0,examen:1,clases:2})[y.tipo])[0];
    const evs=CAL.filter(e=>e.date===key);
    const sem=semanaEn(key);

    if(sin) flags.push(["sin","Sin clase"+(sin.campus?" · solo "+(sin.campus==="leg"?"Leganés":"Getafe"):"")]);
    if(tr&&tr.tipo!=="clases") flags.push([tr.tipo==="examen"?"exa":"nol",tr.t]);
    evs.forEach(e=>flags.push([e.type==="ex"?"exa":e.type==="cf"?"cf":"ev",
      SUBJ[e.id].n+" · "+e.what]));
    $("#dayFlags").innerHTML=flags.length
      ? '<div class="d-flags">'+flags.map(f=>`<div class="d-flag f-${f[0]}">${esc(f[1])}</div>`).join("")+'</div>'
      : "";

    /* clases */
    const cs=(idx<0||idx>4||sin)?[]:clasesDe(key,idx);
    if(!cs.length){
      $("#todayList").innerHTML='<div class="empty">'+
        (sin?"No hay clase: día festivo.":(idx<0||idx>4)?"Fin de semana.":"No tienes clase este día.")+'</div>';
      $("#todayMeta").textContent=sem?`Semana ${sem.n} · ${sem.c}.º cuatri`:"";
    }else{
      const m=hoy.getHours()*60+hoy.getMinutes();
      $("#todayList").innerHTML=cs.map((c,i)=>{
        const S=SUBJ[c.id], on=esHoy&&m>=c.a&&m<=c.b, pasada=esHoy&&m>c.b;
        /* cuánto llevas de la clase en curso */
        const prog = on ? Math.round((m-c.a)/(c.b-c.a)*100) : (pasada?100:0);
        return `<button class="trow tap${on?" now":""}${pasada?" ya":""}" data-peek="${c.id}" style="--sc:${S.c};--d:${i*70}ms">`+
          `<span class="sw" style="background:${S.c}"></span>`+
          `<time>${hhmm(c.a)}–${hhmm(c.b)}</time>`+
          `<div class="m"><b>${esc(S.n)}</b><em>${esc(c.t)} · ${S.cam==="GET"?"Getafe":"Leganés"}</em></div>`+
          `<span class="aula">${esc(c.au)}</span>`+
          (on?`<i class="prog-clase"><u style="width:${prog}%"></u></i>`:"")+
          `</button>`;
      }).join("");
      barraDia(cs, esHoy);
      const campus=[...new Set(cs.map(c=>SUBJ[c.id].cam==="GET"?"Getafe":"Leganés"))].join(" y ");
      $("#todayMeta").textContent=cs.length+" clases · "+campus+(sem?" · semana "+sem.n:"");
    }
    $("#dHoy").hidden=esHoy;
    proximos(ver);
    clearInterval(window.__tDia);
    window.__tDia=setInterval(()=>{ if(isoD(ver)===isoD(new Date())) draw(); }, 60000);
    recomendaciones(sem);
  }

  /* Barra roja del día: recorre la lista de clases marcando la hora actual. */
  function barraDia(cs, esHoy){
    const lista=$("#todayList"); if(!lista) return;
    lista.querySelectorAll(".barra-dia").forEach(x=>x.remove());
    if(!esHoy||!cs.length) return;
    const ini=Math.min(...cs.map(c=>c.a)), fin=Math.max(...cs.map(c=>c.b));
    const n=new Date(), m=n.getHours()*60+n.getMinutes();
    if(m<ini||m>fin) return;
    /* la posición se calcula sobre las filas reales, no sobre el reloj:
       así la línea cae donde el ojo espera aunque haya huecos entre clases */
    const filas=[...lista.querySelectorAll(".trow")];
    let top=null;
    for(let i=0;i<cs.length;i++){
      const f=filas[i]; if(!f) continue;
      const y=f.offsetTop, h=f.offsetHeight;
      if(m<cs[i].a){ top=y-3; break; }                       /* en el hueco previo */
      if(m<=cs[i].b){ top=y+h*((m-cs[i].a)/(cs[i].b-cs[i].a)); break; }
    }
    if(top===null) return;
    const l=document.createElement("div");
    l.className="barra-dia";
    l.style.top=top+"px";
    l.innerHTML='<span class="pt"></span><span class="hh">'+hhmm(m)+"</span>";
    lista.appendChild(l);
  }

  /* recomendaciones de la semana, plegadas */
  function recomendaciones(sem){
    const box=$("#reco"); if(!box) return;
    const lista=(sem&&AVISOS[sem.c]&&AVISOS[sem.c][sem.n])||null;
    if(!lista){ box.innerHTML=""; return; }
    box.innerHTML=`<details class="reco"><summary>Recomendado para la semana ${sem.n}`+
      `<span>${lista.length} ${lista.length===1?"aviso":"avisos"}</span></summary>`+
      `<ul class="tight">`+lista.map(t=>`<li>${esc(t)}</li>`).join("")+`</ul></details>`;
  }

  /* qué cae en los siete días siguientes al que estás viendo */
  function proximos(desde){
    const a=new Date(desde), b=new Date(desde); b.setDate(b.getDate()+7);
    const ka=isoD(a), kb=isoD(b);
    const evs=CAL.filter(e=>e.date>=ka&&e.date<=kb).sort((x,y)=>x.date.localeCompare(y.date));
    const box=$("#countdown");
    if(!evs.length){
      box.innerHTML='<div class="n7-empty">Nada evaluable en los próximos siete días.</div>';
      return;
    }
    box.innerHTML=`<div class="n7-head">Próximos 7 días</div>`+
      evs.map(e=>{
        const S=SUBJ[e.id];
        const d=Math.round((new Date(e.date+"T12:00:00")-new Date(isoD(desde)+"T12:00:00"))/86400000);
        const cuando=d===0?"hoy":d===1?"mañana":"en "+d+" días";
        return `<button class="n7-card ${e.type}" data-ev="${CAL.indexOf(e)}" style="--sc:${S.c}">`+
          `<span class="n7-txt"><b>${TIPO[e.type]} de ${esc(S.n)}</b>`+
          `<em>${esc(e.hora||e.label)}${e.sinDia?" · día sin confirmar":""}</em></span>`+
          `<span class="n7-when">${cuando}</span></button>`;
      }).join("");
  }

  /* detalle al pulsar */
  document.addEventListener("click",ev=>{
    const card=ev.target.closest(".n7-card");
    if(card) pintarDetalle("hoy-detail", CAL[parseInt(card.dataset.ev)]);
  });
  cerrarDetalleAl("hoy-detail",".n7-card");

  $("#dPrev").addEventListener("click",()=>{ver.setDate(ver.getDate()-1);draw();});
  $("#dNext").addEventListener("click",()=>{ver.setDate(ver.getDate()+1);draw();});
  $("#dHoy").addEventListener("click",()=>{ver=new Date(hoy);draw();});
  draw();

})();

/* --- fichas de asignatura y calculadora --- */
(function(){
  const shade=(hex,i,n)=>{
    const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
    const f=i/Math.max(n-1,1)*0.45, m=v=>Math.round(v+(255-v)*f);
    return `rgb(${m(r)},${m(g)},${m(b)})`;
  };

  window.fichaHTML=function(k,opts){
    opts=opts||{};
    const acc=opts.acordeon!==false, sc=opts.scope||"main", editable=opts.editable!==false;
    const S=SUBJ[k], E=EVAL[k];
    const cls=CLASSES.filter(c=>c.id===k).sort((a,b)=>a.d-b.d||a.a-b.a);
    const profs=PROFS.filter(p=>p.id===k);
    const dates=CAL.filter(c=>c.id===k).sort((a,b)=>a.date.localeCompare(b.date));

    let h=`<div class="subject"><div class="sh" style="border-left-color:${S.c}"><h3 style="color:${S.c}">${esc(S.n)}</h3><div class="facts">`+
      `<span class="fact">${S.ects} ECTS</span><span class="fact">${esc(S.dept)}</span><span class="fact">grupo ${S.grp}</span><span class="fact fact-${S.cam==="GET"?"get":"leg"}">${S.cam==="GET"?"Getafe":"Leganés"}</span></div></div>`;

    let pH=`<div class="panel"><h4>Horario y aulas</h4><ul class="plain">`+
      cls.map(c=>`<li><span><b>${DAYS[c.d]}</b> ${esc(c.t)}<br><span class="aula">${esc(c.au)}</span></span>`+
        `<span class='d'>${hhmm(c.a)}–${hhmm(c.b)}<br>${esc(c.r)}</span></li>`).join("")+
      `</ul></div>`;

    let pP=`<div class="panel"><h4>Profesorado</h4>`+profs.map(p=>{
      let x=`<div style='margin-bottom:14px'><b style='font-size:.92rem'>${esc(p.name)}</b>`;
      x+=rolChips(p);
      x+=`<dl class='kv' style='margin-top:9px'>`;
      if(p.mail) x+=`<dt>Correo</dt><dd><a href='mailto:${p.mail}'>${p.mail}</a></dd>`;
      if(p.office) x+=`<dt>Despacho</dt><dd>${esc(p.office)}</dd>`;
      x+=`</dl>`;
      if(p.note) x+=`<p class='nodata' style='margin:9px 0 0'>${esc(p.note)}</p>`;
      if(p.mail){
        const sub=encodeURIComponent(`Shengyu Chen — Doble Grado Informática + ADE — ${S.n} — grupo ${S.grp}`);
        /* mailto solo funciona si hay cliente de correo configurado, así que
           se ofrece también Gmail web y copiar la dirección */
        x+=`<div class="mailrow">`+
           `<a class="mailbtn" target="_blank" rel="noopener" href="https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(p.mail)}&su=${sub}">Escribir en Gmail</a>`+
           `<button class="mailcopy" data-mail="${p.mail}">Copiar dirección</button>`+
           `</div>`;
      }
      return x+"</div>";
    }).join("")+"</div>";

    let pE='<div class="panel"><h4>Evaluación</h4>';
    if(E.bar){
      pE+='<div class="bar">'+E.bar.map((b,i)=>`<div style="flex:${b[1]};background:${shade(S.c,i,E.bar.length)}">${b[1]}%</div>`).join("")+"</div>";
      pE+='<div class="barkey">'+E.bar.map((b,i)=>`<span><i style="background:${shade(S.c,i,E.bar.length)}"></i>${esc(b[0])}</span>`).join("")+"</div>";
      pE+='<div class="calc">';
      const esPts=E.calc&&E.calc.escala==="pts";   /* Derecho Civil puntúa sobre 10 puntos, no en % */
      E.bar.forEach((b,i)=>{
        const tope=esPts?(b[1]/10):10;
        pE+=`<div class="calc-row"><label for="g_${sc}_${k}_${i}">${esc(b[0])} `+
            `<span style="color:var(--ink-3)">(${esPts?"máx. "+tope+" ptos":b[1]+"%"})</span></label>`+
            `<input type="number" id="g_${sc}_${k}_${i}" min="0" max="${tope}" step="0.1" `+
            `placeholder="${editable?"Nota":"—"}" ${editable?"":"readonly tabindex=\"-1\""} `+
            `data-subj="${k}" data-scope="${sc}" data-w="${b[1]}" class="g-input${editable?"":" ro"}"></div>`;
      });
      pE+=`<div class="calc-res" id="res-${sc}-${k}"><span>Acumulado: <b>0.00</b> ptos</span></div></div>`;
    }
    pE+=`<div class="min">${E.min}</div></div>`;

    let pF=`<div class="panel"><h4>Fechas propias</h4>`;
    pF+=dates.length?`<ul class="plain">`+dates.map(d=>`<li><span>${esc(d.what)}</span><span class='d'>${esc(d.label)} <span class="pill p-${d.type}">${esc(d.w)}</span></span></li>`).join("")+"</ul>"
      :`<p class='nodata'>Sin fechas evaluables registradas.</p>`;
    pF+=`</div>`;

    /* Dos columnas que se apilan por separado: así ninguna estira a la otra */
    h+=`<div class="panels"><div class="pcol">${pH}${pE}</div><div class="pcol">${pP}${pF}</div></div>`;
    let extra=`<ul class="tight" style="margin-bottom:16px">`+E.rules.map(r=>`<li>${r}</li>`).join("")+"</ul>";
    if(E.weeks){
      const numerado=E.weeks.every(w=>/^\d+$/.test(w[0]));
      if(numerado){
        const total=E.weeks.length;
        const hechas=Math.max(0,Math.min(total,semanaProgreso-1));
        const pct=Math.round(hechas/total*100);
        extra=`<div class="prog"><div class="track"><div class="fill" style="width:${pct}%"></div></div>`+
           `<span class="lbl">${hechas} de ${total} semanas · ${pct}%</span></div>`+extra;
      }
      extra+=`<div class="tbl"><table><thead><tr><th style="width:88px">${numerado?"Semana":"Bloque"}</th><th>Contenido</th></tr></thead><tbody>`+
       E.weeks.map(w=>{
         let cls="";
         if(numerado&&semanaProgreso){
           const n=parseInt(w[0]);
           if(n<semanaProgreso) cls=" class='wk-done'";
           else if(n===semanaProgreso) cls=" class='wk-now'";
         }
         return `<tr${cls}><td class='num' style='color:var(--ink-3)'>${w[0]}</td><td>${w[1]}</td></tr>`;
       }).join("")+"</tbody></table></div>";
    }
    return h + (acc ? `<details class="acc"><summary>Reglas de evaluación y contenido semanal</summary><div>${extra}</div></details>` : "") + "</div>";
  };
  $("#subjzone").innerHTML=Object.keys(SUBJ).map(k=>window.fichaHTML(k)).join("");

  /* cálculo en vivo */
  window.recalcular=(subj,sc)=>{
    sc=sc||"main";
    const E=EVAL[subj], C=(E&&E.calc)||{escala:"10"};
    const pts=C.escala==="pts";
    const inputs=document.querySelectorAll(`.g-input[data-subj="${subj}"][data-scope="${sc}"]`);
    let total=0, restante=0, hasData=false;
    inputs.forEach((inp,i)=>{
      const val=parseFloat(inp.value), w=parseFloat(inp.dataset.w);
      const tope=pts?w/10:10;                       /* en escala de puntos cada ítem vale w/10 */
      const aporta=pts?1:w/100;
      if(!isNaN(val)){ total+=Math.min(val,tope)*aporta; hasData=true; }
      else restante+=tope*aporta;
    });
    const el=document.getElementById(`res-${sc}-${subj}`);
    if(!el) return;
    if(!hasData){ el.innerHTML=`<span>Acumulado: <b>0.00</b> ptos</span>`; return; }

    let html=`<span>Acumulado: <b style="color:var(--ink)">${total.toFixed(2)}</b> de 10</span>`;

    /* aviso de nota mínima: es lo que decide si apruebas, no la media */
    const fallos=[];
    [C.min,C.min2].filter(Boolean).forEach(m=>{
      const inp=inputs[m.i];
      if(inp&&inp.value!==""&&parseFloat(inp.value)<m.n) fallos.push(m.txt);
    });
    if(fallos.length){
      html+=`<span style="color:var(--warn);font-weight:700">Suspenso: falta ${fallos.join(" y ")}</span>`;
    } else if(restante>0.001){
      const falta=5-total;
      if(falta<=0) html+=`<span style="color:var(--go)">Ya llegas al 5</span>`;
      else if(falta>restante+0.001) html+=`<span style="color:var(--warn)">Ya no da para el 5</span>`;
      else html+=`<span style="color:var(--ink-2)">Te faltan <b>${falta.toFixed(2)}</b> de los <b>${restante.toFixed(2)}</b> que quedan</span>`;
    } else if(total<5){
      html+=`<span style="color:var(--warn)">Suspenso: ${total.toFixed(2)} sobre 10</span>`;
    } else {
      html+=`<span style="color:var(--go)">Aprobado</span>`;
    }
    if(C.min) html+=`<span style="flex-basis:100%;color:var(--ink-3);font-size:.78rem">Necesitas ${esc(C.min.txt)}${C.min2?" y "+esc(C.min2.txt):""}.</span>`;
    el.innerHTML=html;
  };
  document.addEventListener("input",e=>{
    if(e.target.classList.contains("g-input")) window.recalcular(e.target.dataset.subj, e.target.dataset.scope);
  });

  document.addEventListener("click",async e=>{
    const b=e.target.closest(".mailcopy"); if(!b) return;
    const txt=b.dataset.mail, antes=b.textContent;
    try{
      if(navigator.clipboard) await navigator.clipboard.writeText(txt);
      else { const t=document.createElement("textarea"); t.value=txt; document.body.appendChild(t);
             t.select(); document.execCommand("copy"); t.remove(); }
      b.textContent="Copiada"; b.classList.add("ok");
    }catch(err){ b.textContent=txt; }
    setTimeout(()=>{ b.textContent=antes; b.classList.remove("ok"); },1600);
  });
})();

/* --- tabla de profesorado --- */
$("#profbody").innerHTML=PROFS.map(p=>{
  const S=SUBJ[p.id];
  return `<tr><td><span class='sw' style='background:${S.c}'></span>${esc(S.n)}</td>`+
    `<td><b>${esc(p.name)}</b><br><span style='color:var(--ink-3);font-size:.8rem'>${esc(rolLabel(p)||"—")}</span></td>`+
    `<td>${p.mail?`<a href='mailto:${p.mail}'>${p.mail}</a>`:"<span class='nodata'>no publicado</span>"}</td>`+
    `<td>${p.office?esc(p.office):"<span class='nodata'>no publicado</span>"}</td></tr>`;
}).join("");

/* --- calendario global --- */
(function(){
 let cur="Todas";
 const fb=$("#filters");
 fb.innerHTML=
  '<button data-k="Todas" class="on">Todas</button>'+
  '<button data-k="type_ex">Exámenes</button>'+
  '<button data-k="type_en">Entregas y obligatorio</button>'+
  '<button data-k="type_cl">Labs y clases</button>'+
  '<button data-k="type_cf">Conflictos</button>'+
  '<span style="width:1px;background:var(--rule);margin:2px 6px"></span>'+
  Object.keys(SUBJ).map(k=>`<button data-k="${k}"><i class="sw" style="background:${SUBJ[k].c}"></i>${esc(SUBJ[k].n)}</button>`).join("");

 function draw(){
   const rows=CAL.filter(e=>{
     if(cur==="Todas") return true;
     if(cur.startsWith("type_")) return e.type===cur.slice(5);
     return e.id===cur;
   }).sort((a,b)=>a.date.localeCompare(b.date));
   $("#calrows").innerHTML=rows.length?rows.map(e=>
     `<tr><td class='num'><b>${esc(e.label)}</b></td><td class='num' style='color:var(--ink-3)'>${e.wk}</td><td><span class='sw' style='background:${SUBJ[e.id].c}'></span>${esc(SUBJ[e.id].n)}</td><td>${esc(e.what)}</td><td><span class='pill p-${e.type}'>${esc(e.w)}</span></td></tr>`).join("")
     :"<tr><td colspan='5' class='nodata'>Sin fechas para este filtro.</td></tr>";
 }
 fb.addEventListener("click",ev=>{
   const b=ev.target.closest("button"); if(!b)return;
   cur=b.dataset.k;
   [...fb.querySelectorAll("button")].forEach(x=>x.classList.toggle("on",x===b));
   draw();
 });
 draw();
})();

/* --- guardado en la nube --- */
/* Las credenciales viven en config.js, que NO se sube a GitHub (ver .gitignore).
   Sin ese archivo la página funciona igual, pero las marcas y notas no se guardan. */
const BIN_ID=(window.CONFIG||{}).BIN_ID||"";
const API_KEY=(window.CONFIG||{}).API_KEY||"";
let saveTimer=null;

function estado(txt){ const e=$("#notasEstado2"); if(e) e.textContent=txt; }

function pintarTareas(){
  const zAs=$("#tareasAsig"), zGe=$("#checks");
  if(zAs) zAs.innerHTML=Object.keys(SUBJ).flatMap(k=>
    (TAREAS[k]||[]).map((t,i)=>{
      const S=SUBJ[k];
      return `<div class="checkitem" style="--sc:${S.c}"><input type="checkbox" id="tk_${k}_${i}">`+
        `<label for="tk_${k}_${i}"><span class="tk-sub" style="color:${S.c}">${esc(S.n)}</span>`+
        `<b>${esc(t[0])}</b><span>${esc(t[1]||"")}</span></label></div>`;
    })).join("") || '<p class="nodata">Ninguna tarea de asignatura.</p>';
  if(zGe) zGe.innerHTML=GENERALES.map((c,i)=>
    `<div class="checkitem"><input type="checkbox" id="gk_${i}">`+
    `<label for="gk_${i}"><b>${esc(c[0])}</b><span>${esc(c[1]||"")}</span></label></div>`).join("")
    || '<p class="nodata">Nada pendiente.</p>';
}

async function initData(){
  pintarTareas();
  document.querySelectorAll('#tareasAsig input,#checks input').forEach(x=>x.addEventListener("change",guardar));
  document.querySelectorAll(".g-input").forEach(inp=>inp.addEventListener("change",guardar));

  if(!BIN_ID||!API_KEY){ estado("Guardado desactivado: falta config.js."); return; }
  estado("Cargando…");
  try{
    const res=await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`,{headers:{"X-Access-Key":API_KEY}});
    if(!res.ok) throw new Error("HTTP "+res.status);
    const data=await res.json();
    (data.record.hechas||[]).forEach(id=>{const el=document.getElementById(id); if(el) el.checked=true;});
    const notas=data.record.grades||{};
    Object.keys(notas).forEach(id=>{
      const inp=document.getElementById(id);
      if(inp){ inp.value=notas[id]; window.recalcular(inp.dataset.subj, inp.dataset.scope); }
    });
    estado("Sincronizado.");
  }catch(e){ estado("Sin conexión con la nube: los cambios no se guardarán."); }
}

function guardar(){
  if(!BIN_ID||!API_KEY) return;
  clearTimeout(saveTimer);
  estado("Guardando…");
  saveTimer=setTimeout(async()=>{
    const hechas=[...document.querySelectorAll('#tareasAsig input:checked,#checks input:checked')].map(x=>x.id);
    const grades={};
    document.querySelectorAll('.g-input[data-scope="main"]').forEach(inp=>{ if(inp.value!=="") grades[inp.id]=inp.value; });
    try{
      const r0=await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`,{headers:{"X-Access-Key":API_KEY}});
      const d0=await r0.json();
      const rec=Object.assign({},d0.record||{},{hechas,grades});
      const r=await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`,{
        method:"PUT",headers:{"Content-Type":"application/json","X-Access-Key":API_KEY},
        body:JSON.stringify(rec)});
      estado(r.ok?"Guardado.":"No se pudo guardar.");
    }catch(e){ estado("No se pudo guardar."); }
  },800);
}
initData();

/* --- planificador mensual --- */
(function(){
  const MN=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const DOW=["L","M","X","J","V","S","D"];
  
  /* meses del curso: de septiembre 2026 a junio 2027 */
  const months=[];
  for(let d=new Date(2026,8,1); d<=new Date(2027,5,1); d.setMonth(d.getMonth()+1))
    months.push({y:d.getFullYear(),m:d.getMonth()});

  const hoy=new Date();
  const hoyStr=isoD(hoy);

  const wkTag=dt=>{
    if(dt.getDay()!==1) return "";
    const n=Math.floor((dt-new Date(2026,8,7))/86400000/7)+1;
    return (n>=1&&n<=14)?`<div class="m-wk">S${n}</div>`:"";
  };
  const tramoDe=key=>ACAD.tramos.filter(t=>key>=t.from&&key<=t.to)
        .sort((x,y)=>({sinclase:0,nolectivo:1,examen:2,clases:3})[x.tipo]-({sinclase:0,nolectivo:1,examen:2,clases:3})[y.tipo])[0];

  let cur=months.findIndex(mo=>mo.y===hoy.getFullYear()&&mo.m===hoy.getMonth());
  if(cur<0) cur=0;




  function draw(index){
    const mo=months[index];
    let html=`<div class="month"><div class="m-title">`+
      `<button class="m-nav" data-go="-1"${index===0?" disabled":""} aria-label="Mes anterior">‹</button>`+
      `<span class="m-name">${MN[mo.m].charAt(0).toUpperCase()+MN[mo.m].slice(1)} ${mo.y}</span>`+
      `<button class="m-nav" data-go="1"${index===months.length-1?" disabled":""} aria-label="Mes siguiente">›</button>`+
      `<button class="m-hoy" data-go="hoy">Hoy</button></div>`;
    html+='<div class="m-grid head">'+DOW.map(d=>`<div>${d}</div>`).join("")+"</div>";
    html+='<div class="m-grid days">';

    const first=new Date(mo.y,mo.m,1).getDay();
    const shift=first===0?6:first-1;
    const total=new Date(mo.y,mo.m+1,0).getDate();
    const prev=new Date(mo.y,mo.m,0).getDate();
    for(let i=shift;i>0;i--){
      const dd=new Date(mo.y,mo.m,1-i);
      html+=`<div class="m-day out">${wkTag(dd)}<div class="m-date">${prev-i+1}</div></div>`;
    }

    for(let d=1;d<=total;d++){
      const dt=new Date(mo.y,mo.m,d), key=isoD(dt);
      const finde=dt.getDay()===0||dt.getDay()===6;
      const sin=ACAD.sinClase.find(x=>x.date===key);
      const tr=tramoDe(key);
      const marca=ACAD.marcas.find(x=>x.date===key);

      /* número de semana lectiva, sólo en el lunes de cada fila */
      const enVacaciones = tr && tr.tipo==="nolectivo";
      const wk=wkTag(dt);
      let cls="m-day", etiqueta="";
      if(finde) cls+=" finde";
      if(tr&&tr.tipo==="nolectivo"){ cls+=" nolectivo"; if(key===tr.from||d===1) etiqueta=`<div class="m-tag">${esc(tr.t)}</div>`; }
      else if(tr&&tr.tipo==="examen"){ cls+=" examen"; if(key===tr.from||d===1) etiqueta=`<div class="m-tag">${esc(tr.t)}</div>`; }
      if(sin&&!finde&&!enVacaciones){ cls+=" sinclase"; etiqueta=`<div class="m-tag">Sin clase${sin.campus?` · solo ${sin.campus==="leg"?"Leganés":"Getafe"}`:""}</div>`; }
      /* amarillo de avance: cualquier día ya pasado que no tenga otro color */
      const neutro = !finde && !(sin&&!enVacaciones) && !(tr&&(tr.tipo==="examen"||tr.tipo==="nolectivo"));
      if(neutro && key<hoyStr && key>=ACAD.curso.from) cls+=" past";
      if(key===hoyStr) cls+=" today";
      if(marca) etiqueta=`<div class="m-tag mark">${esc(marca.t)}</div>`+etiqueta;

      const evs=CAL.filter(e=>e.date===key).map(e=>
        `<button class="m-chip ${e.type}${e.sinDia?" pend":""}" data-ev="${CAL.indexOf(e)}" style="--sc:${SUBJ[e.id].c}"><i></i><span>${esc(SUBJ[e.id].ab)} · ${TIPO[e.type]}</span></button>`
      ).join("");

      html+=`<div class="${cls}">${wk}<div class="m-date">${d}</div>${etiqueta}${evs}</div>`;
    }
    const rem=(shift+total)%7;
    if(rem) for(let i=1;i<=7-rem;i++){
      const dd=new Date(mo.y,mo.m+1,i);
      html+=`<div class="m-day out">${wkTag(dd)}<div class="m-date">${i}</div></div>`;
    }
    $("#month-grids").innerHTML=html+'</div></div>'+'<div id="ev-detail" class="ev-detail" hidden></div>';
  }

  document.addEventListener("click",ev=>{
    const chip=ev.target.closest(".m-chip");
    if(chip) pintarDetalle("ev-detail", CAL[parseInt(chip.dataset.ev)]);
  });
  cerrarDetalleAl("ev-detail",".m-chip");

  document.addEventListener("click",ev=>{
    const b=ev.target.closest("[data-go]"); if(!b)return;
    if(b.dataset.go==="hoy"){
      const i=months.findIndex(mo=>mo.y===hoy.getFullYear()&&mo.m===hoy.getMonth());
      cur=i<0?0:i;
    } else {
      const n=cur+parseInt(b.dataset.go);
      if(n<0||n>=months.length) return;
      cur=n;
    }
    draw(cur);
  });
  draw(cur);
})();

/* --- pestañas: una sección cada vez --- */
(function(){
  /* el horario semanal y el calendario del mes comparten pestaña */
  const TABS={
    horario:["hoy","horario","planificador"], asignaturas:["asignaturas"],
    profesorado:["profesorado"], calendario:["calendario"], pendientes:["pendientes"]
  };
  const links=[...document.querySelectorAll("nav.bar a[data-tab]")];
  const todas=Object.values(TABS).flat();

  function abrir(tab,scroll,inicial){
    if(tab==="notas"){
      todas.forEach(id=>{const el=document.getElementById(id); if(el) el.hidden=true;});
      const nt=document.getElementById("notas"); if(nt) nt.hidden=false;
      links.forEach(l=>l.classList.remove("on"));
      if(scroll) window.scrollTo({top:0});
      return;
    }
    const nt=document.getElementById("notas"); if(nt) nt.hidden=true;
    if(!TABS[tab]) tab="horario";
    todas.forEach(id=>{
      const el=document.getElementById(id);
      if(el) el.hidden=!TABS[tab].includes(id);
    });
    links.forEach(l=>l.classList.toggle("on",l.dataset.tab===tab));
    TABS[tab].forEach(id=>{
      const el=document.getElementById(id);
      if(!el) return;
      el.classList.remove("enter");
      void el.offsetWidth;          /* fuerza el reinicio de la animación */
      el.classList.add("enter");
      if(window.matchMedia("(max-width:820px)").matches) return;
      [...el.children].forEach((hijo,i)=>{
        hijo.style.setProperty("--d", (i*55)+"ms");
        hijo.classList.remove("stagger"); void hijo.offsetWidth; hijo.classList.add("stagger");
      });
    });
    /* primero la URL: escribir el hash puede hacer saltar al elemento, así que
       el scroll se corrige justo después */
    if(!inicial && history.replaceState && !location.hash.includes("debug")) history.replaceState(null,"","#"+tab);
    if(scroll){
      const arriba=()=>{
        const cont=document.querySelector("body > div.wrap");
        if(cont && cont.scrollHeight>cont.clientHeight+4) cont.scrollTop=0;
        window.scrollTo(0,0);
      };
      arriba();
      requestAnimationFrame(arriba);
    }
  }

  links.forEach(l=>l.addEventListener("click",ev=>{
    ev.preventDefault();
    abrir(l.dataset.tab,true);
  }));

  /* Deslizar con el dedo: el contenido acompaña al dedo y al soltar
     se completa el cambio o vuelve a su sitio. */
  const orden=Object.keys(TABS);
  const lienzo=document.querySelector("div.wrap:not(nav .wrap):not(header .wrap)")
            || document.querySelectorAll("div.wrap")[document.querySelectorAll("div.wrap").length-1];
  const UMBRAL=70;
  let x0=null,y0=null,dx=0,arrastrando=false,bloqueado=false;

  /* Devuelve el contenedor desplazable en horizontal bajo el dedo, si lo hay. */
  function scrollerHorizontal(el){
    let n=el;
    while(n && n!==document.body){
      if(n.scrollWidth-n.clientWidth>4){
        const ox=getComputedStyle(n).overflowX;
        if(ox==="auto"||ox==="scroll") return n;
      }
      n=n.parentElement;
    }
    return null;
  }
  /* Solo se cede el gesto si esa tabla aún puede desplazarse hacia ese lado. */
  function cedeAlScroller(sc,mx){
    if(!sc) return false;
    const max=sc.scrollWidth-sc.clientWidth;
    return mx<0 ? sc.scrollLeft<max-1 : sc.scrollLeft>1;
  }

  const idx=()=>orden.indexOf((location.hash.slice(1)||"horario"));

  function poner(t,op){ if(lienzo){ lienzo.style.transform=`translate3d(${t}px,0,0)`; lienzo.style.opacity=op; } }
  function limpiar(){ if(lienzo){ lienzo.style.transform=""; lienzo.style.opacity=""; lienzo.classList.remove("arrastrando","soltando"); } }

  let scroller=null;
  document.addEventListener("touchstart",e=>{
    if(e.touches.length!==1||!lienzo||e.target.closest("input,textarea,select")){x0=null;return;}
    x0=e.touches[0].clientX; y0=e.touches[0].clientY;
    scroller=scrollerHorizontal(e.target);
    dx=0; arrastrando=false; bloqueado=false;
  },{passive:true});

  document.addEventListener("touchmove",e=>{
    if(x0===null) return;
    const mx=e.touches[0].clientX-x0, my=e.touches[0].clientY-y0;
    if(!arrastrando&&!bloqueado){
      if(Math.abs(my)>10&&Math.abs(my)>Math.abs(mx)){ bloqueado=true; return; }   /* está haciendo scroll vertical */
      if(cedeAlScroller(scroller,mx)){ bloqueado=true; return; }                  /* la tabla aún se puede mover */
      if(Math.abs(mx)>12){ arrastrando=true; lienzo.classList.add("arrastrando"); }
      else return;
    }
    if(bloqueado) return;
    const i=idx();
    const borde=(mx<0&&i>=orden.length-1)||(mx>0&&i<=0);
    dx=borde?mx*0.22:mx*0.85;                 /* en los extremos, resistencia */
    poner(dx, Math.max(.45, 1-Math.abs(dx)/420));
    if(e.cancelable) e.preventDefault();
  },{passive:false});

  document.addEventListener("touchend",()=>{
    if(x0===null||!arrastrando){ x0=null; limpiar(); return; }
    x0=null;
    const i=idx(), destino=i+(dx<0?1:-1);
    lienzo.classList.remove("arrastrando");
    lienzo.classList.add("soltando");
    if(Math.abs(dx)>=UMBRAL && destino>=0 && destino<orden.length){
      const fuera=dx<0?-window.innerWidth*0.35:window.innerWidth*0.35;
      poner(fuera,0);
      setTimeout(()=>{
        abrir(orden[destino],false);
        const cont=document.querySelector("body > div.wrap");
        if(cont) cont.scrollTop=0; else window.scrollTo({top:0});
        lienzo.classList.remove("soltando");
        poner(dx<0?window.innerWidth*0.28:-window.innerWidth*0.28,0);
        requestAnimationFrame(()=>{ lienzo.classList.add("soltando"); poner(0,1);
          setTimeout(limpiar,280); });
      },170);
    } else {
      poner(0,1);
      setTimeout(limpiar,280);
    }
  },{passive:true});

  window.addEventListener("hashchange",()=>{
    if(location.hash.includes("debug")) return;   /* no tocar el ancla de diagnóstico */
    abrir(location.hash.slice(1),true);
  });
  abrir(location.hash.includes("debug")?"horario":(location.hash.slice(1)||"horario"),true,true);
})();


/* --- notas para Claude: texto plano, guardado en la nube --- */
(function(){
  const ta=$("#notasTxt"), est=$("#notasEstado"); if(!ta) return;
  let t=null;
  const clave="notas";
  async function cargar(){
    if(!BIN_ID||!API_KEY){ est.textContent="Sin guardado: falta config.js."; return; }
    try{
      const r=await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`,{headers:{"X-Access-Key":API_KEY}});
      const d=await r.json();
      ta.value=(d.record&&d.record[clave])||"";
      est.textContent="Guardado al día.";
    }catch(e){ est.textContent="No se pudieron cargar las notas."; }
  }
  ta.addEventListener("input",()=>{
    clearTimeout(t); est.textContent="Escribiendo…";
    t=setTimeout(async()=>{
      if(!BIN_ID||!API_KEY){ est.textContent="Sin guardado: falta config.js."; return; }
      try{
        const r=await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`,{headers:{"X-Access-Key":API_KEY}});
        const d=await r.json();
        const rec=Object.assign({},d.record||{});
        rec[clave]=ta.value;
        const w=await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`,{
          method:"PUT",headers:{"Content-Type":"application/json","X-Access-Key":API_KEY},
          body:JSON.stringify(rec)});
        est.textContent=w.ok?"Guardado.":"No se pudo guardar.";
      }catch(e){ est.textContent="No se pudo guardar."; }
    },1200);
  });
  cargar();
})();

/* --- comprobación de datos: avisa por consola si algo no cuadra --- */
(function(){
  const errores=[];
  const coords={};
  PROFS.forEach(p=>{ if(p.coord) (coords[p.id]=coords[p.id]||[]).push(p.name); });
  Object.keys(SUBJ).forEach(k=>{
    const c=coords[k]||[];
    if(c.length>1) errores.push(`${SUBJ[k].n}: ${c.length} coordinadores (${c.join(", ")}). Solo puede haber uno.`);
    if(c.length===0) errores.push(`${SUBJ[k].n}: sin coordinador.`);
    if(!PROFS.some(p=>p.id===k&&p.rol)) errores.push(`${SUBJ[k].n}: sin nadie que dé clase.`);
  });
  CAL.forEach(e=>{ if(!SUBJ[e.id]) errores.push(`Fecha ${e.label}: asignatura desconocida (${e.id}).`); });
  /* una prueba presencial tiene que caer en un día con clase de esa asignatura */
  /* nada evaluable puede caer en festivo ni en periodo no lectivo sin marcarlo como pendiente */
  const prioridad={nolectivo:0,examen:1,clases:2};
  CAL.filter(e=>!e.sinDia).forEach(e=>{
    const fest=ACAD.sinClase.find(x=>x.date===e.date);
    const tramo=ACAD.tramos.filter(t=>e.date>=t.from&&e.date<=t.to)
      .sort((x,y)=>prioridad[x.tipo]-prioridad[y.tipo])[0];
    if(fest) errores.push(`${SUBJ[e.id].n}: "${e.what.slice(0,36)}" cae el ${e.date}, que es festivo.`);
    else if(tramo&&tramo.tipo==="nolectivo") errores.push(`${SUBJ[e.id].n}: "${e.what.slice(0,36)}" cae en ${tramo.t}.`);
  });
  CAL.filter(e=>!e.online&&!e.sinDia&&e.type!=="cf").forEach(e=>{
    const i=new Date(e.date+"T12:00:00").getDay()-1;
    const hay=CLASSES.some(c=>c.id===e.id&&c.d===i&&(c.dates?c.dates.includes(e.date):(e.date>=c.from&&e.date<=c.to)));
    if(!hay) errores.push(`${SUBJ[e.id].n}: "${e.what.slice(0,40)}" cae el ${e.date}, día sin clase de esa asignatura.`);
  });
  CLASSES.forEach(c=>{ if(!c.from&&!c.dates) errores.push(`Clase de ${SUBJ[c.id].ab} el día ${c.d}: sin fechas.`); });
  if(errores.length) console.warn("Revisar datos:\n- "+errores.join("\n- "));
})();

/* --- diagnóstico: abre la web con #debug al final de la URL --- */
(function(){
  const caja=document.getElementById("dbg"); if(!caja) return;
  function medir(){
    const pedido=location.hash.includes("debug")||location.search.includes("debug");
    if(!pedido){ caja.classList.remove("on"); return; }
    caja.classList.add("on");
    const nav=document.querySelector("nav.bar");
    const body=document.body;
    const cont=document.querySelector("body > div.wrap");
    const r=nav?nav.getBoundingClientRect():{top:0,bottom:0,height:0};
    const cs=nav?getComputedStyle(nav):{};
    const probe=document.createElement("div");
    probe.style.cssText="position:fixed;bottom:0;height:env(safe-area-inset-bottom,0px)";
    document.body.appendChild(probe);
    const safe=probe.getBoundingClientRect().height; probe.remove();
    caja.textContent=
      "v35\n"+
      "window.innerHeight   "+window.innerHeight+"\n"+
      "visualViewport       "+(window.visualViewport?Math.round(window.visualViewport.height):"-")+"\n"+
      "screen.height        "+screen.height+"\n"+
      "devicePixelRatio     "+window.devicePixelRatio+"\n"+
      "body height          "+Math.round(body.getBoundingClientRect().height)+"\n"+
      "contenedor scroll    "+(cont?Math.round(cont.getBoundingClientRect().height):"-")+"\n"+
      "nav position         "+(cs.position||"-")+"\n"+
      "nav top / bottom     "+Math.round(r.top)+" / "+Math.round(r.bottom)+"\n"+
      "nav height           "+Math.round(r.height)+"\n"+
      "nav padding-bottom   "+(cs.paddingBottom||"-")+"\n"+
      "safe-area-inset-bot  "+Math.round(safe)+"px\n"+
      "hueco bajo la barra  "+Math.round(window.innerHeight-r.bottom)+"px";
  }
  window.addEventListener("hashchange",medir);
  document.addEventListener("click",e=>{ if(e.target.closest(".ver")) { caja.classList.toggle("on"); medir(); } });
  window.addEventListener("resize",medir);
  setTimeout(medir,300);
})();
