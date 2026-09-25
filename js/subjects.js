/* ==========================================================
   subjects.js — one card per subject (timetable and rooms, faculty,
   grading with a grade calculator, own dates, rules and syllabus) and
   saving the grades to the cloud.
   subjectCard() and recalc() are global: Today uses them for its preview.
   ========================================================== */

/* lighter shade of the subject colour for each part of the grading bar */
const shadeOf=(hex,i,n)=>{
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  const f=i/Math.max(n-1,1)*0.45, m=v=>Math.round(v+(255-v)*f);
  return `rgb(${m(r)},${m(g)},${m(b)})`;
};
/* stable id of each grade box, by name, not by position.
   The format ("g_main_ed_parcial-1") is also the key stored in the cloud: keep it. */
function gradeIds(k,scope){
  const seen={};
  return (GRADING[k].parts||[]).map(p=>{
    let s=slug(p[0])||"grade"; if(seen[s]) s+="-"+(++seen[s]); else seen[s]=1;
    return `g_${scope}_${k}_${s}`;
  });
}
/* "7,5" and "7.5" are the same; empty is null; anything else, NaN */
function readGrade(inp){
  const v=inp.value.trim().replace(",",".");
  if(v==="") return null;
  const n=Number(v);
  return Number.isFinite(n)?n:NaN;
}

/* folding block with rules and syllabus; which weeks are done depends on the day */
function syllabusHTML(k){
  const G=GRADING[k], week=progressWeek(k,todayISO());
  let html=`<ul class="tight" style="margin-bottom:16px">`+G.rules.map(r=>`<li>${r}</li>`).join("")+"</ul>";
  if(!G.syllabus) return html;
  const numbered=G.syllabus.every(w=>/^\d+$/.test(w[0]));
  if(numbered){
    const total=G.syllabus.length, done=Math.max(0,Math.min(total,week-1)), pct=Math.round(done/total*100);
    html=`<div class="prog"><div class="track"><div class="fill" style="width:${pct}%"></div></div>`+
      `<span class="lbl">${esc(t("subject.progress",{done,total,pct}))}</span></div>`+html;
  }
  return html+`<div class="tbl"><table><thead><tr><th style="width:88px">${esc(t(numbered?"subject.week":"subject.block"))}</th><th>${esc(t("subject.content"))}</th></tr></thead><tbody>`+
    G.syllabus.map(w=>{
      const n=parseInt(w[0]);
      const cls=numbered&&week?(n<week?" class='wk-done'":n===week?" class='wk-now'":""):"";
      return `<tr${cls}><td class='num' style='color:var(--ink-3)'>${w[0]}</td><td>${w[1]}</td></tr>`;
    }).join("")+"</tbody></table></div>";
}

function subjectCard(k,opts){
  opts=opts||{};
  const accordion=opts.accordion!==false, scope=opts.scope||"main", editable=opts.editable!==false;
  const S=SUBJECTS[k], G=GRADING[k];
  const cls=CLASSES.filter(c=>c.subject===k).sort((a,b)=>a.day-b.day||a.start-b.start);
  const staff=FACULTY.filter(p=>p.subject===k);
  const dates=EVENTS.filter(e=>e.subject===k).sort(byDate);

  let h=`<div class="subject"><div class="sh" style="border-left-color:${S.color}"><h3 style="color:${S.color}">${esc(S.name)}</h3><div class="facts">`+
    `<span class="fact">${S.ects} ECTS</span><span class="fact">${esc(S.dept)}</span><span class="fact">${esc(t("subject.group",{g:S.group}))}</span>`+
    `<span class="fact fact-${S.campus.toLowerCase()}">${campusOf(k)}</span></div></div>`;

  const pTime=`<div class="panel"><h4>${esc(t("subject.timetable"))}</h4>`+(cls.length?`<ul class="plain">`+
    cls.map(c=>`<li><span><b>${WEEKDAY_LONG[c.day+1]}</b> ${esc(c.kind)}<br><span class="room">${esc(c.room)}</span></span>`+
      `<span class='d'>${hhmm(c.start)}–${hhmm(c.end)}<br>${esc(c.when)}</span></li>`).join("")+`</ul>`
    :`<p class="nodata">${esc(t("subject.noClasses"))}</p>`)+`</div>`;

  const pStaff=`<div class="panel"><h4>${esc(t("subject.faculty"))}</h4>`+staff.map(p=>{
    let x=`<div style='margin-bottom:14px'><b style='font-size:.92rem'>${esc(p.name)}</b>${roleChips(p)}<dl class='kv' style='margin-top:9px'>`;
    if(p.email) x+=`<dt>${esc(t("faculty.email"))}</dt><dd><a href='mailto:${p.email}'>${p.email}</a></dd>`;
    if(p.office) x+=`<dt>${esc(t("faculty.office"))}</dt><dd>${esc(p.office)}</dd>`;
    x+=`</dl>`;
    if(p.note) x+=`<p class='nodata' style='margin:9px 0 0'>${esc(p.note)}</p>`;
    if(p.email){
      /* who writes: Nolan, or the demo's student (MAIL_FROM in demo.js) */
      const from=typeof MAIL_FROM!=="undefined"?MAIL_FROM:"Shengyu Chen — Doble Grado Informática + ADE";
      const subject=encodeURIComponent(`${from} — ${S.name} — grupo ${S.group}`);
      /* mailto only works with a mail app set up: also Gmail on the web and copy */
      x+=`<div class="mailrow">`+
         `<a class="mailbtn" target="_blank" rel="noopener" href="https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(p.email)}&su=${subject}">${esc(t("subject.gmail"))}</a>`+
         `<button class="mailcopy" data-mail="${p.email}">${esc(t("subject.copyEmail"))}</button></div>`;
    }
    return x+"</div>";
  }).join("")+"</div>";

  let pGrade=`<div class="panel"><h4>${esc(t("subject.grading"))}</h4>`;
  if(G.parts&&G.parts.length){
    const ids=gradeIds(k,scope);
    const points=G.grading&&G.grading.scale==="points";   /* Civil Law is marked out of 10 points, not % */
    pGrade+='<div class="bar">'+G.parts.map((p,i)=>`<div style="flex:${p[1]};background:${shadeOf(S.color,i,G.parts.length)}">${p[1]}%</div>`).join("")+"</div>";
    pGrade+='<div class="barkey">'+G.parts.map((p,i)=>`<span><i style="background:${shadeOf(S.color,i,G.parts.length)}"></i>${esc(p[0])}</span>`).join("")+"</div>";
    pGrade+='<div class="calc">';
    G.parts.forEach((p,i)=>{
      const max=points?(p[1]/10):10;
      pGrade+=`<div class="calc-row"><label for="${ids[i]}">${esc(p[0])} `+
          `<span style="color:var(--ink-3)">(${points?esc(t("calc.maxPoints",{n:max})):p[1]+"%"})</span></label>`+
          `<input type="text" inputmode="decimal" autocomplete="off" id="${ids[i]}" data-max="${max}" `+
          `placeholder="${editable?esc(t("calc.placeholder")):"—"}" ${editable?"":"readonly tabindex=\"-1\""} `+
          `data-subj="${k}" data-scope="${scope}" data-w="${p[1]}" class="g-input${editable?"":" ro"}"></div>`;
    });
    pGrade+=`<div class="calc-res" id="res-${scope}-${k}" aria-live="polite"><span>${t("calc.total0")}</span></div></div>`;
  }
  pGrade+=`<div class="min">${G.minimum}</div></div>`;

  const pDates=`<div class="panel"><h4>${esc(t("subject.dates"))}</h4>`+(dates.length
    ?`<ul class="plain">`+dates.map(e=>`<li><span>${esc(e.what)}</span><span class='d'>${esc(eventLabel(e))} <span class="pill p-${e.type}">${esc(e.weight)}</span></span></li>`).join("")+"</ul>"
    :`<p class='nodata'>${esc(t("subject.noDates"))}</p>`)+`</div>`;

  /* two columns that stack independently, so neither stretches the other */
  h+=`<div class="panels"><div class="pcol">${pTime}${pGrade}</div><div class="pcol">${pStaff}${pDates}</div></div>`;
  return h+(accordion?`<details class="acc"><summary>${esc(t("subject.rulesAndSyllabus"))}</summary><div id="syllabus-${k}">${syllabusHTML(k)}</div></details>`:"")+"</div>";
}

/* live calculation: running total, what is left and the minimums */
function recalc(subj,scope){
  scope=scope||"main";
  const C=GRADING[subj].grading||{scale:"10"}, points=C.scale==="points";
  const inputs=$$(`.g-input[data-subj="${subj}"][data-scope="${scope}"]`);
  let total=0, remaining=0, any=false;
  const values=inputs.map(inp=>{
    const max=+inp.dataset.max, v=readGrade(inp);
    const bad=v!==null&&(Number.isNaN(v)||v<0||v>max);
    inp.classList.toggle("invalid",bad);
    inp.setAttribute("aria-invalid",bad?"true":"false");
    return v===null||Number.isNaN(v)?null:Math.min(Math.max(v,0),max);
  });
  inputs.forEach((inp,i)=>{
    const w=+inp.dataset.w, max=+inp.dataset.max, weight=points?1:w/100;
    if(values[i]!==null){ total+=values[i]*weight; any=true; } else remaining+=max*weight;
  });
  const el=document.getElementById(`res-${scope}-${subj}`); if(!el) return;
  if(!any){ el.innerHTML=`<span>${t("calc.total0")}</span>`; return; }
  let html=`<span>${t("calc.total",{n:`<b style="color:var(--ink)">${total.toFixed(2)}</b>`})}</span>`;
  /* the minimum grade decides whether you pass, not the average */
  const fails=[C.min,C.min2].filter(Boolean).filter(m=>values[m.item]!==null&&values[m.item]<m.value).map(m=>m.text);
  if(fails.length) html+=`<span style="color:var(--warn);font-weight:700">${esc(t("calc.failMin",{what:fails.join(" "+t("and")+" ")}))}</span>`;
  else if(remaining>0.001){
    const need=5-total;
    if(need<=0) html+=`<span style="color:var(--go)">${esc(t("calc.reached"))}</span>`;
    else if(need>remaining+0.001) html+=`<span style="color:var(--warn)">${esc(t("calc.cannot"))}</span>`;
    else html+=`<span style="color:var(--ink-2)">${t("calc.need",{need:`<b>${need.toFixed(2)}</b>`,left:`<b>${remaining.toFixed(2)}</b>`})}</span>`;
  }
  else html+=total<5?`<span style="color:var(--warn)">${esc(t("calc.fail",{n:total.toFixed(2)}))}</span>`:`<span style="color:var(--go)">${esc(t("calc.pass"))}</span>`;
  if(C.min) html+=`<span style="flex-basis:100%;color:var(--ink-3);font-size:.78rem">${esc(t("calc.youNeed",{what:C.min.text+(C.min2?" "+t("and")+" "+C.min2.text:"")}))}</span>`;
  el.innerHTML=html;
}

(function(){
  const NUM={es:["","una","dos","tres","cuatro","cinco","seis","siete","ocho","nueve","diez"],
             en:["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten"]}[LANG];
  const ids=subjectsOn(todayISO());
  $("#subjectCards").innerHTML=ids.map(k=>subjectCard(k)).join("");
  $("#subjectsIntro").textContent=t(ids.length===1?"subjects.introOne":"subjects.intro",{n:NUM[ids.length]||ids.length});

  document.addEventListener("input",e=>{
    if(e.target.classList.contains("g-input")) recalc(e.target.dataset.subj,e.target.dataset.scope);
  });
  /* saving: only the box that changed */
  document.addEventListener("change",e=>{
    const inp=e.target;
    if(!inp.matches('.g-input[data-scope="main"]')) return;
    const v=readGrade(inp), id=inp.id;
    const text=v===null||Number.isNaN(v)?"":String(v);
    Cloud.change("grade:"+id,{op:"grade",args:{id,text}});
  });

  /* loading from the cloud: grades saved in the old format (by position)
     are translated once into the new one (by name) */
  const oldFormat=/^g_main_([a-z]+)_(\d+)$/;
  const translate=id=>{ const m=id.match(oldFormat); return m&&SUBJECTS[m[1]]?gradeIds(m[1],"main")[+m[2]]||id:id; };
  Cloud.onLoad(rec=>{
    const stored=rec.grades||{}, grades={};
    Object.keys(stored).forEach(id=>{ grades[translate(id)]=stored[id]; });
    if(Object.keys(stored).some(id=>translate(id)!==id)) Cloud.change("migrate-grades",r=>{
      const old=r.grades||{}, fresh={};
      Object.keys(old).forEach(id=>{ fresh[translate(id)]=old[id]; });
      r.grades=fresh;
    });
    const touched=new Set();
    $$('.g-input[data-scope="main"]').forEach(inp=>{
      if(document.activeElement===inp) return;          /* never overwrite what you are typing */
      const v=grades[inp.id]??"";
      if(inp.value!==v){ inp.value=v; touched.add(inp.dataset.subj); }
    });
    touched.forEach(k=>recalc(k,"main"));
  });

  /* syllabus progress changes with the days */
  document.addEventListener("newDay",()=>ids.forEach(k=>{ const el=document.getElementById("syllabus-"+k); if(el) el.innerHTML=syllabusHTML(k); }));

  /* copy an email address */
  document.addEventListener("click",async e=>{
    const b=e.target.closest(".mailcopy"); if(!b||!b.dataset.mail) return;
    b.dataset.label=b.dataset.label||b.textContent;
    clearTimeout(b.resetTimer);
    try{
      if(navigator.clipboard) await navigator.clipboard.writeText(b.dataset.mail);
      else { const ta=document.createElement("textarea"); ta.value=b.dataset.mail; document.body.appendChild(ta);
             ta.select(); document.execCommand("copy"); ta.remove(); }
      b.textContent=t("copied.f"); b.classList.add("ok");
    }catch(err){ b.textContent=b.dataset.mail; }
    b.resetTimer=setTimeout(()=>{ b.textContent=b.dataset.label; b.classList.remove("ok"); },1600);
  });
})();
