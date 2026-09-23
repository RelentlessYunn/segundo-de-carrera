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
   The work runs in a background worker, so the page never freezes; if
   workers are not available it runs a little at a time on the page.
   Cosmos.galaxy(params) and Cosmos.nebula(params) return promises of a
   canvas. universe.js and sky.js use them.
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

    /* ---------- a galaxy ---------- */
    function galaxy(p){
      const S=p.size, out=new Uint8ClampedArray(S*S*4);
      const fbm=makeNoise(p.seed), fbm2=makeNoise(p.seed*7+3);
      const ci=Math.max(Math.cos(p.tilt),.1), cr=Math.cos(-p.roll), sr=Math.sin(-p.roll);
      const core=rgb(p.core), arm=rgb(p.arm), disk=rgb(p.disk), knot=rgb(p.knot);
      const tanP=Math.tan(p.pitch||.35), m=p.arms||2;
      const exposure=p.exposure||2.2;
      for(let j=0;j<S;j++){
        for(let i=0;i<S;i++){
          /* picture coordinates → the galaxy's own plane */
          const u=(i+.5)/S*2-1, w=(j+.5)/S*2-1;
          const a=u*cr-w*sr, b=u*sr+w*cr;            /* undo the roll */
          const X=a, Y=b/ci;                          /* undo the tilt */
          const r=Math.sqrt(X*X+Y*Y)+1e-6;
          const edge=Math.max(0,1-Math.pow(Math.sqrt(u*u+w*w),6));   /* fades to nothing at the border */
          let R=0,G=0,B=0;
          /* the bulge: a Sérsic profile (n=4 for ellipticals, ~2 for spiral bulges), slightly flattened */
          const rb=Math.sqrt(a*a+(b/p.bulgeQ)*(b/p.bulgeQ))/p.bulgeR, sn=p.sersic||2, bn=2*sn-.327;
          /* Ie: brightness at the half-light radius (ellipticals); otherwise the centre brightness */
          const Ib=p.Ie?p.Ie*Math.exp(-bn*(Math.pow(rb+1e-4,1/sn)-1)):p.bulge*Math.exp(-bn*Math.pow(rb+1e-4,1/sn));
          /* the disk: exponential, with arms and clumps */
          let Id=0, armW=0, tau=0, Ik=0, Is=0;
          if(p.disk0>0){
            /* the arms start outside the bulge, so the centre is not a tight whorl */
            const th=Math.atan2(Y,X), lr=Math.log(Math.max(r,p.h*.45)/p.h);
            const n=fbm(X*2.6+5,Y*2.6+5,5);
            const phase=m*(th-lr/tanP)+(n-.5)*3.4;
            const inner=Math.min(1,Math.max(0,(r-p.h*.3)/(p.h*.6)));
            armW=p.armAmp>0?Math.pow(.5+.5*Math.cos(phase),2.2)*inner*inner*(3-2*inner):0;
            /* arms break up into clumps and spurs, like real ones (flocculent) */
            const fl=fbm(X*5.5+3,Y*5.5-7,4);
            armW*=Math.min(1.4,Math.max(.15,(fl-.28)*2.6));
            const clump=.45+1.1*Math.pow(fbm(X*9,Y*9,4),1.3);
            Id=p.disk0*Math.exp(-r/p.h)*((1-p.armAmp)+p.armAmp*armW*1.6)*clump;
            /* thickness seen edge-on: light hugs the mid-plane */
            if(p.thick) Id*=Math.exp(-Math.abs(b)/p.thick);
            /* star-forming knots: bright small spots on the arms */
            const k=fbm2(X*26,Y*26,3);
            if(p.knots>0&&armW>.45&&k>.6) Ik=p.knots*1.2*Math.pow((k-.6)/.4,1.6)*Math.exp(-r/(p.h*1.6));
            /* dust: on the inner edge of the arms, patchy */
            if(p.dust>0){
              const lane=Math.pow(.5+.5*Math.cos(phase+.9),6);
              tau=p.dust*lane*Math.exp(-r/(p.h*1.8))*(.4+1.2*fbm2(X*6+11,Y*6-4,4))*inner;   /* no lanes inside the bulge */
            }
          }
          /* Sombrero: a dark band straight across, seen edge-on */
          if(p.band) tau+=p.band*Math.exp(-Math.pow(b/p.bandW,2))*Math.min(1,Math.abs(a)/.12)*Math.exp(-Math.abs(a)/.95)*(.7+.6*fbm2(a*14,b*40,3));
          const T=Math.exp(-tau);
          /* photographic grain: the disk is made of countless faint stars, not a smooth wash */
          const hs=hash(i,j,p.seed);
          if(Id>0){
            const sp=p.speck==null?.44:p.speck; Id*=1-sp/2+sp*hash(i+911,j+37,p.seed);
            if(hs>1-(p.grain||.01)*Math.min(1,Id*Id*4)) Is=.25+.8*hash(j,i,p.seed+5);
          }
          /* colours: warm core, arms bluer, diffuse disk in between, pink knots */
          R=Ib*core[0]*(p.band?T*.85+.15:1)+Id*(disk[0]*(1-armW)+arm[0]*armW)*T+Ik*knot[0]*T+Is*(arm[0]*.6+.4)*(.35+.65*T);
          G=Ib*core[1]*(p.band?T*.85+.15:1)+Id*(disk[1]*(1-armW)+arm[1]*armW)*T+Ik*knot[1]*T+Is*(arm[1]*.6+.4)*(.35+.65*T);
          B=Ib*core[2]*(p.band?T*.85+.15:1)+Id*(disk[2]*(1-armW)+arm[2]*armW)*T+Ik*knot[2]*T+Is*(arm[2]*.6+.4)*(.35+.65*T);
          /* like a camera: bright parts saturate softly */
          const o=(j*S+i)*4;
          const r8=255*(1-Math.exp(-R*exposure))*edge, g8=255*(1-Math.exp(-G*exposure))*edge, b8=255*(1-Math.exp(-B*exposure))*edge;
          /* see-through where it is dark: the light is kept as colour × opacity, so
             empty space shows whatever is behind (the sky) instead of black */
          const al=Math.max(r8,g8,b8);
          if(al>0){ const f=255/al; out[o]=r8*f; out[o+1]=g8*f; out[o+2]=b8*f; out[o+3]=al; }
        }
      }
      return out;
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
      return out;
    }
    return {galaxy,nebula};
  }

  /* ---------- running it: a worker if possible ---------- */
  let worker=null, jobs=0;
  const waiting=new Map();
  try{
    const src=`const E=(${engine.toString()})();
      onmessage=e=>{ const {id,type,p}=e.data; const px=E[type](p); postMessage({id,px},[px.buffer]); };`;
    worker=new Worker(URL.createObjectURL(new Blob([src],{type:"text/javascript"})));
    worker.onmessage=e=>{ const cb=waiting.get(e.data.id); waiting.delete(e.data.id); if(cb) cb(e.data.px); };
    worker.onerror=()=>{ worker=null; };
  }catch(e){ worker=null; }
  let local=null;
  function run(type,p,w,h){
    return new Promise(res=>{
      const done=px=>{
        const c=document.createElement("canvas"); c.width=w; c.height=h;
        c.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(px),w,h),0,0);
        res(c);
      };
      if(worker){ const id=++jobs; waiting.set(id,done); worker.postMessage({id,type,p}); }
      else setTimeout(()=>{ local=local||engine(); done(local[type](p)); },30);
    });
  }
  return {
    galaxy:p=>run("galaxy",p,p.size,p.size),
    nebula:p=>run("nebula",p,p.w,p.h)
  };
})();
