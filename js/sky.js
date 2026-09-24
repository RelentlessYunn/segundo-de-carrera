/* ==========================================================
   sky.js — the sea of stars behind the whole page (#sky in index.html).
   · The stars are drawn once on canvases and used as background tiles,
     so the browser only moves images around: no drawing every frame.
   · Only used when the 3D universe (universe.js) cannot run (no WebGL2):
     then it draws the sky with CSS layers instead.
   · Layers: far dust, two sets of stars that twinkle out of step and a few
     bright stars with a soft bloom.
   · A film grain and a vignette give it a cinematic look.
   · With Animations = All: slow drift, twinkling, scroll parallax and a
     shooting star now and then. Basic and None leave the sky still, and
     Quality = Low leaves only a plain dark gradient.
   ========================================================== */
(function(){
  const sky=$("#sky"); if(!sky) return;
  if(SETTINGS.quality==="low") return;     /* low quality: a plain gradient, nothing to draw */
  if(SETTINGS.quality==="medium"){ simple(); return; }
  /* the 3D universe (universe.js) draws the whole sky itself: this one is only
     for devices without WebGL2 */
  if(document.documentElement.classList.contains("gl")) return;
  start();

  /* ---------- Quality = Medium: simple stars, drawn once ----------
     No galaxies and no moving layers: one still picture the size of the screen, with
     small stars in real colours, a few brighter ones, a faint band of the Milky Way
     and two or three very faint clouds of gas, so it still looks like deep space.
     Drawn again only if the screen changes size. */
  function simple(){
    const c=document.createElement("canvas"); c.className="sky-simple";
    sky.insertBefore(c,sky.firstChild);
    let w0=0,h0=0;
    function draw(){
      const W=innerWidth, H=innerHeight;
      if(Math.abs(W-w0)<60&&Math.abs(H-h0)<60&&w0) return;
      w0=W; h0=H;
      const DPR=Math.min(devicePixelRatio||1,2), x=c.getContext("2d");
      c.width=Math.round(W*DPR); c.height=Math.round(H*DPR); x.setTransform(DPR,0,0,DPR,0,0);
      let sd=20260924; const rnd=()=>{ sd=(sd*1664525+1013904223)%4294967296; return sd/4294967296; };
      const TINT=["255,255,255","255,250,242","226,234,255","205,220,255","255,236,214","255,214,184"];
      /* faint clouds of gas */
      [[.22,.3,"120,90,170"],[.78,.62,"150,80,110"],[.55,.12,"80,110,170"]].forEach(([fx,fy,col])=>{
        const R=Math.max(W,H)*(.35+rnd()*.2), g=x.createRadialGradient(W*fx,H*fy,0,W*fx,H*fy,R);
        g.addColorStop(0,`rgba(${col},.07)`); g.addColorStop(.5,`rgba(${col},.025)`); g.addColorStop(1,`rgba(${col},0)`);
        x.fillStyle=g; x.fillRect(0,0,W,H);
      });
      /* a faint band across the sky, where the stars crowd */
      const ang=-.5, cx=W*.5, cy=H*.45, ca=Math.cos(ang), sa=Math.sin(ang), band=Math.min(W,H)*.16;
      x.save(); x.translate(cx,cy); x.rotate(ang);
      const bg=x.createLinearGradient(0,-band*1.6,0,band*1.6);
      bg.addColorStop(0,"rgba(190,200,240,0)"); bg.addColorStop(.5,"rgba(190,200,240,.045)"); bg.addColorStop(1,"rgba(190,200,240,0)");
      x.fillStyle=bg; x.fillRect(-W*1.5,-band*1.6,W*3,band*3.2); x.restore();
      const star=(px,py,r,a,tint)=>{ x.fillStyle=`rgba(${tint},${a})`; x.beginPath(); x.arc(px,py,r,0,Math.PI*2); x.fill(); };
      const n=Math.round(W*H/1100);
      for(let i=0;i<n;i++){
        let px=rnd()*W, py=rnd()*H;
        if(i%3===0){ const u=(rnd()-.5)*W*1.6, v=(rnd()+rnd()+rnd()-1.5)*band*.8; px=cx+u*ca-v*sa; py=cy+u*sa+v*ca; }
        star(px,py,.35+Math.pow(rnd(),3)*.75,(.18+Math.pow(rnd(),2)*.7).toFixed(2),TINT[Math.floor(rnd()*TINT.length)]);
      }
      /* a few brighter ones, with a small soft glow */
      for(let i=0;i<Math.round(n/70);i++){
        const px=rnd()*W, py=rnd()*H, tint=TINT[Math.floor(rnd()*TINT.length)], R=4+rnd()*5;
        const g=x.createRadialGradient(px,py,0,px,py,R);
        g.addColorStop(0,`rgba(${tint},.5)`); g.addColorStop(.25,`rgba(${tint},.14)`); g.addColorStop(1,`rgba(${tint},0)`);
        x.fillStyle=g; x.beginPath(); x.arc(px,py,R,0,Math.PI*2); x.fill();
        star(px,py,.9+rnd()*.5,.95,"255,255,255");
      }
      c.classList.add("ready");
    }
    draw();
    let rz=0; window.addEventListener("resize",()=>{ clearTimeout(rz); rz=setTimeout(draw,250); });
  }

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
    if(!document.hidden&&fancy()&&!document.body.classList.contains("idle")){
      const m=document.createElement("i");
      m.className="meteor";
      /* anywhere on the screen, heading anywhere: it starts at a random point and
         flies towards another one, so each one crosses the sky differently */
      const W=innerWidth, H=innerHeight;
      const x0=W*(.05+Math.random()*.9), y0=H*(.05+Math.random()*.8);
      let x1=W*(.1+Math.random()*.8), y1=H*(.1+Math.random()*.8);
      if(Math.hypot(x1-x0,y1-y0)<Math.min(W,H)*.3){ x1=W-x0; y1=H-y0; }        /* not too short a trip */
      const ang=Math.atan2(y1-y0,x1-x0)*180/Math.PI;
      const dist=Math.min(Math.hypot(x1-x0,y1-y0),220+Math.random()*420);
      /* its head is its right end: place that end at the start point */
      const len=90+Math.random()*110;
      m.style.width=len+"px"; m.style.left=(x0-len)+"px"; m.style.top=y0+"px";
      m.style.setProperty("--a",ang.toFixed(1)+"deg");
      m.style.setProperty("--d",dist.toFixed(0)+"px");
      m.style.setProperty("--t",(.8+dist/700+Math.random()*.3).toFixed(2)+"s");
      m.addEventListener("animationend",()=>m.remove());
      meteors.appendChild(m);
    }
    setTimeout(meteor,5000+Math.random()*9000);
  }
  setTimeout(meteor,4000);
  }
})();
