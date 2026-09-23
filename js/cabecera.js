/* ==========================================================
   cabecera.js — reloj, fecha, semana y cifras de arriba.
   Es también el único reloj de la página: cuando cambia el minuto avisa con
   el evento "minuto", y cuando cambia el día con "nuevoDia". Quien necesite
   refrescarse (Hoy, el calendario, el inicio…) solo tiene que escuchar.
   ========================================================== */
(function(){
  const DIAS=DIA_LARGO.map(d=>d.toLowerCase());
  let dia=hoyISO(), semanaPintada="", temporizador=null;

  /* los dígitos solo se tocan cuando cambian, y entran con una pequeña caída */
  function pintaHora(n){
    const digs=$$("#rHora .dig"); if(!digs.length) return;
    [String(n.getHours()).padStart(2,"0"), String(n.getMinutes()).padStart(2,"0")].forEach((par,i)=>{
      if(digs[i].textContent===par) return;
      digs[i].textContent=par;
      digs[i].classList.remove("late"); void digs[i].offsetWidth; digs[i].classList.add("late");
    });
  }
  /* la tarjeta de semana solo se rehace cuando cambia (si no, su barra volvería a crecer cada minuto) */
  function pintaSemana(k){
    const w=semanaEn(k), tr=tramoDe(k);
    const html=w
      ? `<b>Semana ${w.n}</b><span>de ${totalSemanas(w.c)}</span><i class="w-bar"><u style="width:${Math.round(w.n/totalSemanas(w.c)*100)}%"></u></i>`
      : `<b>${esc(k<CUATRIS[0].ini?"Aún no empieza":tr?tr.t:"Sin clases")}</b>`;
    if(html===semanaPintada) return;
    semanaPintada=html; $("#rSemana").innerHTML=html;
  }
  /* rótulo, cifras y textos que dependen del cuatrimestre */
  function pintaCurso(k){
    const cu=ordinalCuatri(cuatriEn(k))+" cuatrimestre";
    $$("[data-cuatri]").forEach(el=>el.textContent=cu);
    const ids=asignaturasEn(k);
    const cifras=[[ids.length,"asignaturas"],[ids.reduce((s,id)=>s+(SUBJ[id].ects||0),0),"ECTS"],
                  [new Set(ids.map(id=>SUBJ[id].cam)).size,"campus"]];
    const box=$("#stats");
    if(box) box.innerHTML=cifras.map(c=>`<div class="stat"><b data-fin="${c[0]}">${c[0]}</b><span>${c[1]}</span></div>`).join("");
  }
  /* las cifras cuentan desde cero al cargar */
  function contar(){
    if(reducido()) return;
    $$("#stats b[data-fin]").forEach((b,i)=>{
      const fin=+b.dataset.fin; if(!fin) return;
      const t0=performance.now()+i*120, dur=900;
      b.textContent="0";
      (function paso(t){
        const x=Math.min(1,Math.max(0,(t-t0)/dur));
        b.textContent=Math.round(fin*(1-Math.pow(1-x,3)));
        if(x<1) requestAnimationFrame(paso);
      })(performance.now());
    });
  }

  function tic(){
    const n=new Date(), k=isoD(n);
    pintaHora(n);
    $("#rFecha").textContent=DIAS[n.getDay()]+", "+n.getDate()+" de "+MES_LARGO[n.getMonth()];
    pintaSemana(k);
    if(k!==dia){ dia=k; pintaCurso(k); emitir("nuevoDia",k); }
    emitir("minuto",k);
  }
  /* justo al cambiar de minuto; al volver a la pestaña del navegador, en el acto
     (en segundo plano los temporizadores se duermen) */
  function programar(){
    clearTimeout(temporizador);
    temporizador=setTimeout(()=>{ tic(); programar(); }, 60000-Date.now()%60000+30);
  }
  document.addEventListener("visibilitychange",()=>{ if(!document.hidden){ tic(); programar(); } });

  pintaCurso(dia);
  contar();
  tic();
  programar();
})();
