/* ==========================================================
   debug.js — technical panel. Opens with #debug at the end of the address
   or by clicking the version number in the footer; if you open it by hand
   it stays open until you close it the same way.
   Shows screen measurements and the data checker's messages. Always English.
   ========================================================== */
(function(){
  const box=$("#debug");
  let manual=null;                 /* null: the address decides; true/false: you decided */
  function measure(){
    const wanted=manual!==null?manual:location.hash.includes("debug")||location.search.includes("debug");
    box.classList.toggle("on",wanted);
    if(!wanted) return;
    const nav=$("nav.bar"), canvas=$("body > div.wrap");
    const r=nav.getBoundingClientRect(), cs=getComputedStyle(nav);
    const probe=document.createElement("div");
    probe.style.cssText="position:fixed;bottom:0;height:env(safe-area-inset-bottom,0px)";
    document.body.appendChild(probe);
    const safe=probe.getBoundingClientRect().height; probe.remove();
    const lines=[
      $(".version").textContent+"  ·  tab "+(window.Router?Router.current():"?")+"  ·  "+JSON.stringify(SETTINGS),
      "window.innerHeight   "+innerHeight,
      "visualViewport       "+(window.visualViewport?Math.round(visualViewport.height):"-"),
      "devicePixelRatio     "+devicePixelRatio,
      "scroll container     "+Math.round(canvas.getBoundingClientRect().height),
      "nav top / bottom     "+Math.round(r.top)+" / "+Math.round(r.bottom)+"  ("+cs.position+")",
      "safe-area-inset-bot  "+Math.round(safe)+"px",
      "gap under the bar    "+Math.round(innerHeight-r.bottom)+"px",
      "cloud                "+(Cloud.enabled?(Cloud.ready()?"synced":"not loaded"):"disabled"),
      "missing texts        "+(I18N_MISSING.size?[...I18N_MISSING].join(", "):"none"),
      "data: "+CHECK.errors.length+" errors · "+CHECK.warnings.length+" warnings"
    ].concat(CHECK.errors.map(x=>"  ✘ "+x), CHECK.warnings.map(x=>"  · "+x));
    box.textContent=lines.join("\n");
  }
  window.addEventListener("hashchange",()=>{ manual=null; measure(); });
  document.addEventListener("click",e=>{
    if(e.target.closest(".version")){ manual=!box.classList.contains("on"); measure(); }
    else if(e.target.closest("#debug")){ manual=false; measure(); }
  });
  window.addEventListener("resize",measure);
  setTimeout(measure,300);
})();
