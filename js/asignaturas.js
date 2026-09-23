/* ==========================================================
   asignaturas.js — la ficha de cada asignatura (horario y aulas, profesorado,
   evaluación con calculadora de nota, fechas propias, reglas y temario) y
   el guardado de las notas en la nube.
   fichaHTML() y recalcular() son globales: Hoy los usa para el resumen.
   ========================================================== */

/* tono más claro del color de la asignatura para cada tramo de la barra */
const tonoDe=(hex,i,n)=>{
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  const f=i/Math.max(n-1,1)*0.45, m=v=>Math.round(v+(255-v)*f);
  return `rgb(${m(r)},${m(g)},${m(b)})`;
};
/* id estable de cada casilla de nota: no depende de la posición en la lista */
function idsNotas(k,sc){
  const vistos={};
  return (EVAL[k].bar||[]).map(b=>{
    let s=slug(b[0])||"nota"; if(vistos[s]) s+="-"+(++vistos[s]); else vistos[s]=1;
    return `g_${sc}_${k}_${s}`;
  });
}
/* "7,5" y "7.5" valen lo mismo; vacío es null; lo que no es número, NaN */
function leerNota(inp){
  const v=inp.value.trim().replace(",",".");
  if(v==="") return null;
  const n=Number(v);
  return Number.isFinite(n)?n:NaN;
}

/* bloque plegable con reglas y temario; el progreso depende del día */
function extraHTML(k){
  const E=EVAL[k], semana=semanaProgresoDe(k,hoyISO());
  let extra=`<ul class="tight" style="margin-bottom:16px">`+E.rules.map(r=>`<li>${r}</li>`).join("")+"</ul>";
  if(!E.weeks) return extra;
  const numerado=E.weeks.every(w=>/^\d+$/.test(w[0]));
  if(numerado){
    const total=E.weeks.length, hechas=Math.max(0,Math.min(total,semana-1)), pct=Math.round(hechas/total*100);
    extra=`<div class="prog"><div class="track"><div class="fill" style="width:${pct}%"></div></div>`+
      `<span class="lbl">${hechas} de ${total} semanas · ${pct}%</span></div>`+extra;
  }
  return extra+`<div class="tbl"><table><thead><tr><th style="width:88px">${numerado?"Semana":"Bloque"}</th><th>Contenido</th></tr></thead><tbody>`+
    E.weeks.map(w=>{
      const n=parseInt(w[0]);
      const cls=numerado&&semana?(n<semana?" class='wk-done'":n===semana?" class='wk-now'":""):"";
      return `<tr${cls}><td class='num' style='color:var(--ink-3)'>${w[0]}</td><td>${w[1]}</td></tr>`;
    }).join("")+"</tbody></table></div>";
}

function fichaHTML(k,opts){
  opts=opts||{};
  const acc=opts.acordeon!==false, sc=opts.scope||"main", editable=opts.editable!==false;
  const S=SUBJ[k], E=EVAL[k];
  const cls=CLASSES.filter(c=>c.id===k).sort((a,b)=>a.d-b.d||a.a-b.a);
  const profs=PROFS.filter(p=>p.id===k);
  const fechas=CAL.filter(c=>c.id===k).sort(ordenEv);

  let h=`<div class="subject"><div class="sh" style="border-left-color:${S.c}"><h3 style="color:${S.c}">${esc(S.n)}</h3><div class="facts">`+
    `<span class="fact">${S.ects} ECTS</span><span class="fact">${esc(S.dept)}</span><span class="fact">grupo ${esc(S.grp)}</span>`+
    `<span class="fact fact-${S.cam.toLowerCase()}">${campusDe(k)}</span></div></div>`;

  const pH=`<div class="panel"><h4>Horario y aulas</h4>`+(cls.length?`<ul class="plain">`+
    cls.map(c=>`<li><span><b>${DAYS[c.d]}</b> ${esc(c.t)}<br><span class="aula">${esc(c.au)}</span></span>`+
      `<span class='d'>${hhmm(c.a)}–${hhmm(c.b)}<br>${esc(c.r)}</span></li>`).join("")+`</ul>`
    :`<p class="nodata">Sin clases en el horario.</p>`)+`</div>`;

  const pP=`<div class="panel"><h4>Profesorado</h4>`+profs.map(p=>{
    let x=`<div style='margin-bottom:14px'><b style='font-size:.92rem'>${esc(p.name)}</b>${rolChips(p)}<dl class='kv' style='margin-top:9px'>`;
    if(p.mail) x+=`<dt>Correo</dt><dd><a href='mailto:${p.mail}'>${p.mail}</a></dd>`;
    if(p.office) x+=`<dt>Despacho</dt><dd>${esc(p.office)}</dd>`;
    x+=`</dl>`;
    if(p.note) x+=`<p class='nodata' style='margin:9px 0 0'>${esc(p.note)}</p>`;
    if(p.mail){
      const sub=encodeURIComponent(`Shengyu Chen — Doble Grado Informática + ADE — ${S.n} — grupo ${S.grp}`);
      /* mailto solo funciona si hay cliente de correo configurado: también Gmail web y copiar */
      x+=`<div class="mailrow">`+
         `<a class="mailbtn" target="_blank" rel="noopener" href="https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(p.mail)}&su=${sub}">Escribir en Gmail</a>`+
         `<button class="mailcopy" data-mail="${p.mail}">Copiar dirección</button></div>`;
    }
    return x+"</div>";
  }).join("")+"</div>";

  let pE='<div class="panel"><h4>Evaluación</h4>';
  if(E.bar&&E.bar.length){
    const ids=idsNotas(k,sc);
    const esPts=E.calc&&E.calc.escala==="pts";   /* Derecho Civil puntúa sobre 10 puntos, no en % */
    pE+='<div class="bar">'+E.bar.map((b,i)=>`<div style="flex:${b[1]};background:${tonoDe(S.c,i,E.bar.length)}">${b[1]}%</div>`).join("")+"</div>";
    pE+='<div class="barkey">'+E.bar.map((b,i)=>`<span><i style="background:${tonoDe(S.c,i,E.bar.length)}"></i>${esc(b[0])}</span>`).join("")+"</div>";
    pE+='<div class="calc">';
    E.bar.forEach((b,i)=>{
      const tope=esPts?(b[1]/10):10;
      pE+=`<div class="calc-row"><label for="${ids[i]}">${esc(b[0])} `+
          `<span style="color:var(--ink-3)">(${esPts?"máx. "+tope+" ptos":b[1]+"%"})</span></label>`+
          `<input type="text" inputmode="decimal" autocomplete="off" id="${ids[i]}" data-tope="${tope}" `+
          `placeholder="${editable?"Nota":"—"}" ${editable?"":"readonly tabindex=\"-1\""} `+
          `data-subj="${k}" data-scope="${sc}" data-w="${b[1]}" class="g-input${editable?"":" ro"}"></div>`;
    });
    pE+=`<div class="calc-res" id="res-${sc}-${k}" aria-live="polite"><span>Acumulado: <b>0.00</b> ptos</span></div></div>`;
  }
  pE+=`<div class="min">${E.min}</div></div>`;

  const pF=`<div class="panel"><h4>Fechas propias</h4>`+(fechas.length
    ?`<ul class="plain">`+fechas.map(d=>`<li><span>${esc(d.what)}</span><span class='d'>${esc(etiquetaEv(d))} <span class="pill p-${d.type}">${esc(d.w)}</span></span></li>`).join("")+"</ul>"
    :`<p class='nodata'>Sin fechas evaluables registradas.</p>`)+`</div>`;

  /* dos columnas que se apilan por separado: así ninguna estira a la otra */
  h+=`<div class="panels"><div class="pcol">${pH}${pE}</div><div class="pcol">${pP}${pF}</div></div>`;
  return h+(acc?`<details class="acc"><summary>Reglas de evaluación y contenido semanal</summary><div id="extra-${k}">${extraHTML(k)}</div></details>`:"")+"</div>";
}

/* cálculo en vivo: nota acumulada, lo que falta y los mínimos */
function recalcular(subj,sc){
  sc=sc||"main";
  const C=EVAL[subj].calc||{escala:"10"}, pts=C.escala==="pts";
  const inputs=$$(`.g-input[data-subj="${subj}"][data-scope="${sc}"]`);
  let total=0, restante=0, hay=false;
  const valores=inputs.map(inp=>{
    const tope=+inp.dataset.tope, v=leerNota(inp);
    const mal=v!==null&&(Number.isNaN(v)||v<0||v>tope);
    inp.classList.toggle("mal",mal);
    inp.setAttribute("aria-invalid",mal?"true":"false");
    return v===null||Number.isNaN(v)?null:Math.min(Math.max(v,0),tope);
  });
  inputs.forEach((inp,i)=>{
    const w=+inp.dataset.w, tope=+inp.dataset.tope, aporta=pts?1:w/100;
    if(valores[i]!==null){ total+=valores[i]*aporta; hay=true; } else restante+=tope*aporta;
  });
  const el=document.getElementById(`res-${sc}-${subj}`); if(!el) return;
  if(!hay){ el.innerHTML=`<span>Acumulado: <b>0.00</b> ptos</span>`; return; }
  let html=`<span>Acumulado: <b style="color:var(--ink)">${total.toFixed(2)}</b> de 10</span>`;
  /* la nota mínima decide si apruebas, no la media */
  const fallos=[C.min,C.min2].filter(Boolean).filter(m=>valores[m.i]!==null&&valores[m.i]<m.n).map(m=>m.txt);
  if(fallos.length) html+=`<span style="color:var(--warn);font-weight:700">Suspenso: falta ${fallos.join(" y ")}</span>`;
  else if(restante>0.001){
    const falta=5-total;
    if(falta<=0) html+=`<span style="color:var(--go)">Ya llegas al 5</span>`;
    else if(falta>restante+0.001) html+=`<span style="color:var(--warn)">Ya no da para el 5</span>`;
    else html+=`<span style="color:var(--ink-2)">Te faltan <b>${falta.toFixed(2)}</b> de los <b>${restante.toFixed(2)}</b> que quedan</span>`;
  }
  else html+=total<5?`<span style="color:var(--warn)">Suspenso: ${total.toFixed(2)} sobre 10</span>`:`<span style="color:var(--go)">Aprobado</span>`;
  if(C.min) html+=`<span style="flex-basis:100%;color:var(--ink-3);font-size:.78rem">Necesitas ${esc(C.min.txt)}${C.min2?" y "+esc(C.min2.txt):""}.</span>`;
  el.innerHTML=html;
}

(function(){
  const NUM=["","una","dos","tres","cuatro","cinco","seis","siete","ocho","nueve","diez"];
  const ids=asignaturasEn(hoyISO());
  $("#subjzone").innerHTML=ids.map(k=>fichaHTML(k)).join("");
  $("#asigIntro").textContent=`${ids.length===1?"La única":"Las "+(NUM[ids.length]||ids.length)} con la misma ficha: horario y aulas, profesorado, evaluación y fechas propias.`;

  document.addEventListener("input",e=>{
    if(e.target.classList.contains("g-input")) recalcular(e.target.dataset.subj,e.target.dataset.scope);
  });
  /* guardar: solo la casilla que ha cambiado */
  document.addEventListener("change",e=>{
    const inp=e.target;
    if(!inp.matches('.g-input[data-scope="main"]')) return;
    const v=leerNota(inp), id=inp.id;
    const texto=v===null||Number.isNaN(v)?"":String(v);
    Nube.cambiar("nota:"+id,rec=>{ rec.grades=rec.grades||{}; if(texto==="") delete rec.grades[id]; else rec.grades[id]=texto; });
  });

  /* al cargar de la nube: las notas guardadas con el formato antiguo (por posición)
     se traducen una vez al nuevo (por nombre) */
  const antiguo=/^g_main_([a-z]+)_(\d+)$/;
  Nube.alCargar(rec=>{
    const notas=rec.grades||{}, traducidas={};
    let hubo=false;
    Object.keys(notas).forEach(id=>{
      const m=id.match(antiguo);
      if(m&&SUBJ[m[1]]){ const nuevo=idsNotas(m[1],"main")[+m[2]]; if(nuevo){ traducidas[nuevo]=notas[id]; hubo=true; return; } }
      traducidas[id]=notas[id];
    });
    if(hubo) Nube.cambiar("migrar-notas",r=>{
      const viejas=r.grades||{}, nuevas={};
      Object.keys(viejas).forEach(id=>{ const m=id.match(antiguo);
        const n=m&&SUBJ[m[1]]?idsNotas(m[1],"main")[+m[2]]:null; nuevas[n||id]=viejas[id]; });
      r.grades=nuevas;
    });
    const tocadas=new Set();
    $$('.g-input[data-scope="main"]').forEach(inp=>{
      if(document.activeElement===inp) return;          /* no se pisa lo que estás escribiendo */
      const v=traducidas[inp.id]??"";
      if(inp.value!==v){ inp.value=v; tocadas.add(inp.dataset.subj); }
    });
    tocadas.forEach(k=>recalcular(k,"main"));
  });

  /* el progreso del temario cambia con los días */
  document.addEventListener("nuevoDia",()=>ids.forEach(k=>{ const el=document.getElementById("extra-"+k); if(el) el.innerHTML=extraHTML(k); }));

  /* copiar la dirección de correo */
  document.addEventListener("click",async e=>{
    const b=e.target.closest(".mailcopy"); if(!b) return;
    b.dataset.label=b.dataset.label||b.textContent;
    clearTimeout(b.__t);
    try{
      if(navigator.clipboard) await navigator.clipboard.writeText(b.dataset.mail);
      else { const t=document.createElement("textarea"); t.value=b.dataset.mail; document.body.appendChild(t);
             t.select(); document.execCommand("copy"); t.remove(); }
      b.textContent="Copiada"; b.classList.add("ok");
    }catch(err){ b.textContent=b.dataset.mail; }
    b.__t=setTimeout(()=>{ b.textContent=b.dataset.label; b.classList.remove("ok"); },1600);
  });
})();
