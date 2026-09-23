/* ==========================================================
   cosmos.js — photographic pictures of galaxies and nebulae, computed
   pixel by pixel (no images to download), the way they look in Hubble and
   JWST photographs:
   · a small, very bright, warm core that falls off steeply (a de
     Vaucouleurs / Sérsic profile), not a soft blob;
   · a disk of diffuse light (exponential) that follows the spiral arms;
   · clumpy blue arms dotted with pink star-forming regions;
   · dark dust lanes that block the light on the inner edge of the arms
     (or right across the middle, seen edge-on);
   · a camera-like tone curve, so bright parts saturate softly;
   · see-through wherever it is dark, so it can sit over the starry sky.
   The work runs in background workers, so the page never freezes; if
   workers are not available it runs one picture at a time on the page.
   · Several workers share the work; a quick small version of each galaxy
     comes first, then the full one, sized for the screen.
   · Finished pictures are kept on the device (IndexedDB), so after the first
     visit they appear at once.
   Cosmos.galaxy(params, {preview, onPreview, priority}) and
   Cosmos.nebula(params) return promises. universe.js and sky.js use them.
   ========================================================== */
const Cosmos=(function(){
  /* everything the worker needs, as one plain function (it is also run
     directly when there is no worker) */
  function engine(){
    /* value noise and fractal noise, seeded */
    function makeNoise(seed){
      const P=new Uint8Array(512); let s=seed>>>0||1;
      const r=()=>{ s^=s<<13; s^=s>>>17; s^=s<<5; return (s>>>0)/4294967296; };
      const v=new Float32Array(256); for(let i=0;i<256;i++){ v[i]=r(); P[i]=i; }
      for(let i=255;i>0;i--){ const j=Math.floor(r()*(i+1)); const t=P[i]; P[i]=P[j]; P[j]=t; }
      for(let i=0;i<256;i++) P[i+256]=P[i];
      const sm=t=>t*t*(3-2*t);
      function n2(x,y){
        const xi=Math.floor(x), yi=Math.floor(y), xf=x-xi, yf=y-yi, X=xi&255, Y=yi&255;
        const a=v[P[P[X]+Y]], b=v[P[P[X+1]+Y]], c=v[P[P[X]+Y+1]], d=v[P[P[X+1]+Y+1]];
        const u=sm(xf), w=sm(yf);
        return a+(b-a)*u+(c-a)*w+(a-b-c+d)*u*w;
      }
      return function fbm(x,y,oct){
        let t=0, amp=.5, f=1, norm=0;
        for(let o=0;o<oct;o++){ t+=amp*n2(x*f+o*17.3,y*f-o*9.1); norm+=amp; amp*=.5; f*=2.03; }
        return t/norm;
      };
    }
    const rgb=h=>h.split(",").map(Number).map(c=>c/255);
    function hash(x,y,s){ let h=(x*374761393+y*668265263+s*982451653)|0; h=Math.imul(h^(h>>>13),1274126177); h^=h>>>16; return (h>>>0)/4294967296; }

    /* ---------- a galaxy ----------
       With p.split the picture comes in two layers, so the disk can turn while
       the bulge stays put (universe.js): "bulge" is the bulge alone, "disk" is
       everything else (the whole picture minus the bulge layer, after the tone
       curve, so both added together give exactly the full picture). The bulge
       layer is cropped to the square it needs ("crop": its side / the picture's). */
    function galaxy(p){
      const S=p.size, out=new Uint8ClampedArray(S*S*4);
      const fbm=makeNoise(p.seed), fbm2=makeNoise(p.seed*7+3);
      const ci=Math.max(Math.cos(p.tilt),.1), cr=Math.cos(-p.roll), sr=Math.sin(-p.roll);
      const core=rgb(p.core), arm=rgb(p.arm), disk=rgb(p.disk), knot=rgb(p.knot);
      const tanP=Math.tan(p.pitch||.35), m=p.arms||2;
      const exposure=p.exposure||2.2;
      const sn=p.sersic||2, bn=2*sn-.327;
      const I0=p.Ie?p.Ie*Math.exp(bn):p.bulge;                    /* centre brightness of the bulge */
      /* how far the bulge reaches before it is too faint to see: the size of its layer */
      let C=0, bulgeOut=null, off=0;
      if(p.split){
        const rbMax=Math.pow(Math.max(0,Math.log(Math.max(1.0001,I0*exposure/.002))/bn),sn);
        C=Math.min(S,Math.ceil(rbMax*p.bulgeR*1.05*S/2)*2+2); off=(S-C)>>1;
        bulgeOut=new Uint8ClampedArray(C*C*4);
      }
      const put=(buf,o,r8,g8,b8)=>{
        /* see-through where it is dark: the light is kept as colour × opacity, so
           empty space shows whatever is behind (the sky) instead of black */
        const al=Math.max(r8,g8,b8);
        if(al>.5){ const f=255/al; buf[o]=r8*f; buf[o+1]=g8*f; buf[o+2]=b8*f; buf[o+3]=al; }
      };
      const tone=v=>255*(1-Math.exp(-v*exposure));                /* like a camera: bright parts saturate softly */
      const diskFaint=p.disk0>0?.0015/(p.disk0*exposure):0;       /* below this exp(-r/h), the disk is invisible */
      for(let j=0;j<S;j++){
        for(let i=0;i<S;i++){
          /* picture coordinates → the galaxy's own plane */
          const u=(i+.5)/S*2-1, w=(j+.5)/S*2-1;
          const d2=u*u+w*w; if(d2>=1) continue;
          const a=u*cr-w*sr, b=u*sr+w*cr;            /* undo the roll */
          const X=a, Y=b/ci;                          /* undo the tilt */
          const r=Math.sqrt(X*X+Y*Y)+1e-6;
          const edge=1-d2*d2*d2;                      /* fades to nothing at the border */
          /* the bulge: a Sérsic profile (n=4 for ellipticals, ~2 for spiral bulges), slightly flattened */
          const rb=Math.sqrt(a*a+(b/p.bulgeQ)*(b/p.bulgeQ))/p.bulgeR;
          const Ib=I0*Math.exp(-bn*Math.pow(rb+1e-4,1/sn));
          /* the disk: exponential, with arms and clumps (skipped where it is too faint to matter) */
          let Id=0, armW=0, tau=0, Ik=0, Is=0;
          const ex=p.disk0>0?Math.exp(-r/p.h):0;
          if(ex>diskFaint||p.band){
            if(p.disk0>0){
              /* the arms start outside the bulge, so the centre is not a tight whorl */
              const th=Math.atan2(Y,X), lr=Math.log(Math.max(r,p.h*.45)/p.h);
              const n=fbm(X*2.6+5,Y*2.6+5,5);
              const phase=m*(th-lr/tanP)+(n-.5)*3.4;
              const inner=Math.min(1,Math.max(0,(r-p.h*.3)/(p.h*.6)));
              if(p.armAmp>0){
                armW=Math.pow(.5+.5*Math.cos(phase),2.2)*inner*inner*(3-2*inner);
                /* arms break up into clumps and spurs, like real ones (flocculent) */
                const fl=fbm(X*5.5+3,Y*5.5-7,4);
                armW*=Math.min(1.4,Math.max(.15,(fl-.28)*2.6));
              }
              const clump=.45+1.1*Math.pow(fbm(X*9,Y*9,4),1.3);
              Id=p.disk0*ex*((1-p.armAmp)+p.armAmp*armW*1.6)*clump;
              /* thickness seen edge-on: light hugs the mid-plane */
              if(p.thick) Id*=Math.exp(-Math.abs(b)/p.thick);
              /* star-forming knots: bright small spots on the arms */
              if(p.knots>0&&armW>.45){
                const k=fbm2(X*26,Y*26,3);
                if(k>.6) Ik=p.knots*1.2*Math.pow((k-.6)/.4,1.6)*Math.exp(-r/(p.h*1.6));
              }
              /* dust: on the inner edge of the arms, patchy */
              if(p.dust>0){
                const lane=Math.pow(.5+.5*Math.cos(phase+.9),6);
                tau=p.dust*lane*Math.exp(-r/(p.h*1.8))*(.4+1.2*fbm2(X*6+11,Y*6-4,4))*inner;   /* no lanes inside the bulge */
              }
            }
            /* Sombrero: a dark band straight across, seen edge-on */
            if(p.band) tau+=p.band*Math.exp(-Math.pow(b/p.bandW,2))*Math.min(1,Math.abs(a)/.12)*Math.exp(-Math.abs(a)/.95)*(.7+.6*fbm2(a*14,b*40,3));
          }
          const T=Math.exp(-tau);
          /* photographic grain: the disk is made of countless faint stars, not a smooth wash */
          if(Id>0){
            const sp=p.speck==null?.44:p.speck; Id*=1-sp/2+sp*hash(i+911,j+37,p.seed);
            if(hash(i,j,p.seed)>1-(p.grain||.01)*Math.min(1,Id*Id*4)) Is=.25+.8*hash(j,i,p.seed+5);
          }
          /* colours: warm core, arms bluer, diffuse disk in between, pink knots */
          const bt=p.band?T*.85+.15:1;
          const bR=Ib*core[0]*bt, bG=Ib*core[1]*bt, bB=Ib*core[2]*bt;
          const R=bR+Id*(disk[0]*(1-armW)+arm[0]*armW)*T+Ik*knot[0]*T+Is*(arm[0]*.6+.4)*(.35+.65*T);
          const G=bG+Id*(disk[1]*(1-armW)+arm[1]*armW)*T+Ik*knot[1]*T+Is*(arm[1]*.6+.4)*(.35+.65*T);
          const B=bB+Id*(disk[2]*(1-armW)+arm[2]*armW)*T+Ik*knot[2]*T+Is*(arm[2]*.6+.4)*(.35+.65*T);
          const r8=tone(R)*edge, g8=tone(G)*edge, b8=tone(B)*edge;
          if(bulgeOut){
            const bi=i-off, bj=j-off;
            if(bi>=0&&bj>=0&&bi<C&&bj<C){
              const q8=tone(bR)*edge, h8=tone(bG)*edge, z8=tone(bB)*edge;
              put(bulgeOut,(bj*C+bi)*4,q8,h8,z8);
              put(out,(j*S+i)*4,Math.max(0,r8-q8),Math.max(0,g8-h8),Math.max(0,b8-z8));
              continue;
            }
          }
          put(out,(j*S+i)*4,r8,g8,b8);
        }
      }
      return bulgeOut?{px:out,bpx:bulgeOut,C}:{px:out};
    }

    /* ---------- a nebula: faint glowing gas with darker dust in filaments ---------- */
    function nebula(p){
      const Wd=p.w, Ht=p.h, out=new Uint8ClampedArray(Wd*Ht*4);
      const f1=makeNoise(p.seed), f2=makeNoise(p.seed+101), f3=makeNoise(p.seed+202);
      const c1=rgb(p.c1), c2=rgb(p.c2), c3=rgb(p.c3);
      for(let j=0;j<Ht;j++) for(let i=0;i<Wd;i++){
        const x=i/Ht*2.2, y=j/Ht*2.2;
        /* domain warping: gives the wispy, torn look of real gas */
        const qx=f1(x+1.7,y+9.2,4), qy=f1(x+8.3,y+2.8,4);
        const gas=f2(x+2.2*qx,y+2.2*qy,6);
        const ridge=1-Math.abs(f3(x*1.6+qx,y*1.6+qy,5)*2-1);          /* thin bright filaments */
        const dust=Math.pow(f3(x*2.4+4,y*2.4-3,5),2.2);
        let e=Math.max(0,gas-.4)*2.6, fil=Math.pow(ridge,5)*.9*Math.max(0,gas-.28);
        e*=1-Math.min(.9,dust*1.4);
        const k=Math.max(0,Math.min(1,(qx-.3)*1.8));
        const R=(c1[0]*(1-k)+c2[0]*k)*e+c3[0]*fil, G=(c1[1]*(1-k)+c2[1]*k)*e+c3[1]*fil, B=(c1[2]*(1-k)+c2[2]*k)*e+c3[2]*fil;
        const o=(j*Wd+i)*4;
        out[o]=255*(1-Math.exp(-R*1.6)); out[o+1]=255*(1-Math.exp(-G*1.6)); out[o+2]=255*(1-Math.exp(-B*1.6));
        out[o+3]=Math.min(255,255*Math.max(out[o],out[o+1],out[o+2])/255*1.4);
      }
      return {px:out};
    }
    return {galaxy,nebula};
  }

  /* ---------- running it: a few workers, the most urgent jobs first ---------- */
  const VERSION="c52";                  /* change it when the pictures change: the saved ones are thrown away */
  const pool=[], queue=[];
  let jobs=0, local=null, localBusy=false;
  try{
    const src=URL.createObjectURL(new Blob([`const E=(${engine.toString()})();
      onmessage=e=>{ const out=E[e.data.type](e.data.p); const tr=[out.px.buffer]; if(out.bpx) tr.push(out.bpx.buffer); postMessage(out,tr); };`],{type:"text/javascript"}));
    const n=Math.max(1,Math.min(4,(navigator.hardwareConcurrency||2)-1));
    for(let i=0;i<n;i++){
      const w=new Worker(src); w.job=null;
      w.onmessage=e=>{ const j=w.job; w.job=null; j.done(e.data); pump(); };
      w.onerror=()=>{ pool.splice(pool.indexOf(w),1); if(w.job){ queue.push(w.job); w.job=null; } pump(); };
      pool.push(w);
    }
  }catch(e){}
  function pump(){
    queue.sort((a,b)=>a.pri-b.pri||a.n-b.n);
    for(const w of pool){ if(w.job||!queue.length) continue; w.job=queue.shift(); w.postMessage({type:w.job.type,p:w.job.p}); }
    /* no workers at all: on the page, one job at a time, between frames */
    if(!pool.length&&queue.length&&!localBusy){
      localBusy=true;
      setTimeout(()=>{ const j=queue.shift(); local=local||engine(); const out=local[j.type](j.p); localBusy=false; j.done(out); pump(); },30);
    }
  }
  const compute=(type,p,pri)=>new Promise(done=>{ queue.push({type,p,pri,n:++jobs,done}); pump(); });

  /* ---------- pictures ---------- */
  function canvasOf(px,w,h){
    const c=document.createElement("canvas"); c.width=w; c.height=h;
    c.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(px.buffer||px),w,h),0,0);
    return c;
  }
  /* galaxies go to the graphics card as one picture (an ImageBitmap): a plain
     canvas drawn much bigger than itself can be cut into strips by the browser */
  const bitmap=src=>window.createImageBitmap?createImageBitmap(src).catch(()=>src):Promise.resolve(src);
  const blobOf=c=>new Promise(res=>{ try{ c.toBlob(b=>res(b),"image/webp",.95); }catch(e){ res(null); } });

  /* ---------- kept on the device (IndexedDB), so the next visit is instant ---------- */
  const store=(function(){
    let db=null;
    const open=()=>db||(db=new Promise(res=>{
      try{
        const r=indexedDB.open("nolan-cosmos",1);
        r.onupgradeneeded=()=>{ r.result.createObjectStore("pics"); r.result.createObjectStore("used"); };
        r.onsuccess=()=>res(r.result); r.onerror=()=>res(null); r.onblocked=()=>res(null);
      }catch(e){ res(null); }
    }));
    const req=(name,mode,fn)=>open().then(d=>d&&new Promise(res=>{
      try{ const q=fn(d.transaction(name,mode).objectStore(name)); q.onsuccess=()=>res(q.result); q.onerror=()=>res(null); }catch(e){ res(null); }
    }));
    /* pictures not used for two weeks (other screen sizes, older versions) are removed */
    setTimeout(()=>open().then(d=>{ if(!d) return; try{
      const tx=d.transaction(["used","pics"],"readwrite"), used=tx.objectStore("used"), pics=tx.objectStore("pics");
      used.openCursor().onsuccess=e=>{ const c=e.target.result; if(!c) return;
        if(!String(c.key).startsWith(VERSION)||Date.now()-c.value>14*864e5){ pics.delete(c.key); c.delete(); } c.continue(); };
    }catch(e){} }),8000);
    return {
      get:k=>req("pics","readonly",s=>s.get(k)).then(v=>{ if(v) req("used","readwrite",s=>s.put(Date.now(),k)); return v||null; }),
      put:(k,v)=>req("pics","readwrite",s=>s.put(v,k)).then(()=>req("used","readwrite",s=>s.put(Date.now(),k)))
    };
  })();
  const later=fn=>(window.requestIdleCallback||setTimeout)(fn,{timeout:3000});

  /* a galaxy: {disk, bulge (or null), crop}. opt.preview (a size) paints a quick small
     version first and hands it to opt.onPreview; opt.priority orders the work */
  async function galaxy(p,opt={}){
    const key=VERSION+"g"+JSON.stringify(p);
    const hit=await store.get(key);
    if(hit&&hit.disk){
      try{ return {disk:await bitmap(hit.disk),bulge:hit.bulge?await bitmap(hit.bulge):null,crop:hit.crop}; }catch(e){}
    }
    const pri=opt.priority||0;
    if(opt.preview&&opt.onPreview&&opt.preview<p.size)
      compute("galaxy",{...p,size:opt.preview},pri-100).then(o=>pictures(o,opt.preview)).then(r=>opt.onPreview(r.pic));
    const r=await pictures(await compute("galaxy",p,pri),p.size);
    /* saved in the background, when the browser has nothing better to do */
    later(async()=>{ const d=await blobOf(r.c.disk), b=r.c.bulge?await blobOf(r.c.bulge):null; if(d) store.put(key,{disk:d,bulge:b,crop:r.pic.crop}); });
    return r.pic;
  }
  async function pictures(o,S){
    const c={disk:canvasOf(o.px,S,S),bulge:o.bpx?canvasOf(o.bpx,o.C,o.C):null};
    return {c,pic:{disk:await bitmap(c.disk),bulge:c.bulge?await bitmap(c.bulge):null,crop:o.C?o.C/S:0}};
  }
  /* a nebula: a canvas */
  async function nebula(p){
    const key=VERSION+"n"+JSON.stringify(p);
    const hit=await store.get(key);
    if(hit&&hit.disk){
      try{ const bm=await createImageBitmap(hit.disk), c=document.createElement("canvas"); c.width=p.w; c.height=p.h; c.getContext("2d").drawImage(bm,0,0); return c; }catch(e){}
    }
    const o=await compute("nebula",p,50), c=canvasOf(o.px,p.w,p.h);
    later(async()=>{ const d=await blobOf(c); if(d) store.put(key,{disk:d}); });
    return c;
  }
  return {galaxy,nebula};
})();
