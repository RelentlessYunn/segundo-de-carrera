/* ==========================================================
   effects.js — motion details: ripple on tap, confetti when a task is
   ticked, and idle mode: after a while without touching anything the
   decorations that move by themselves (aurora, stars, shines) pause to save
   battery, and resume as soon as you touch something.
   With animations set to "basic" or "none" in Settings (or reduced motion
   in the system) the decorative ones don't run.
   ========================================================== */
(function(){
  if(lowMotion()) return;

  /* ripple born where you tap */
  const RIPPLE=".p-card,.p-back,.trow.tap,.n7-card,nav.bar a[data-tab],.day-nav,.day-today,.m-nav,.m-today,.ag-btn,#examFilters button,.mailbtn,.mailcopy,.seg button";
  document.addEventListener("pointerdown",e=>{
    const tgt=e.target.closest(RIPPLE); if(!tgt) return;
    const r=tgt.getBoundingClientRect(), d=Math.max(r.width,r.height)*2.2;
    const o=document.createElement("span");
    o.className="ripple";
    o.style.cssText=`width:${d}px;height:${d}px;left:${e.clientX-r.left-d/2}px;top:${e.clientY-r.top-d/2}px`;
    tgt.appendChild(o);
    setTimeout(()=>o.remove(),650);
  },{passive:true});

  if(!fullMotion()) return;

  /* confetti when a task is ticked, in its subject colour */
  document.addEventListener("change",e=>{
    const inp=e.target;
    if(!inp.matches(".checkitem input[type=checkbox]")||!inp.checked) return;
    const r=inp.getBoundingClientRect();
    const c=getComputedStyle(inp.closest(".checkitem")).getPropertyValue("--sc").trim()||"#3FD9A4";
    const cols=[c,"#FFD66B","#FFFFFF",c,"#5AA9FF"];
    for(let i=0;i<18;i++){
      const p=document.createElement("i"), ang=Math.random()*Math.PI*2, dist=24+Math.random()*40;
      p.className="confetti";
      p.style.cssText=`left:${r.left+r.width/2}px;top:${r.top+r.height/2}px;background:${cols[i%cols.length]};`+
        `--tx:${(Math.cos(ang)*dist).toFixed(1)}px;--ty:${(Math.sin(ang)*dist-14).toFixed(1)}px;--rot:${Math.round(Math.random()*540)}deg;`+
        `border-radius:${i%3?"2px":"50%"}`;
      document.body.appendChild(p);
      setTimeout(()=>p.remove(),950);
    }
  });

  /* idle: after 45 s without input the decorations pause */
  const IDLE=45000;
  let timer=0;
  const wake=()=>{
    if(document.body.classList.contains("idle")) document.body.classList.remove("idle");
    clearTimeout(timer); timer=setTimeout(()=>document.body.classList.add("idle"),IDLE);
  };
  ["pointerdown","keydown","wheel","touchstart","scroll"].forEach(ev=>
    document.addEventListener(ev,wake,{passive:true,capture:true}));
  document.addEventListener("visibilitychange",()=>{ if(!document.hidden) wake(); });
  wake();
})();
