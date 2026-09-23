/* ==========================================================
   settings.js — the Settings page (#settings, gear icon in the header):
   language, theme and animations. Each choice is a segmented control;
   saving and applying are done by saveSetting() in prefs.js.
   ========================================================== */
(function(){
  const box=$("#settingsList");
  const ROWS=[
    {key:"lang",  label:"s.set.lang",   help:"s.set.langHelp",
     options:[["es","Español"],["en","English"]]},          /* each language in its own name */
    {key:"theme", label:"s.set.theme",  help:"s.set.themeHelp",
     options:SETTINGS_OPTIONS.theme.map(v=>[v,t("s.set.theme."+v)])},
    {key:"motion",label:"s.set.motion", help:"s.set.motionHelp",
     options:SETTINGS_OPTIONS.motion.map(v=>[v,t("s.set.motion."+v)])}
  ];
  function render(){
    box.innerHTML=ROWS.map(r=>`<div class="set-row"><div class="set-txt"><b id="set-${r.key}">${esc(t(r.label))}</b>`+
      `<p>${esc(t(r.help))}</p></div>`+
      `<div class="seg" role="radiogroup" aria-labelledby="set-${r.key}" data-key="${r.key}">`+
      r.options.map(o=>`<button type="button" role="radio" data-value="${o[0]}" aria-checked="${SETTINGS[r.key]===o[0]}"`+
        `${o[0]==="es"||o[0]==="en"?` lang="${o[0]}"`:""}>${esc(o[1])}</button>`).join("")+
      `</div></div>`).join("")+
      `<p class="set-note">${esc(t("s.set.reload"))}</p>`;
  }
  box.addEventListener("click",ev=>{
    const b=ev.target.closest(".seg button"); if(!b) return;
    const key=b.parentNode.dataset.key;
    b.parentNode.querySelectorAll("button").forEach(x=>x.setAttribute("aria-checked",String(x===b)));
    saveSetting(key,b.dataset.value);
  });
  /* arrow keys move within a group, like native radio buttons */
  box.addEventListener("keydown",ev=>{
    const b=ev.target.closest(".seg button"); if(!b||!["ArrowLeft","ArrowRight"].includes(ev.key)) return;
    const all=[...b.parentNode.querySelectorAll("button")], i=all.indexOf(b);
    const next=all[(i+(ev.key==="ArrowRight"?1:all.length-1))%all.length];
    next.focus(); next.click(); ev.preventDefault();
  });
  render();
})();
