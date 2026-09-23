/* ==========================================================
   sky.js — the sea of stars behind the whole page (#sky in index.html).
   · The stars are drawn once on canvases and used as background tiles,
     so the browser only moves images around: no drawing every frame.
   · Layers: far dust, two sets of stars that twinkle out of step, a few
     bright stars with a soft bloom, and a Milky Way band.
   · A film grain and a vignette give it a cinematic look.
   · With Animations = All: slow drift, twinkling, scroll parallax and a
     shooting star now and then. Basic and None leave the sky still, and
     Quality = Low leaves only a plain dark gradient.
   · Hidden with the light theme (the header keeps its own small sky).
   ========================================================== */
(function(){
  const sky=$("#sky"); if(!sky) return;
  if(!highQuality()) return;               /* low quality: a plain gradient, nothing to draw */
  /* with the light theme there is no sky: it is drawn the first time the dark one is shown */
  const isLight=()=>document.documentElement.dataset.theme==="light";
  if(isLight()){
    const later=()=>{ if(!isLight()){ document.removeEventListener("settings",later); start(); } };
    document.addEventListener("settings",later);
  } else start();
  function start(){
  const DPR=Math.min(window.devicePixelRatio||1,2);
  /* the same sky on every visit: a small seeded random generator */
  let seed=20260921;
  const rnd=()=>{ seed=(seed*1664525+1013904223)%4294967296; return seed/4294967296; };
  const pick=a=>a[Math.floor(rnd()*a.length)];
  /* real star colours, by temperature: mostly white, some blue-white, some warm */
  const TINTS=["255,255,255","255,255,255","255,252,245","228,236,255","206,222,255","255,240,220","255,222,190","255,204,170"];

  /* one tile of stars → object URL, set as the layer's background */
  function tile(size,count,{min,max,alpha,spikes=0}){
    const c=document.createElement("canvas"), x=c.getContext("2d");
    c.width=c.height=Math.round(size*DPR); x.scale(DPR,DPR);
    for(let i=0;i<count;i++){
      const px=rnd()*size, py=rnd()*size, r=min+Math.pow(rnd(),2.2)*(max-min), a=alpha[0]+rnd()*(alpha[1]-alpha[0]), tint=pick(TINTS);
      /* soft halo, then the core */
      const g=x.createRadialGradient(px,py,0,px,py,r*3.2);
      g.addColorStop(0,`rgba(${tint},${a})`); g.addColorStop(.35,`rgba(${tint},${a*.35})`); g.addColorStop(1,`rgba(${tint},0)`);
      x.fillStyle=g; x.beginPath(); x.arc(px,py,r*3.2,0,Math.PI*2); x.fill();
      x.fillStyle=`rgba(255,255,255,${Math.min(1,a+.15)})`; x.beginPath(); x.arc(px,py,r*.55,0,Math.PI*2); x.fill();
    }
    /* a few bright stars: a wide soft bloom and a tiny hot core, like through a lens */
    for(let i=0;i<spikes;i++){
      const px=rnd()*size, py=rnd()*size, R=6+rnd()*9, tint=pick(TINTS);
      const g=x.createRadialGradient(px,py,0,px,py,R);
      g.addColorStop(0,`rgba(${tint},.55)`); g.addColorStop(.12,`rgba(${tint},.22)`); g.addColorStop(.4,`rgba(${tint},.06)`); g.addColorStop(1,`rgba(${tint},0)`);
      x.fillStyle=g; x.beginPath(); x.arc(px,py,R,0,Math.PI*2); x.fill();
      x.fillStyle="rgba(255,255,255,.98)"; x.beginPath(); x.arc(px,py,1.1+rnd()*.6,0,Math.PI*2); x.fill();
    }
    return new Promise(res=>c.toBlob(b=>res(URL.createObjectURL(b))));
  }
  const LAYERS=[
    /* class,    tile, stars, sizes and brightness */
    ["l-dust",   520, 520, {min:.2, max:.55,alpha:[.12,.4]}],
    ["l-a",      760, 120, {min:.4, max:1.1,alpha:[.45,.9]}],
    ["l-b",      820, 120, {min:.4, max:1.1,alpha:[.45,.9]}],
    ["l-bright",1200,  30, {min:.7, max:1.5,alpha:[.6,1], spikes:9}]
  ];
  LAYERS.forEach(([cls,size,count,opt])=>{
    const el=sky.querySelector("."+cls); if(!el) return;
    el.style.setProperty("--tile",size+"px");
    tile(size,count,opt).then(url=>{ el.style.backgroundImage=`url(${url})`; el.classList.add("ready"); });
  });

  /* film grain: a small tile of noise, drawn once */
  const grain=sky.querySelector(".sky-grain");
  if(grain){
    const c=document.createElement("canvas"), x=c.getContext("2d"), N=160;
    c.width=c.height=N; const img=x.createImageData(N,N);
    for(let i=0;i<img.data.length;i+=4){ const v=Math.random()*255; img.data[i]=img.data[i+1]=img.data[i+2]=v; img.data[i+3]=255; }
    x.putImageData(img,0,0);
    c.toBlob(b=>{ grain.style.backgroundImage=`url(${URL.createObjectURL(b)})`; });
  }

  /* ---------- the Milky Way: a band across the screen, drawn at screen size ---------- */
  const milky=sky.querySelector(".sky-milky");   /* optional: no longer in index.html (universe.js draws the galaxies) */
  let drawnW=0, drawnH=0;
  function drawMilky(){
    if(!milky) return;
    const W=innerWidth, H=innerHeight+160;             /* a little taller, for the parallax */
    if(Math.abs(W-drawnW)<2&&Math.abs(H-drawnH)<140) return;   /* the phone's address bar is not a resize */
    drawnW=W; drawnH=H; seed=424242;
    milky.width=Math.round(W*DPR); milky.height=Math.round(H*DPR);
    milky.style.width=W+"px"; milky.style.height=H+"px";
    const x=milky.getContext("2d"); x.setTransform(DPR,0,0,DPR,0,0); x.clearRect(0,0,W,H);
    const D=Math.hypot(W,H);
    x.translate(W*.5,H*.42); x.rotate(-.42);
    /* soft glow along the band */
    [["215,215,230",.09,.34],["160,140,200",.06,.22],["110,150,165",.035,.14],["235,200,175",.045,.1]].forEach(([c,a,thick])=>{
      for(let i=0;i<9;i++){
        const px=(i/8-.5)*D*1.1+(rnd()-.5)*80, py=(rnd()-.5)*D*.05, r=D*thick*(.7+rnd()*.5);
        const g=x.createRadialGradient(px,py,0,px,py,r);
        g.addColorStop(0,`rgba(${c},${a})`); g.addColorStop(1,`rgba(${c},0)`);
        x.save(); x.translate(px,py); x.scale(1,.32); x.translate(-px,-py);
        x.fillStyle=g; x.beginPath(); x.arc(px,py,r,0,Math.PI*2); x.fill(); x.restore();
      }
    });
    /* thousands of faint stars packed around the middle of the band */
    const n=Math.round(Math.min(2600,D*1.3));
    for(let i=0;i<n;i++){
      const g=(rnd()+rnd()+rnd()-1.5)/1.5;            /* roughly bell-shaped */
      const px=(rnd()-.5)*D*1.1, py=g*D*.09, r=.25+Math.pow(rnd(),3)*1.1, a=.2+rnd()*.6;
      x.fillStyle=`rgba(${pick(TINTS)},${a})`; x.beginPath(); x.arc(px,py,r,0,Math.PI*2); x.fill();
    }
    /* a darker dust lane down the middle */
    x.globalCompositeOperation="destination-out";
    for(let i=0;i<14;i++){
      const px=(i/13-.5)*D*1.05, py=(rnd()-.5)*D*.02, r=D*(.04+rnd()*.05);
      const g=x.createRadialGradient(px,py,0,px,py,r);
      g.addColorStop(0,"rgba(0,0,0,.45)"); g.addColorStop(1,"rgba(0,0,0,0)");
      x.save(); x.translate(px,py); x.scale(1,.28); x.translate(-px,-py);
      x.fillStyle=g; x.beginPath(); x.arc(px,py,r,0,Math.PI*2); x.fill(); x.restore();
    }
    x.globalCompositeOperation="source-over";
    milky.classList.add("ready");
  }
  let rz=0;
  window.addEventListener("resize",()=>{ clearTimeout(rz); rz=setTimeout(drawMilky,250); });
  drawMilky();

  /* ---------- parallax: deeper layers move less when you scroll ---------- */
  const pars=$$("#sky [data-depth]");
  const canvas=$("body > div.wrap");
  let raf=0;
  function parallax(){
    raf=0;
    if(!fancy()){ pars.forEach(p=>p.style.transform=""); return; }
    const y=Math.max(window.scrollY,canvas?canvas.scrollTop:0);
    pars.forEach(p=>{
      const depth=+p.dataset.depth, tileSize=+p.dataset.tile||0;
      let off=y*depth;
      off=tileSize?off%tileSize:Math.min(off,150);          /* tiles repeat; the band has 150px to spare */
      p.style.transform=`translate3d(0,${-off.toFixed(1)}px,0)`;
    });
  }
  const onScroll=()=>{ if(!raf) raf=requestAnimationFrame(parallax); };
  window.addEventListener("scroll",onScroll,{passive:true});
  if(canvas) canvas.addEventListener("scroll",onScroll,{passive:true});

  /* ---------- shooting stars ---------- */
  const meteors=sky.querySelector(".sky-meteors");
  function meteor(){
    if(!document.hidden&&fancy()&&document.documentElement.dataset.theme!=="light"&&!document.body.classList.contains("idle")){
      const m=document.createElement("i");
      m.className="meteor";
      m.style.left=(20+Math.random()*75)+"%";
      m.style.top=(Math.random()*45)+"%";
      m.style.setProperty("--a",(140+Math.random()*25)+"deg");
      m.style.setProperty("--d",(260+Math.random()*320)+"px");
      m.style.setProperty("--t",(.9+Math.random()*.7)+"s");
      m.addEventListener("animationend",()=>m.remove());
      meteors.appendChild(m);
    }
    setTimeout(meteor,12000+Math.random()*18000);   /* rare, so they stay special */
  }
  setTimeout(meteor,4000);
  }
})();
