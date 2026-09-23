/* ==========================================================
   faculty.js — table with the faculty of the term in force.
   On mobile each row turns into a card (done in CSS).
   ========================================================== */
(function(){
  const ids=subjectsOn(todayISO());
  $("#facultyRows").innerHTML=FACULTY.filter(p=>ids.includes(p.subject)).map(p=>{
    const S=SUBJECTS[p.subject], none=`<span class='nodata'>${esc(t("faculty.notPublished"))}</span>`;
    return `<tr><td><span class='sw' style='background:${S.color}'></span>${esc(S.name)}</td>`+
      `<td><b>${esc(p.name)}</b><br><span style='color:var(--ink-3);font-size:.8rem'>${esc(roleText(p)||"—")}</span></td>`+
      `<td data-label="${esc(t("faculty.email"))}">${p.email?`<a href='mailto:${p.email}'>${p.email}</a>`:none}</td>`+
      `<td data-label="${esc(t("faculty.office"))}">${p.office?esc(p.office):none}</td></tr>`;
  }).join("");
})();
