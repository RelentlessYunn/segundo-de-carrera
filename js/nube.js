/* ==========================================================
   nube.js — guardado en JSONBin (tareas hechas, notas de examen, notas para Claude).
   Reglas, para no perder nunca nada:
   · Mientras la primera lectura no haya ido bien, no se escribe: se reintenta
     y lo que cambies espera en cola.
   · Se guarda por CAMBIOS (esta tarea hecha, esta nota), aplicados sobre una
     relectura fresca, así no se pisa lo que no has tocado ni lo de otro dispositivo.
   · Las escrituras van en fila, una detrás de otra.
   · Al cerrar o esconder la app se vacía lo pendiente.
   Uso desde otros archivos:
     Nube.alCargar(rec=>…)          se llama con los datos (y otra vez si se refrescan)
     Nube.cambiar("clave", rec=>…)  apunta un cambio; el último con la misma clave manda
   Aviso de estado: evento "nube" con {tipo, texto}.
   ========================================================== */
const Nube=(function(){
  const cfg=window.CONFIG||{}, ID=cfg.BIN_ID||"", KEY=cfg.API_KEY||"";
  const URL_BIN="https://api.jsonbin.io/v3/b/"+ID;
  const activa=!!(ID&&KEY);
  let registro=null, lista=false, reintento=2000, temporizador=null, ocultaDesde=0;
  let cola=Promise.resolve();
  const pendientes=new Map();      /* clave → función que aplica el cambio a un registro */
  const oyentes=[];
  const copia=o=>JSON.parse(JSON.stringify(o||{}));
  const estado=(tipo,texto)=>emitir("nube",{tipo,texto});
  const cabeceras={"X-Access-Key":KEY};

  async function leer(){
    const r=await fetch(URL_BIN+"/latest",{headers:cabeceras,cache:"no-store"});
    if(!r.ok) throw new Error("HTTP "+r.status);
    return (await r.json()).record||{};
  }
  /* lo leído más lo que aún está en cola: es lo que debe verse en pantalla */
  function repartir(rec){
    const vista=copia(rec); pendientes.forEach(fn=>fn(vista));
    oyentes.forEach(fn=>{ try{ fn(vista); }catch(e){ console.error(e); } });
  }

  function cargar(){
    if(!activa){ estado("off","Guardado desactivado: falta config.js."); return; }
    estado("cargando","Cargando…");
    leer().then(rec=>{
      registro=rec; lista=true; reintento=2000;
      repartir(rec);
      estado("ok","Sincronizado.");
      if(pendientes.size) programar();
    }).catch(()=>{
      estado("error",`Sin conexión con la nube. Reintento en ${Math.round(reintento/1000)} s; lo que cambies se guardará al conectar.`);
      setTimeout(cargar,reintento); reintento=Math.min(reintento*2,60000);
    });
  }
  /* al volver a la app tras un rato, se relee por si cambiaste algo en otro dispositivo */
  function refrescar(){
    leer().then(rec=>{ if(pendientes.size) return; registro=rec; repartir(rec); }).catch(()=>{});
  }

  function programar(){ clearTimeout(temporizador); temporizador=setTimeout(escribir,800); }
  function escribir(){
    if(!lista||!pendientes.size) return cola;
    const lote=new Map(pendientes); pendientes.clear();
    cola=cola.then(async()=>{
      try{
        const rec=await leer();
        lote.forEach(fn=>fn(rec));
        const r=await fetch(URL_BIN,{method:"PUT",headers:{...cabeceras,"Content-Type":"application/json"},body:JSON.stringify(rec)});
        if(!r.ok) throw new Error("HTTP "+r.status);
        registro=rec;
        estado(pendientes.size?"guardando":"ok",pendientes.size?"Guardando…":"Guardado.");
      }catch(e){
        /* vuelve a la cola, sin pisar un cambio más nuevo de la misma clave */
        lote.forEach((fn,k)=>{ if(!pendientes.has(k)) pendientes.set(k,fn); });
        estado("error","No se pudo guardar. Se reintentará.");
        setTimeout(programar,5000);
      }
    });
    return cola;
  }
  /* al esconder o cerrar la app no hay tiempo de releer: se escribe sobre la última copia */
  function vaciarAlSalir(){
    if(!lista||!pendientes.size||!registro) return;
    const rec=copia(registro); pendientes.forEach(fn=>fn(rec));
    try{
      fetch(URL_BIN,{method:"PUT",keepalive:true,headers:{...cabeceras,"Content-Type":"application/json"},body:JSON.stringify(rec)});
    }catch(e){}
  }
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden){ ocultaDesde=Date.now(); vaciarAlSalir(); }
    else if(lista&&Date.now()-ocultaDesde>60000) refrescar();
  });
  window.addEventListener("pagehide",vaciarAlSalir);

  /* se lee cuando ya han cargado todos los archivos y todos escuchan */
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",cargar); else setTimeout(cargar,0);
  return {
    activa,
    lista:()=>lista,
    alCargar(fn){ oyentes.push(fn); if(lista&&registro) fn((()=>{ const v=copia(registro); pendientes.forEach(f=>f(v)); return v; })()); },
    cambiar(clave,fn){
      pendientes.set(clave,fn);
      if(!activa) return;
      if(!lista){ estado("espera","Sin conexión: se guardará al conectar."); return; }
      estado("guardando","Guardando…"); programar();
    }
  };
})();
