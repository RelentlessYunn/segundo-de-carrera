/* ==========================================================
   pruebas.js — comprobaciones automáticas de la web en un navegador real.
   Uso (desde la carpeta del proyecto):   node pruebas/pruebas.js
   Necesita Playwright con Chromium (npm i playwright). No toca la nube de
   verdad: las llamadas a JSONBin se simulan.
   Sale con código 1 si algo falla.
   ========================================================== */
const {chromium}=require("playwright");
const path=require("path");
const PAGINA="file://"+path.resolve(__dirname,"..","index.html");
let fallos=0;
const ok=(c,t)=>{ console.log((c?"  ✔ ":"  ✘ ")+t); if(!c) fallos++; };
const seccion=t=>console.log("\n"+t);

/* abre la página a una hora concreta (hora de Madrid del propio equipo) */
async function abrir(b,{hash="",hora="2026-09-21T13:06:00",movil=false,reloj="fijo",rutas,antes}={}){
  const ctx=await b.newContext({viewport:movil?{width:390,height:844}:{width:1280,height:900},hasTouch:movil,isMobile:movil});
  const p=await ctx.newPage();
  p.errores=[];
  p.on("pageerror",e=>p.errores.push(e.message));
  await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  if(rutas) await rutas(p);
  if(antes) await p.addInitScript(antes);
  if(reloj==="fijo") await p.clock.setFixedTime(new Date(hora)); else await p.clock.install({time:new Date(hora)});
  await p.goto(PAGINA+(hash?"#"+hash:""),{waitUntil:"load"});
  await p.waitForTimeout(reloj==="fijo"?900:50);
  return p;
}
/* JSONBin simulado: recuerda lo último que se escribe */
function nubeFalsa(inicial,modo,escrituras){
  return async p=>{
    let lecturas=0;
    await p.route("https://api.jsonbin.io/**",async r=>{
      if(r.request().method()==="PUT"){ escrituras.push(JSON.parse(r.request().postData())); return r.fulfill({status:200,body:"{}",contentType:"application/json"}); }
      lecturas++;
      if(modo==="falla"&&lecturas===1) return r.fulfill({status:503,body:"caída"});
      if(modo==="lenta"&&lecturas===1) await new Promise(x=>setTimeout(x,2500));
      const rec=escrituras.length?escrituras[escrituras.length-1]:inicial;
      return r.fulfill({status:200,contentType:"application/json",body:JSON.stringify({record:rec})});
    });
  };
}
const CONFIG_FALSA=()=>{ Object.defineProperty(window,"CONFIG",{value:{BIN_ID:"prueba",API_KEY:"prueba"},writable:false}); };

(async()=>{
  /* si la versión de Playwright no trae su navegador, se usa el Chromium del sistema */
  const b=await chromium.launch().catch(()=>chromium.launch({executablePath:process.env.CHROMIUM||"/opt/pw-browsers/chromium"}));

  seccion("Carga");
  for(const movil of [false,true]){
    const p=await abrir(b,{movil});
    const r=await p.evaluate(()=>({ancho:document.documentElement.scrollWidth,graves:REVISION.graves,avisos:REVISION.avisos.length,
      fallo:!document.getElementById("avisoFallo").hidden}));
    ok(!p.errores.length,`${movil?"móvil":"escritorio"}: sin errores de JavaScript ${p.errores.join(" | ")}`);
    ok(!r.graves.length&&!r.fallo,`${movil?"móvil":"escritorio"}: datos sin errores graves ${r.graves.join(" | ")}`);
    if(movil) ok(r.ancho<=390,`móvil: nada se sale de la pantalla (${r.ancho}px)`);
    if(r.avisos) console.log(`    (el comprobador deja ${r.avisos} avisos en la consola)`);
    await p.context().close();
  }

  seccion("Pestañas");
  {
    const p=await abrir(b,{hash:"horario"});
    for(const t of ["asignaturas","calendario","pendientes","profesorado","horario"]){
      await p.click(`nav.bar a[data-tab=${t}]`); await p.waitForTimeout(600);
      const r=await p.evaluate(()=>{ const on=document.querySelector("a[data-tab].on"), i=document.querySelector(".tab-ind").getBoundingClientRect(), a=on.getBoundingClientRect();
        return {tab:on.dataset.tab,dx:Math.abs(i.left-a.left),cur:on.getAttribute("aria-current")}; });
      ok(r.tab===t&&r.dx<2&&r.cur==="page",`${t}: activa, con la cápsula encima y aria-current`);
    }
    await p.context().close();
  }

  seccion("Hoy: línea roja y estado en vivo (lunes 21 sep)");
  for(const [hora,modo,texto] of [["08:12","arriba","empiezas en 48 min"],["10:36","","siguiente en 9 min"],["13:06","","quedan 54 min"],["16:40","abajo","día de clase terminado"]]){
    const p=await abrir(b,{hora:"2026-09-21T"+hora+":00"});
    const r=await p.evaluate(()=>({vivo:document.getElementById("todayVivo").textContent,clase:(document.querySelector(".barra-dia")||{}).className}));
    ok(r.vivo===texto&&r.clase==="barra-dia"+(modo?" "+modo:""),`${hora}: "${r.vivo}" (${r.clase})`);
    await p.context().close();
  }
  {
    const p=await abrir(b,{hora:"2026-09-21T12:28:50",reloj:"vivo"});
    await p.clock.runFor(72000);
    const r=await p.evaluate(()=>[document.querySelector(".r-hora").textContent.replace(/\s/g,""),document.getElementById("todayVivo").textContent,document.querySelectorAll(".trow.now").length]);
    ok(r[0]==="12:30"&&r[1]==="quedan 1 h 30 min"&&r[2]===1,`al cambiar el minuto se actualiza todo a la vez (${r.join(" · ")})`);
    await p.clock.setSystemTime(new Date("2026-09-21T23:59:50")); await p.clock.runFor(61000);
    ok(/Martes, 22/.test(await p.textContent("#todayName")),"a medianoche Hoy pasa al día siguiente");
    await p.context().close();
  }
  {
    const p=await abrir(b,{hora:"2026-12-01T08:00:00"});
    const r=await p.evaluate(()=>document.getElementById("countdown").textContent);
    ok(/semana 13/.test(r)&&!/en 4 días/.test(r),"las fechas sin día confirmado salen como \"semana N\", no con cuenta atrás");
    await p.context().close();
    const q=await abrir(b,{hora:"2026-10-27T10:00:00"});
    ok(/cierra el sábado/.test(await q.textContent("#countdown")),"una ventana de varios días sigue visible mientras está abierta");
    await q.context().close();
  }

  seccion("Nube (JSONBin simulado)");
  const REC={hechas:["gk_0","tk_is_0"],grades:{g_main_ed_0:"7"},notas:"notas antiguas"};
  for(const modo of ["falla","lenta","normal"]){
    const esc=[];
    const p=await abrir(b,{hash:"pendientes",rutas:nubeFalsa(REC,modo,esc),antes:CONFIG_FALSA});
    await p.locator("#checks input").nth(2).check();
    await p.waitForTimeout(5000);
    const u=esc[esc.length-1]||{};
    ok(u.notas==="notas antiguas"&&(u.hechas||[]).length===3&&u.grades&&u.grades["g_main_ed_parcial-1"]==="7",
      `primera lectura ${modo}: no se pierde nada y los ids viejos se traducen (${(u.hechas||[]).length} marcas)`);
    await p.context().close();
  }
  {
    const esc=[];
    const p=await abrir(b,{hash:"notas",rutas:nubeFalsa(REC,"falla",esc),antes:CONFIG_FALSA});
    ok(await p.evaluate(()=>document.getElementById("notasTxt").readOnly),"las notas no se pueden escribir hasta que llega lo guardado");
    await p.waitForTimeout(3000);
    ok(await p.inputValue("#notasTxt")==="notas antiguas","tras reintentar aparecen las notas guardadas");
    await p.goto(PAGINA+"#asignaturas"); await p.waitForTimeout(2500);
    const inp=p.locator('.g-input[data-scope=main][data-subj=ed]').nth(1);
    await inp.fill("7,5"); await inp.press("Tab"); await p.waitForTimeout(1500);
    ok(/Acumulado: 3.63/.test(await p.textContent("#res-main-ed")),"una nota con coma (7,5) cuenta como 7.5");
    await p.context().close();
  }

  seccion("Inicio");
  {
    const p=await abrir(b,{hash:"asignaturas"});
    await p.click(".home-btn"); await p.waitForTimeout(400);
    ok(await p.evaluate(()=>!document.getElementById("portal").hidden&&document.querySelector("nav.bar").inert),"el botón de inicio abre la ventana y bloquea lo de detrás");
    await p.keyboard.press("Escape"); await p.waitForTimeout(400);
    ok(await p.evaluate(()=>document.getElementById("portal").hidden&&location.hash==="#asignaturas"),"Escape la cierra y vuelves a la pestaña donde estabas");
    await p.goto(PAGINA+"#nolan"); await p.waitForTimeout(600);
    ok(await p.evaluate(()=>!document.getElementById("vistaNolan").hidden),"#nolan abre la sección Nolan");
    await p.context().close();
  }

  seccion("Móvil: deslizar entre pestañas");
  {
    const p=await abrir(b,{hash:"asignaturas",movil:true});
    const cdp=await p.context().newCDPSession(p);
    const deslizar=async(x1,x2,fin="touchEnd")=>{
      await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:x1,y:450}]});
      for(let k=1;k<=10;k++) await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:x1+(x2-x1)*k/10,y:450}]});
      await cdp.send("Input.dispatchTouchEvent",{type:fin,touchPoints:[]});
      await p.waitForTimeout(700);
      return p.evaluate(()=>document.querySelector("a[data-tab].on").dataset.tab);
    };
    ok(await deslizar(320,80)==="calendario","hacia la izquierda: pestaña siguiente");
    ok(await deslizar(80,320)==="asignaturas","hacia la derecha: pestaña anterior");
    await deslizar(300,180,"touchCancel");
    ok(await p.evaluate(()=>{ const w=document.querySelector("body > div.wrap"); return !w.style.transform&&!w.style.opacity; }),"un gesto cancelado deja todo en su sitio");
    await p.context().close();
  }

  seccion("Reposo");
  {
    const p=await abrir(b,{reloj:"vivo"});
    await p.clock.runFor(46000);
    ok(await p.evaluate(()=>document.body.classList.contains("reposo")),"a los 45 s sin tocar nada se paran los adornos");
    await p.mouse.click(100,400); await p.clock.runFor(100);
    ok(await p.evaluate(()=>!document.body.classList.contains("reposo")),"al tocar vuelven");
    await p.context().close();
  }

  await b.close();
  console.log(fallos?`\n${fallos} comprobaciones fallidas.`:"\nTodo en orden.");
  process.exit(fallos?1:0);
})();
