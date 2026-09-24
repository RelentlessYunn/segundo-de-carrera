/* ==========================================================
   shift.js — the passage between two looks. Changing Animations, Quality
   or the language reloads the page; instead of everything vanishing and
   popping back, the screen dives into a tunnel of stars (a jump to light
   speed), the page reloads behind it, and on the other side the stars
   slow down and the new look fades in.
   · Leaving: the overlay darkens and the stars speed up (≈1 s), then reload.
   · Arriving: <head> already covers the page (html.shifting) before anything
     is painted; the stars brake and the overlay fades away.
   · With Animations = None (before or after) or reduced motion in the
     system, there is no tunnel: only a soft fade to black and back.
   The fades are driven here, not by CSS transitions, so they also work
   when Animations = None switches every transition off.
   ========================================================== */
const Shift=(function(){
  const KEY="nolan-shift";
  const root=document.documentElement;
  const el=$("#shift"); if(!el) return {leave:()=>location.reload()};
  const cv=el.querySelector("canvas"), msg=el.querySelector(".shift-msg");
  let x=null, W=0, H=0, DPR=1, raf=0, speed=0, target=0, last=0, stars=[];
  /* no tunnel, just the fade: with Animations = None. Leaving, the look on screen
     still counts (html data-motion); arriving, the new one (lowMotion) */
  let still=()=>lowMotion();

  function setup(){
    DPR=Math.min(devicePixelRatio||1,2); W=innerWidth; H=innerHeight;
    cv.width=Math.round(W*DPR); cv.height=Math.round(H*DPR);
    x=cv.getContext("2d"); x.setTransform(DPR,0,0,DPR,0,0);
    if(!stars.length) for(let i=0;i<520;i++) stars.push(spawn(Math.random()));
  }
  /* a star in a tube around the line of flight (never right in the middle) */
  function spawn(z){
    const a=Math.random()*Math.PI*2, r=.06+Math.pow(Math.random(),.7)*1.1;
    return {x:Math.cos(a)*r, y:Math.sin(a)*r, z, t:Math.random()<.2?"190,210,255":Math.random()<.15?"255,226,200":"255,255,255"};
  }
  function frame(now){
    const dt=Math.min(.05,(now-last)/1000||.016); last=now;
    speed+=(target-speed)*Math.min(1,dt*2.4);
    x.globalCompositeOperation="source-over";
    x.fillStyle="#000"; x.fillRect(0,0,W,H);
    x.globalCompositeOperation="lighter";
    const cx=W/2, cy=H/2, F=Math.max(W,H)*.42;
    for(const s of stars){
      const z0=s.z; s.z-=speed*dt;
      if(s.z<=.02){ Object.assign(s,spawn(1)); continue; }
      /* the streak goes from where the star was to where it is: longer the faster we go */
      const k1=F/s.z, k0=F/Math.min(1.2,z0+speed*.035);
      const x1=cx+s.x*k1, y1=cy+s.y*k1, x0=cx+s.x*k0, y0=cy+s.y*k0;
      if(x1<-50||x1>W+50||y1<-50||y1>H+50) continue;
      const a=Math.min(1,(1-s.z)*1.3)*(.35+Math.min(.65,speed*.3));
      x.strokeStyle=`rgba(${s.t},${a.toFixed(3)})`;
      x.lineWidth=Math.min(2.2,.5+(1-s.z)*1.6);
      x.beginPath(); x.moveTo(x0,y0); x.lineTo(x1,y1); x.stroke();
    }
    /* a faint blue glow at the vanishing point, stronger at speed */
    const g=x.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H)*.35);
    g.addColorStop(0,`rgba(120,150,255,${(.05+speed*.035).toFixed(3)})`); g.addColorStop(1,"rgba(0,0,0,0)");
    x.fillStyle=g; x.fillRect(0,0,W,H);
    raf=requestAnimationFrame(frame);
  }
  function run(v0,v1){
    if(still()) return;
    setup(); speed=v0; target=v1; last=performance.now();
    cancelAnimationFrame(raf); raf=requestAnimationFrame(frame);
  }
  /* opacity over time, by hand (see above) */
  function fade(from,to,ms,done){
    const t0=Date.now(); let over=false;
    const end=()=>{ if(over) return; over=true; el.style.opacity=String(to); if(done) done(); };
    (function step(){
      if(over) return;
      const p=Math.min(1,(Date.now()-t0)/ms), e=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
      el.style.opacity=String(from+(to-from)*e);
      if(p<1) requestAnimationFrame(step); else end();
    })();
    /* frames can stop (a hidden tab): the timer makes sure it always ends */
    setTimeout(end,ms+150);
  }
  function label(key){ msg.textContent=t("shift."+key); }

  /* leaving: dive into the tunnel, then reload */
  let leaving=false;
  function leave(key){
    if(leaving) return;                                /* one passage at a time */
    leaving=true;
    still=()=>root.dataset.motion==="none"||systemReduced();
    try{ sessionStorage.setItem(KEY,key); }catch(e){}
    label(key);
    el.style.opacity="0"; el.classList.add("on");
    root.classList.add("shift-leaving");
    run(.12,2.6);
    /* the choice is saved already; if reloading takes a moment the stars keep flying */
    fade(0,1,still()?260:760,()=>setTimeout(()=>location.reload(),still()?40:260));
  }

  /* arriving: the stars brake, then the page appears */
  function arrive(){
    let key=null; try{ key=sessionStorage.getItem(KEY); sessionStorage.removeItem(KEY); }catch(e){}
    if(!root.classList.contains("shifting")) return;
    label(key||"motion");
    el.style.opacity="1"; el.classList.add("on");
    root.classList.remove("shifting");                 /* from here the overlay is ours */
    run(2.6,0);
    const go=()=>setTimeout(()=>fade(1,0,still()?320:900,()=>{
      el.classList.remove("on"); cancelAnimationFrame(raf); raf=0;
    }),still()?60:520);
    /* when the page has loaded, but never waiting more than 1.2 s (a slow font server, say) */
    let started=false; const once=()=>{ if(!started){ started=true; go(); } };
    if(document.readyState==="complete") once(); else { window.addEventListener("load",once,{once:true}); setTimeout(once,1200); }
  }
  arrive();
  return {leave};
})();
