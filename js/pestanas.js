/* ==========================================================
   pestanas.js — rutas y pestañas.
   · #horario, #asignaturas, #calendario, #pendientes, #profesorado: pestañas de UC3M
   · #notas: página oculta de notas para Claude
   · #home y #nolan (o #nolan/…): la pantalla de inicio (inicio.js)
   · #debug: panel de diagnóstico (diagnostico.js); no cambia de pestaña
   En el móvil también se cambia de pestaña deslizando el dedo.
   ========================================================== */
const Rutas=(function(){
  /* el horario semanal y el calendario del mes comparten pestaña */
  const TABS={
    horario:["hoy","horario","planificador"], asignaturas:["asignaturas"],
    calendario:["calendario"], pendientes:["pendientes"], profesorado:["profesorado"]
  };
  const orden=Object.keys(TABS);
  const links=$$("nav.bar a[data-tab]");
  const secciones=[...Object.values(TABS).flat(),"notas"].map(id=>document.getElementById(id)).filter(Boolean);
  const lienzo=$("body > div.wrap");
  const esMovil=()=>matchMedia("(max-width:820px)").matches;
  let actual="horario", ultima="horario", visto=false;

  /* ---------- la cápsula de color que viaja hasta la pestaña activa ---------- */
  const barra=$("nav.bar .tabs");
  function indicador(){
    const on=barra.querySelector("a[data-tab].on");
    barra.classList.toggle("sin-ind",!on);
    if(!on) return;
    barra.style.setProperty("--x",on.offsetLeft+"px");
    barra.style.setProperty("--w",on.offsetWidth+"px");
    barra.style.setProperty("--cx",(on.offsetLeft+on.offsetWidth/2)+"px");
    barra.style.setProperty("--acon",on.style.getPropertyValue("--ac"));
  }
  window.addEventListener("resize",indicador);
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(indicador);
  /* la primera colocación no se anima: la cápsula aparece ya en su sitio */
  requestAnimationFrame(()=>requestAnimationFrame(()=>barra.classList.add("lista")));

  const arriba=()=>{ lienzo.scrollTop=0; window.scrollTo({top:0,behavior:"instant"}); };

  /* ---------- mostrar una pestaña ---------- */
  function abrir(tab,opts){
    opts=opts||{};
    if(tab!=="notas"&&!TABS[tab]) tab="horario";
    const visibles=tab==="notas"?["notas"]:TABS[tab];
    secciones.forEach(el=>{ el.hidden=!visibles.includes(el.id); });
    links.forEach(l=>{
      const on=l.dataset.tab===tab;
      l.classList.toggle("on",on);
      if(on) l.setAttribute("aria-current","page"); else l.removeAttribute("aria-current");
    });
    actual=tab; visto=true; if(tab!=="notas") ultima=tab;
    indicador();
    /* entrada escalonada solo en escritorio: en el móvil manda el deslizamiento */
    if(!esMovil()&&!opts.quieto){
      const secs=visibles.map(id=>document.getElementById(id)).filter(Boolean);
      const hijos=secs.flatMap(el=>[...el.children]);
      secs.forEach(el=>el.classList.remove("enter"));
      hijos.forEach(h=>h.classList.remove("stagger"));
      void document.body.offsetWidth;            /* un único reinicio para todas */
      secs.forEach(el=>el.classList.add("enter"));
      hijos.forEach((h,i)=>{ h.style.setProperty("--d",(Math.min(i,8)*55)+"ms"); h.classList.add("stagger"); });
    }
    if(opts.scroll!==false){ arriba(); requestAnimationFrame(arriba); }
    emitir("pestana",tab);
  }

  /* ---------- rutas ---------- */
  const esInicio=r=>r==="home"||r==="nolan"||r.startsWith("nolan/");
  function manejar(){
    const r=decodeURIComponent(location.hash.slice(1));
    if(r.includes("debug")) return;                    /* lo lleva diagnostico.js */
    if(esInicio(r)){
      if(!visto) abrir(ultima,{quieto:true});           /* detrás del inicio, la última pestaña */
      const [vista,...sub]=r.split("/"); Inicio.abrir(vista,sub.join("/"),ultima); return;
    }
    Inicio.cerrar();
    const tab=r==="notas"||TABS[r]?r:"horario";
    if(tab!==r&&r) history.replaceState(null,"","#"+tab);   /* enlaces viejos (#planificador…) */
    abrir(tab);
  }
  /* ir a una pestaña sin llenar el historial (el botón atrás no recorre pestañas) */
  function irPestana(tab){
    history.replaceState(null,"","#"+tab);
    Inicio.cerrar();
    abrir(tab);
  }
  window.addEventListener("hashchange",manejar);

  links.forEach(l=>l.addEventListener("click",ev=>{
    ev.preventDefault();
    if(saliendo){ saliendo.cancel(); saliendo=null; }         /* un toque manda sobre un deslizamiento a medias */
    const antes=orden.indexOf(actual), despues=orden.indexOf(l.dataset.tab);
    irPestana(l.dataset.tab);
    if(esMovil()&&antes>=0&&despues!==antes) entra(despues>antes?-1:1);
  }));
  /* la tarjeta UC3M del inicio te devuelve a la pestaña donde estabas */
  $("#pIrUc3m").addEventListener("click",ev=>{ ev.preventDefault(); irPestana(ultima); });
  /* Escape: cierra el inicio o el panel de detalle que esté abierto */
  document.addEventListener("keydown",ev=>{
    if(ev.key!=="Escape") return;
    if(Inicio.abierto()){ irPestana(ultima); return; }
    ["hoy-detail","ev-detail","subjPeek"].forEach(id=>{ const b=document.getElementById(id); if(b) b.hidden=true; });
  });

  /* ---------- deslizar con el dedo (móvil) ----------
     El contenido acompaña al dedo; al soltar se completa el cambio o vuelve a su sitio.
     El desplazamiento vertical lo hace el navegador (touch-action: pan-y en el CSS),
     así que aquí nada bloquea el scroll. */
  const UMBRAL=70, EASE_IN="cubic-bezier(.4,0,1,1)", EASE_OUT="cubic-bezier(.22,.7,.25,1)";
  let x0=null,y0=null,dx=0,arrastrando=false,bloqueado=false,scroller=null,saliendo=null;
  /* el contenedor desplazable en horizontal bajo el dedo, si lo hay */
  function scrollerHorizontal(el){
    for(let n=el; n&&n!==lienzo&&n!==document.body; n=n.parentElement){
      if(n.scrollWidth-n.clientWidth>4){ const ox=getComputedStyle(n).overflowX; if(ox==="auto"||ox==="scroll") return n; }
    }
    return null;
  }
  /* solo se cede el gesto si esa tabla aún puede moverse hacia ese lado */
  const cedeAlScroller=(sc,mx)=>!!sc&&(mx<0?sc.scrollLeft<sc.scrollWidth-sc.clientWidth-1:sc.scrollLeft>1);
  const poner=(t,op)=>{ lienzo.style.transform=`translate3d(${t}px,0,0)`; lienzo.style.opacity=op; };
  const limpiar=()=>{ lienzo.style.transform=""; lienzo.style.opacity=""; };
  function entra(sgn){
    if(reducido()||!lienzo.animate) return;
    lienzo.animate([{transform:`translate3d(${-sgn*window.innerWidth*0.3}px,0,0)`,opacity:0},{transform:"none",opacity:1}],
      {duration:280,easing:EASE_OUT});
  }
  function volverASuSitio(){
    const desde={transform:lienzo.style.transform||"none",opacity:lienzo.style.opacity||1};
    limpiar();
    if(!reducido()&&lienzo.animate) lienzo.animate([desde,{transform:"none",opacity:1}],{duration:260,easing:EASE_OUT});
  }

  document.addEventListener("touchstart",e=>{
    x0=null;
    if(!esMovil()||e.touches.length!==1||Inicio.abierto()||orden.indexOf(actual)<0||e.target.closest("input,textarea,select")) return;
    x0=e.touches[0].clientX; y0=e.touches[0].clientY;
    scroller=scrollerHorizontal(e.target);
    dx=0; arrastrando=false; bloqueado=false;
  },{passive:true});

  document.addEventListener("touchmove",e=>{
    if(x0===null||bloqueado) return;
    const mx=e.touches[0].clientX-x0, my=e.touches[0].clientY-y0;
    if(!arrastrando){
      if(Math.abs(my)>10&&Math.abs(my)>Math.abs(mx)){ bloqueado=true; return; }   /* scroll vertical */
      if(cedeAlScroller(scroller,mx)){ bloqueado=true; return; }                  /* la tabla aún se mueve */
      if(Math.abs(mx)<=12) return;
      arrastrando=true;
    }
    const i=orden.indexOf(actual), borde=(mx<0&&i>=orden.length-1)||(mx>0&&i<=0);
    dx=borde?mx*0.22:mx*0.85;                    /* en los extremos, resistencia */
    poner(dx,Math.max(.45,1-Math.abs(dx)/420));
  },{passive:true});

  document.addEventListener("touchend",()=>{
    if(x0===null||!arrastrando){ x0=null; return; }
    x0=null;
    const i=orden.indexOf(actual), sgn=dx<0?-1:1, destino=i-sgn;
    if(Math.abs(dx)<UMBRAL||destino<0||destino>=orden.length||reducido()||!lienzo.animate){
      if(Math.abs(dx)>=UMBRAL&&destino>=0&&destino<orden.length){ limpiar(); irPestana(orden[destino]); return; }
      volverASuSitio(); return;
    }
    /* sale hacia donde empujaste… */
    const desde={transform:lienzo.style.transform,opacity:lienzo.style.opacity||1};
    limpiar();
    const lejos=sgn*Math.max(Math.abs(dx)+window.innerWidth*0.2,window.innerWidth*0.6);
    saliendo=lienzo.animate([desde,{transform:`translate3d(${lejos}px,0,0)`,opacity:0}],{duration:150,easing:EASE_IN,fill:"forwards"});
    saliendo.onfinish=()=>{
      const anim=saliendo; saliendo=null;
      irPestana(orden[destino]);
      anim.cancel();
      entra(sgn);               /* …y la nueva entra por el lado contrario */
    };
  },{passive:true});
  /* un gesto del sistema (volver atrás, notificaciones…) cancela el toque: todo a su sitio */
  document.addEventListener("touchcancel",()=>{ if(x0!==null&&arrastrando) volverASuSitio(); x0=null; },{passive:true});

  /* ---------- arranque ---------- */
  manejar();
  if(!visto) abrir("horario",{quieto:true});           /* p. ej. al entrar con #debug */
  /* al terminar de cargar, el navegador salta al ancla del hash (#horario cae
     en el horario semanal, no en Hoy): se deshace para empezar siempre arriba */
  window.addEventListener("load",()=>setTimeout(arriba,0));

  return {actual:()=>actual, ultima:()=>ultima, ir:irPestana};
})();
