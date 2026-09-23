/* ==========================================================
   magia.js — detalles de movimiento: onda al pulsar, confeti al tachar una
   tarea, y reposo: si no tocas nada en un rato, los adornos que se mueven
   solos (aurora, estrellas, destellos) se paran para no gastar batería,
   y vuelven en cuanto tocas algo.
   Con "reducir movimiento" activado en el sistema, nada de esto se ejecuta.
   ========================================================== */
(function(){
  if(reducido()) return;

  /* onda que nace donde tocas */
  const ONDA=".p-card,.p-volver,.trow.tap,.n7-card,nav.bar a[data-tab],.d-nav,.d-hoy,.m-nav,.m-hoy,.ag-btn,.filters button,.mailbtn,.mailcopy";
  document.addEventListener("pointerdown",e=>{
    const t=e.target.closest(ONDA); if(!t) return;
    const r=t.getBoundingClientRect(), d=Math.max(r.width,r.height)*2.2;
    const o=document.createElement("span");
    o.className="onda";
    o.style.cssText=`width:${d}px;height:${d}px;left:${e.clientX-r.left-d/2}px;top:${e.clientY-r.top-d/2}px`;
    t.appendChild(o);
    setTimeout(()=>o.remove(),650);
  },{passive:true});

  /* confeti al tachar una tarea, con el color de su asignatura */
  document.addEventListener("change",e=>{
    const inp=e.target;
    if(!inp.matches(".checkitem input[type=checkbox]")||!inp.checked) return;
    const r=inp.getBoundingClientRect();
    const c=getComputedStyle(inp.closest(".checkitem")).getPropertyValue("--sc").trim()||"#3FD9A4";
    const cols=[c,"#FFD66B","#FFFFFF",c,"#5AA9FF"];
    for(let i=0;i<18;i++){
      const p=document.createElement("i"), ang=Math.random()*Math.PI*2, dist=24+Math.random()*40;
      p.className="chispa-fx";
      p.style.cssText=`left:${r.left+r.width/2}px;top:${r.top+r.height/2}px;background:${cols[i%cols.length]};`+
        `--tx:${(Math.cos(ang)*dist).toFixed(1)}px;--ty:${(Math.sin(ang)*dist-14).toFixed(1)}px;--rot:${Math.round(Math.random()*540)}deg;`+
        `border-radius:${i%3?"2px":"50%"}`;
      document.body.appendChild(p);
      setTimeout(()=>p.remove(),950);
    }
  });

  /* reposo: a los 45 s sin tocar nada se pausan los adornos */
  const REPOSO=45000;
  let t=0;
  const despertar=()=>{
    if(document.body.classList.contains("reposo")) document.body.classList.remove("reposo");
    clearTimeout(t); t=setTimeout(()=>document.body.classList.add("reposo"),REPOSO);
  };
  ["pointerdown","keydown","wheel","touchstart","scroll"].forEach(ev=>
    document.addEventListener(ev,despertar,{passive:true,capture:true}));
  document.addEventListener("visibilitychange",()=>{ if(!document.hidden) despertar(); });
  despertar();
})();
