/* ==========================================================
   profesorado.js — tabla con todo el profesorado del cuatrimestre en vigor.
   En el móvil cada fila se convierte en una tarjeta (lo hace el CSS).
   ========================================================== */
(function(){
  const ids=asignaturasEn(hoyISO());
  $("#profbody").innerHTML=PROFS.filter(p=>ids.includes(p.id)).map(p=>{
    const S=SUBJ[p.id];
    return `<tr><td><span class='sw' style='background:${S.c}'></span>${esc(S.n)}</td>`+
      `<td><b>${esc(p.name)}</b><br><span style='color:var(--ink-3);font-size:.8rem'>${esc(rolLabel(p)||"—")}</span></td>`+
      `<td>${p.mail?`<a href='mailto:${p.mail}'>${p.mail}</a>`:"<span class='nodata'>no publicado</span>"}</td>`+
      `<td>${p.office?esc(p.office):"<span class='nodata'>no publicado</span>"}</td></tr>`;
  }).join("");
})();
