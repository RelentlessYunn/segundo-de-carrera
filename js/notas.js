/* ==========================================================
   notas.js — "Notas para Claude": texto libre guardado en la nube.
   Hasta que llega lo guardado no se deja escribir, para no borrar lo que hubiera.
   Ojo: Claude no puede leer JSONBin por su cuenta; el botón "Copiar" sirve
   para pegarle las notas en el chat.
   ========================================================== */
(function(){
  const ta=$("#notasTxt"), est=$("#notasEstado"), copiar=$("#copiarNotas");
  const ejemplo=ta.placeholder;
  let cargada=!Nube.activa;
  if(Nube.activa){ ta.readOnly=true; ta.placeholder="Cargando tus notas…"; }

  Nube.alCargar(rec=>{
    /* al volver de otro dispositivo se actualiza, salvo si estás escribiendo */
    if(!cargada||document.activeElement!==ta) ta.value=rec.notas||"";
    cargada=true; ta.readOnly=false; ta.placeholder=ejemplo;
  });
  ta.addEventListener("input",()=>{
    if(!cargada) return;
    const texto=ta.value;
    Nube.cambiar("notas",rec=>{ rec.notas=texto; });
  });
  document.addEventListener("nube",e=>{ est.textContent=e.detail.texto; });

  copiar.addEventListener("click",async()=>{
    clearTimeout(copiar.__t);
    try{ await navigator.clipboard.writeText(ta.value); copiar.textContent="Copiadas"; }
    catch(e){ ta.select(); copiar.textContent="Selecciona y copia"; }
    copiar.__t=setTimeout(()=>{ copiar.textContent="Copiar notas"; },1600);
  });
})();
