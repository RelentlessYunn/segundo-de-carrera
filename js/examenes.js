/* ==========================================================
   examenes.js — tabla con todo lo evaluable del cuatrimestre, con filtros
   por tipo y por asignatura. Lo ya pasado se atenúa.
   ========================================================== */
(function(){
  const ids=asignaturasEn(hoyISO());
  const evs=CAL.filter(e=>ids.includes(e.id)).sort(ordenEv);
  const tipos=[["Todas","Todas"],["type_ex","Exámenes"],["type_en","Entregas y obligatorio"],["type_cl","Labs y clases"],["type_cf","Conflictos"]];
  let cur="Todas";
  const fb=$("#filters");
  fb.innerHTML=tipos.map(t=>`<button data-k="${t[0]}" aria-pressed="${t[0]===cur}">${t[1]}</button>`).join("")+
    '<span class="sep" aria-hidden="true"></span>'+
    ids.filter(k=>evs.some(e=>e.id===k)).map(k=>`<button data-k="${k}" aria-pressed="false"><i class="sw" style="background:${SUBJ[k].c}"></i>${esc(SUBJ[k].n)}</button>`).join("");

  function pintar(){
    const hoy=hoyISO();
    const filas=evs.filter(e=>cur==="Todas"||(cur.startsWith("type_")?e.type===cur.slice(5):e.id===cur));
    $("#calrows").innerHTML=filas.length?filas.map(e=>{
      const w=semanaDeEv(e), S=SUBJ[e.id];
      return `<tr${finDe(e)<hoy?' class="pasado"':""}><td class='num'><b>${esc(etiquetaEv(e))}</b></td>`+
        `<td class='num' style='color:var(--ink-3)'>${w?"S"+w:"—"}</td>`+
        `<td><span class='sw' style='background:${S.c}'></span>${esc(S.n)}</td><td>${esc(e.what)}</td>`+
        `<td><span class='pill p-${e.type}'>${esc(e.w)}</span></td></tr>`;
    }).join(""):"<tr><td colspan='5' class='nodata'>Sin fechas para este filtro.</td></tr>";
  }
  fb.addEventListener("click",ev=>{
    const b=ev.target.closest("button"); if(!b) return;
    cur=b.dataset.k;
    $$("#filters button").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));
    pintar();
  });
  document.addEventListener("nuevoDia",pintar);
  pintar();
})();
