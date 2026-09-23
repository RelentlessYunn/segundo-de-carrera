/* ==========================================================
   inicio.js — la pantalla de inicio: elegir entre UC3M y Nolan.
   Se comporta como una ventana encima de todo: lo de detrás no se puede
   tocar ni recorrer con el tabulador, y Escape la cierra.
   Las rutas (#home, #nolan…) las decide pestanas.js; aquí solo se abre y cierra.
   ========================================================== */
const Inicio=(function(){
  const P=$("#portal"), vistas=$$("#portal .p-vista");
  const detras=[$("header.top"),$("nav.bar"),$("body > div.wrap")].filter(Boolean);
  let foco=null, cierre=0;
  const saludo=h=>h<6?"Buenas noches":h<14?"Buenos días":h<21?"Buenas tardes":"Buenas noches";

  /* resumen de la tarjeta UC3M: semana, clase de ahora o siguiente y próxima prueba */
  function pinta(){
    const n=new Date(), k=isoD(n), m=minutosDe(n);
    $("#pHora").textContent=hhmm(m);
    $("#pSaludo").textContent=saludo(n.getHours())+", Shengyu";
    const cs=clasesDe(k), sig=cs.find(c=>estadoClase(c,m)!=="pasada");
    const clase=sig?(estadoClase(sig,m)==="ahora"?"Ahora: ":"Siguiente: ")+SUBJ[sig.id].n+" · "+hhmm(sig.a)+" · "+sig.au
      :cs.length?"Clases de hoy terminadas":(sinClaseEl(k)||{texto:"Hoy no tienes clase."}).texto.replace(/\.$/,"");
    const pr=CAL.filter(e=>esPrueba(e)&&finDe(e)>=k).sort(ordenEv)[0];
    const prueba=pr?`${TIPO[pr.type]} de ${SUBJ[pr.id].ab}: ${cuandoEv(pr,k)}`:"";
    const w=semanaEn(k);
    $("#pUc3m").innerHTML=(w?`<i>Semana ${w.n}</i>`:"")+`<span>${esc(clase)}</span>`+(prueba?`<span>${esc(prueba)}</span>`:"");
  }
  function abrir(vista,subruta,volverA){
    pinta();
    /* la tarjeta UC3M apunta a la pestaña donde estabas */
    if(volverA) $("#pIrUc3m").setAttribute("href","#"+volverA);
    if(vista==="nolan") Nolan.pintar($("#vistaNolan"),subruta||"");
    vistas.forEach(v=>v.hidden=v.dataset.vista!==vista);
    clearTimeout(cierre);
    if(P.hidden||P.classList.contains("sale")){ foco=document.activeElement; P.scrollTop=0; }
    P.classList.remove("sale"); P.hidden=false;
    document.body.classList.add("en-portal");
    detras.forEach(el=>el.inert=true);
    /* el foco entra en la ventana (el tabulador sigue por las tarjetas), sin marcar ninguna */
    P.focus({preventScroll:true});
  }
  function cerrar(){
    if(P.hidden) return;
    document.body.classList.remove("en-portal");
    detras.forEach(el=>el.inert=false);
    if(reducido()) P.hidden=true;
    else { P.classList.add("sale"); cierre=setTimeout(()=>{ P.hidden=true; P.classList.remove("sale"); },280); }
    if(foco&&document.contains(foco)&&foco!==document.body) foco.focus({preventScroll:true});
    foco=null;
  }
  document.addEventListener("minuto",()=>{ if(!P.hidden) pinta(); });
  return {abrir, cerrar, abierto:()=>!P.hidden&&!P.classList.contains("sale")};
})();
