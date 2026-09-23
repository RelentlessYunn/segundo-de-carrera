/* ==========================================================
   nolan.js — la sección Nolan.
   Está EN CONSTRUCCIÓN. Cuando lleguen las indicaciones, todo lo de Nolan
   va aquí (y su diseño en css/nolan.css); UC3M no hay que tocarlo.
   El inicio llama a Nolan.pintar(caja, subruta) al abrir #nolan
   (o #nolan/lo-que-sea, para cuando Nolan tenga varias páginas).
   ========================================================== */
const Nolan={
  titulo:"Nolan",
  enConstruccion:true,
  icono:`<svg class="i-grua" viewBox="0 0 48 48" aria-hidden="true">
    <path d="M12 44V10M16 44V12M12 40l4-4-4-4 4-4-4-4 4-4-4-4 4-4-4-4"/>
    <path d="M4 12h40M12 10 16 5l2 7M16 5 40 12"/>
    <rect class="f2" x="4.5" y="12.5" width="5" height="4.5" rx="1"/>
    <path d="M7 44h14"/>
    <g class="gancho"><path d="M34 12v13"/><rect class="f" x="30" y="25" width="8" height="6.5" rx="1"/></g></svg>`,
  pintar(caja,subruta){
    caja.innerHTML=`<span class="p-ic grande" style="--ac:#FFA640">${this.icono}</span>`+
      `<h2>${esc(this.titulo)}</h2>`+
      `<p>En construcción. Aquí irá lo que me indiques.</p>`+
      `<a class="p-volver" href="#home">← Volver al inicio</a>`;
  }
};
