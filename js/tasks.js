/* ==========================================================
   tasks.js — task lists (per subject and general) with their ticks saved
   to the cloud. Each task's id comes from its title, not its position:
   tasks can be deleted or reordered without ticks moving to another one.
   The id format ("tk_is_…", "gk_…") is also the stored key: keep it.
   ========================================================== */
(function(){
  const subjectTaskId=k=>x=>`tk_${k}_${slug(x[0])}`;
  const generalTaskId=x=>`gk_${slug(x[0])}`;
  const item=(id,x,S)=>`<div class="checkitem"${S?` style="--sc:${S.color}"`:""}><input type="checkbox" id="${id}">`+
    `<label for="${id}">${S?`<span class="tk-sub" style="color:${S.color}">${esc(S.name)}</span>`:""}`+
    `<b>${esc(x[0])}</b><span>${esc(x[1]||"")}</span></label></div>`;

  $("#subjectTasks").innerHTML=Object.keys(TASKS).flatMap(k=>(TASKS[k]||[]).map(x=>item(subjectTaskId(k)(x),x,SUBJECTS[k]))).join("")
    || `<p class="nodata">${esc(t("tasks.noneSubject"))}</p>`;
  $("#generalTasks").innerHTML=GENERAL_TASKS.map(x=>item(generalTaskId(x),x)).join("") || `<p class="nodata">${esc(t("tasks.noneGeneral"))}</p>`;

  /* saving: only the task that changed */
  document.addEventListener("change",e=>{
    const inp=e.target;
    if(!inp.matches("#subjectTasks input, #generalTasks input")) return;
    const id=inp.id, done=inp.checked;
    Cloud.change("done:"+id,{op:"done",args:{id,done}});
    /* its pop plays once, now (css) */
    inp.classList.remove("just"); if(done){ void inp.offsetWidth; inp.classList.add("just"); }
  });
  document.addEventListener("animationend",e=>{ if(e.target.classList&&e.target.classList.contains("just")) e.target.classList.remove("just"); });

  /* ticks saved in the old format (by position) are translated once */
  function translator(){
    const map={};
    Object.keys(TASKS).forEach(k=>(TASKS[k]||[]).forEach((x,i)=>{ map[`tk_${k}_${i}`]=subjectTaskId(k)(x); }));
    GENERAL_TASKS.forEach((x,i)=>{ map[`gk_${i}`]=generalTaskId(x); });
    return id=>/^(tk_[a-z]+|gk)_\d+$/.test(id)&&map[id]?map[id]:id;
  }
  Cloud.onLoad(rec=>{
    const translate=translator();
    const done=(rec.hechas||[]).map(translate);
    if(done.some((id,i)=>id!==(rec.hechas||[])[i]))
      Cloud.change("migrate-done",r=>{ r.hechas=[...new Set((r.hechas||[]).map(translate))]; });
    const s=new Set(done);
    $$("#subjectTasks input, #generalTasks input").forEach(inp=>{ const on=s.has(inp.id); if(inp.checked!==on) inp.checked=on; });
  });

  /* ---------- your constellation: one star per task, lit when it is done ----------
     The stars are placed along a gentle zigzag (always the same for the
     same number of tasks); lines join the lit ones in order. */
  const box=$("#tasksConstellation");
  let shownDone=null;
  /* user: a task was just ticked here, so its star is born (never for ticks that arrive from the cloud) */
  function constellation(user){
    /* measured only where it can be seen: hidden (another tab, or behind home) it is drawn when its tab opens */
    if($("#tasks").hidden||document.body.classList.contains("portal-open")) return;
    const inputs=$$("#subjectTasks input, #generalTasks input"), n=inputs.length;
    if(!n){ box.innerHTML=""; return; }
    const W=Math.max(320,Math.round(box.clientWidth||1000)), H=110, done=inputs.map(i=>i.checked), count=done.filter(Boolean).length;
    let s=7919;
    const rnd=()=>{ s=(s*16807)%2147483647; return s/2147483647; };
    const pts=inputs.map((_,i)=>[30+(W-60)*(n===1?.5:i/(n-1))+(rnd()-.5)*Math.min(40,W/n/2), H/2+(i%2?-1:1)*(18+rnd()*22)]);
    let lines="";
    for(let i=1;i<n;i++){
      const on=done[i]&&done[i-1];
      lines+=`<line x1="${pts[i-1][0].toFixed(1)}" y1="${pts[i-1][1].toFixed(1)}" x2="${pts[i][0].toFixed(1)}" y2="${pts[i][1].toFixed(1)}" class="${on?"on":""}"/>`;
    }
    const stars=pts.map((p,i)=>{
      const sc=inputs[i].closest(".checkitem").style.getPropertyValue("--sc")||"#FFFFFF";
      const fresh=user&&shownDone&&done[i]&&!shownDone[i];
      return `<g class="c-star${done[i]?" on":""}${fresh?" fresh":""}" style="--sc:${sc}" transform="translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})">`+
        `<g class="c-pop"><circle r="14" class="halo"/><circle r="${done[i]?3.4:2}" class="core"/></g></g>`;
    }).join("");
    box.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(tn(count===n?"tasks.constellationDone":"tasks.constellation",count,{total:n}))}">`+
      `<g class="c-lines">${lines}</g>${stars}</svg>`+
      `<p>${esc(count===n?t("tasks.constellationDone"):tn("tasks.constellation",count,{total:n}))}</p>`;
    shownDone=done;
  }
  document.addEventListener("change",e=>{ if(e.target.matches("#subjectTasks input, #generalTasks input")) constellation(true); });
  Cloud.onLoad(()=>constellation());
  /* measured when the tab is visible (hidden it has no width) */
  document.addEventListener("tab",e=>{ if(e.detail==="tasks") constellation(); });
  let rz=0; window.addEventListener("resize",()=>{ clearTimeout(rz); rz=setTimeout(()=>{ if(!$("#tasks").hidden) constellation(); },200); });
  constellation();

  /* save status */
  document.addEventListener("cloud",e=>{ $("#tasksStatus").textContent=e.detail.text; });
})();
