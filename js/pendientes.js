/* ==========================================================
   pendientes.js — listas de tareas (por asignatura y generales) con sus
   marcas guardadas en la nube. Cada tarea tiene un id por su nombre, no por
   su posición: se pueden borrar o reordenar tareas sin que se muevan las marcas.
   ========================================================== */
(function(){
  const idTarea=k=>t=>`tk_${k}_${slug(t[0])}`;
  const idGeneral=t=>`gk_${slug(t[0])}`;
  const item=(id,t,S)=>`<div class="checkitem"${S?` style="--sc:${S.c}"`:""}><input type="checkbox" id="${id}">`+
    `<label for="${id}">${S?`<span class="tk-sub" style="color:${S.c}">${esc(S.n)}</span>`:""}`+
    `<b>${esc(t[0])}</b><span>${esc(t[1]||"")}</span></label></div>`;

  $("#tareasAsig").innerHTML=Object.keys(TAREAS).flatMap(k=>(TAREAS[k]||[]).map(t=>item(idTarea(k)(t),t,SUBJ[k]))).join("")
    || '<p class="nodata">Ninguna tarea de asignatura.</p>';
  $("#checks").innerHTML=GENERALES.map(t=>item(idGeneral(t),t)).join("") || '<p class="nodata">Nada pendiente.</p>';

  /* guardar: solo la tarea que ha cambiado */
  document.addEventListener("change",e=>{
    const inp=e.target;
    if(!inp.matches("#tareasAsig input, #checks input")) return;
    const id=inp.id, hecha=inp.checked;
    Nube.cambiar("hecha:"+id,rec=>{
      const s=new Set(rec.hechas||[]);
      if(hecha) s.add(id); else s.delete(id);
      rec.hechas=[...s];
    });
  });

  /* marcas guardadas con el formato antiguo (por posición): se traducen una vez */
  function traductor(){
    const mapa={};
    Object.keys(TAREAS).forEach(k=>(TAREAS[k]||[]).forEach((t,i)=>{ mapa[`tk_${k}_${i}`]=idTarea(k)(t); }));
    GENERALES.forEach((t,i)=>{ mapa[`gk_${i}`]=idGeneral(t); });
    return id=>/^(tk_[a-z]+|gk)_\d+$/.test(id)&&mapa[id]?mapa[id]:id;
  }
  Nube.alCargar(rec=>{
    const traducir=traductor();
    const hechas=(rec.hechas||[]).map(traducir);
    if(hechas.some((id,i)=>id!==(rec.hechas||[])[i]))
      Nube.cambiar("migrar-hechas",r=>{ r.hechas=[...new Set((r.hechas||[]).map(traducir))]; });
    const s=new Set(hechas);
    $$("#tareasAsig input, #checks input").forEach(inp=>{ inp.checked=s.has(inp.id); });
  });

  /* estado del guardado */
  document.addEventListener("nube",e=>{ $("#notasEstado2").textContent=e.detail.texto; });
})();
