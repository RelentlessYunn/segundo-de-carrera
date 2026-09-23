/* ==========================================================
   diagnostico.js — panel técnico. Se abre con #debug al final de la
   dirección o pulsando el número de versión del pie; lo que abras a mano
   se queda abierto hasta que lo cierres igual.
   Muestra medidas de la pantalla y los avisos del comprobador de datos.
   ========================================================== */
(function(){
  const caja=$("#dbg");
  let manual=null;                 /* null: manda la dirección; true/false: lo decidiste tú */
  function medir(){
    const pedido=manual!==null?manual:location.hash.includes("debug")||location.search.includes("debug");
    caja.classList.toggle("on",pedido);
    if(!pedido) return;
    const nav=$("nav.bar"), cont=$("body > div.wrap");
    const r=nav.getBoundingClientRect(), cs=getComputedStyle(nav);
    const sonda=document.createElement("div");
    sonda.style.cssText="position:fixed;bottom:0;height:env(safe-area-inset-bottom,0px)";
    document.body.appendChild(sonda);
    const safe=sonda.getBoundingClientRect().height; sonda.remove();
    const lineas=[
      $(".ver").textContent+"  ·  pestaña "+(window.Rutas?Rutas.actual():"?"),
      "window.innerHeight   "+innerHeight,
      "visualViewport       "+(window.visualViewport?Math.round(visualViewport.height):"-"),
      "devicePixelRatio     "+devicePixelRatio,
      "contenedor scroll    "+Math.round(cont.getBoundingClientRect().height),
      "nav top / bottom     "+Math.round(r.top)+" / "+Math.round(r.bottom)+"  ("+cs.position+")",
      "safe-area-inset-bot  "+Math.round(safe)+"px",
      "hueco bajo la barra  "+Math.round(innerHeight-r.bottom)+"px",
      "nube                 "+(Nube.activa?(Nube.lista()?"sincronizada":"sin cargar"):"desactivada"),
      "datos: "+REVISION.graves.length+" errores · "+REVISION.avisos.length+" avisos"
    ].concat(REVISION.graves.map(t=>"  ✘ "+t), REVISION.avisos.map(t=>"  · "+t));
    caja.textContent=lineas.join("\n");
  }
  window.addEventListener("hashchange",()=>{ manual=null; medir(); });
  document.addEventListener("click",e=>{
    if(e.target.closest(".ver")){ manual=!caja.classList.contains("on"); medir(); }
    else if(e.target.closest("#dbg")){ manual=false; medir(); }
  });
  window.addEventListener("resize",medir);
  setTimeout(medir,300);
})();
