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
    Cloud.change("done:"+id,rec=>{
      const s=new Set(rec.hechas||[]);
      if(done) s.add(id); else s.delete(id);
      rec.hechas=[...s];
    });
  });

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
    $$("#subjectTasks input, #generalTasks input").forEach(inp=>{ inp.checked=s.has(inp.id); });
  });

  /* save status */
  document.addEventListener("cloud",e=>{ $("#tasksStatus").textContent=e.detail.text; });
})();
