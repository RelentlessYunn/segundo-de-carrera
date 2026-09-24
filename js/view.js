/* ==========================================================
   view.js — just the sky. The eye button (on home and in the header)
   hides the whole interface so the universe can be enjoyed on its own;
   the button at the bottom (or Escape) brings everything back. It fades
   to almost nothing when you leave it alone, and while you look the sky
   never goes to sleep (effects.js).
   ========================================================== */
const View=(function(){
  const root=document.documentElement, exit=$("#viewExit");
  if(!exit) return {show(){},hide(){},on:()=>false};
  let on=false, dimT=0, backT=0;
  const nudge=()=>{ exit.classList.remove("dim"); clearTimeout(dimT); dimT=setTimeout(()=>exit.classList.add("dim"),2600); };
  function show(){
    if(on) return; on=true;
    clearTimeout(backT); root.classList.remove("view-back"); root.classList.add("viewing");
    exit.hidden=false; nudge(); exit.focus({preventScroll:true});
  }
  function hide(){
    if(!on) return; on=false;
    root.classList.remove("viewing"); root.classList.add("view-back");
    backT=setTimeout(()=>root.classList.remove("view-back"),700);
    exit.hidden=true; clearTimeout(dimT);
  }
  document.addEventListener("click",ev=>{ if(ev.target.closest("[data-view-sky]")){ ev.preventDefault(); show(); } });
  exit.addEventListener("click",hide);
  /* Escape leaves the sky first (before it can close anything else) */
  document.addEventListener("keydown",ev=>{ if(on&&ev.key==="Escape"){ ev.stopImmediatePropagation(); ev.preventDefault(); hide(); } },true);
  ["pointermove","pointerdown","touchstart"].forEach(t=>document.addEventListener(t,()=>{ if(on) nudge(); },{passive:true}));
  return {show,hide,on:()=>on};
})();
