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
   when Animations = None switches every transition off. The tunnel runs in a
   worker and the fades on the compositor, so a busy page never makes them
   stutter; html.shift-dark tells the universe the screen is fully covered.
   ========================================================== */
const Shift=(function(){
  const KEY="nolan-shift";
  const root=document.documentElement;
  const el=$("#shift"); if(!el) return {leave:()=>location.reload()};
  const cv=el.querySelector("canvas"), msg=el.querySelector(".shift-msg");
  /* no tunnel, just the fade: with Animations = None. Leaving, the look on screen
     still counts (html data-motion); arriving, the new one (lowMotion) */
  let still=()=>lowMotion();

  /* the tunnel itself: a star field that streaks as it speeds up. It runs in a background
     worker drawing straight to the canvas when the browser allows it (OffscreenCanvas), so
     the heavy start of the page behind (scripts, the universe being built) cannot make it
     stutter; otherwise on the page. */
  function tunnel(){
    let x=null, W=0, H=0, raf=0, speed=0, target=0, last=0;
    const stars=[], BATCH=12;
    const tick=typeof requestAnimationFrame==="function"?requestAnimationFrame:f=>setTimeout(()=>f(performance.now()),16);
    const untick=typeof cancelAnimationFrame==="function"?cancelAnimationFrame:clearTimeout;
    /* a star in a tube around the line of flight (never right in the middle) */
    function spawn(z){
      const a=Math.random()*Math.PI*2, r=.06+Math.pow(Math.random(),.7)*1.1;
      return {x:Math.cos(a)*r, y:Math.sin(a)*r, z, t:Math.random()<.2?1:Math.random()<.15?2:0};
    }
    const TINTS=["255,255,255","190,210,255","255,226,200"];
    /* streaks are drawn in batches sharing a colour, a brightness and a width: a few dozen
       strokes a frame instead of one per star */
    const paths=[];
    function frame(now){
      raf=0;
      const dt=Math.min(.05,(now-last)/1000||.016); last=now;
      speed+=(target-speed)*Math.min(1,dt*2.4);
      x.globalCompositeOperation="source-over";
      x.fillStyle="#000"; x.fillRect(0,0,W,H);
      x.globalCompositeOperation="lighter";
      const cx=W/2, cy=H/2, F=Math.max(W,H)*.42, sa=.35+Math.min(.65,speed*.3);
      for(const p of paths) if(p) p.length=0;
      for(const s of stars){
        const z0=s.z; s.z-=speed*dt;
        if(s.z<=.02){ Object.assign(s,spawn(1)); continue; }
        /* the streak goes from where the star was to where it is: longer the faster we go */
        const k1=F/s.z, k0=F/Math.min(1.2,z0+speed*.035);
        const x1=cx+s.x*k1, y1=cy+s.y*k1;
        if(x1<-50||x1>W+50||y1<-50||y1>H+50) continue;
        const near=1-s.z, a=Math.min(1,near*1.3), w=Math.min(3,Math.floor(near*4));
        const key=(s.t*BATCH+Math.min(BATCH-1,Math.floor(a*BATCH)))*4+w;
        const p=paths[key]||(paths[key]=[]);
        p.push(cx+s.x*k0,cy+s.y*k0,x1,y1);
      }
      for(let key=0;key<paths.length;key++){
        const p=paths[key]; if(!p||!p.length) continue;
        const w=key%4, a=(Math.floor(key/4)%BATCH+.5)/BATCH, t=Math.floor(key/4/BATCH);
        x.strokeStyle=`rgba(${TINTS[t]},${(Math.min(1,a)*sa).toFixed(3)})`;
        x.lineWidth=Math.min(2.2,.5+(w+.5)/4*1.6);
        x.beginPath();
        for(let i=0;i<p.length;i+=4){ x.moveTo(p[i],p[i+1]); x.lineTo(p[i+2],p[i+3]); }
        x.stroke();
      }
      /* a faint blue glow at the vanishing point, stronger at speed */
      const g=x.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H)*.35);
      g.addColorStop(0,`rgba(120,150,255,${(.05+speed*.035).toFixed(3)})`); g.addColorStop(1,"rgba(0,0,0,0)");
      x.fillStyle=g; x.fillRect(0,0,W,H);
      raf=tick(frame);
    }
    return {
      start(canvas,w,h,dpr,v0,v1){
        W=w; H=h; canvas.width=Math.round(W*dpr); canvas.height=Math.round(H*dpr);
        x=canvas.getContext("2d",{alpha:false}); x.setTransform(dpr,0,0,dpr,0,0);
        if(!stars.length) for(let i=0;i<520;i++) stars.push(spawn(Math.random()));
        speed=v0; target=v1; last=performance.now();
        if(raf) untick(raf); frame(last);               /* the first picture at once: never a black screen */
      },
      stop(){ if(raf) untick(raf); raf=0; }
    };
  }
  /* in a worker if possible (the canvas can be handed over only once, so it is kept) */
  const painter=(function(){
    if(cv.transferControlToOffscreen&&typeof Worker!=="undefined"&&typeof OffscreenCanvas!=="undefined"){
      try{
        const src=`const T=(${tunnel.toString()})(); let c=null;
          onmessage=e=>{ const m=e.data; if(m.canvas) c=m.canvas; if(m.go) T.start(c,m.w,m.h,m.dpr,m.v0,m.v1); if(m.stop) T.stop(); };`;
        const w=new Worker(URL.createObjectURL(new Blob([src],{type:"text/javascript"})));
        const off=cv.transferControlToOffscreen();
        w.postMessage({canvas:off},[off]);
        return {start:(wd,h,dpr,v0,v1)=>w.postMessage({go:1,w:wd,h,dpr,v0,v1}), stop:()=>w.postMessage({stop:1})};
      }catch(e){}
    }
    const T=tunnel();
    return {start:(wd,h,dpr,v0,v1)=>T.start(cv,wd,h,dpr,v0,v1), stop:()=>T.stop()};
  })();
  function run(v0,v1){
    if(still()) return;
    painter.start(innerWidth,innerHeight,Math.min(devicePixelRatio||1,2),v0,v1);
  }
  /* opacity over time, by hand (see above) */
  function fade(from,to,ms,done){
    const t0=Date.now(); let over=false, anim=null;
    const end=()=>{ if(over) return; over=true; el.style.opacity=String(to); if(anim) anim.cancel(); if(done) done(); };
    /* on the compositor when possible (Web Animations, which Animations = None leaves alone):
       it keeps its pace even while the page behind is busy starting */
    if(el.animate){
      try{
        anim=el.animate([{opacity:from},{opacity:to}],{duration:ms,easing:"cubic-bezier(.45,0,.55,1)",fill:"forwards"});
        anim.onfinish=end;
        setTimeout(end,ms+150);
        return;
      }catch(e){ anim=null; }
    }
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
    fade(0,1,still()?260:760,()=>{
      root.classList.add("shift-dark");                /* the page is hidden now: the universe stops drawing */
      setTimeout(()=>location.reload(),still()?40:260);
    });
  }

  /* arriving: the stars slow down to a drift while the page gets ready behind; only when
     everything is in place (the universe built and drawn, the saved data read, the font
     in) does the page appear, so nothing changes after the passage has opened.
     Never more than 9 s, whatever happens. */
  function arrive(){
    let key=null; try{ key=sessionStorage.getItem(KEY); sessionStorage.removeItem(KEY); }catch(e){}
    if(!root.classList.contains("shifting")) return;
    label(key||"motion");
    el.style.opacity="1"; el.classList.add("on");
    root.classList.add("shift-arriving","shift-dark");  /* the others know nobody sees the page yet */
    root.classList.remove("shifting");                 /* from here the overlay is ours */
    run(2.6,.4);
    const t0=performance.now(), since=()=>performance.now()-t0;
    const settled=()=>{
      if(since()>9000) return true;
      if(document.readyState!=="complete") return false;
      if(typeof Universe!=="undefined"&&!Universe.ready()) return false;
      if(typeof Cloud!=="undefined"&&Cloud.enabled&&!Cloud.ready()&&since()<4000) return false;
      if(document.fonts&&document.fonts.status==="loading"&&since()<4000) return false;
      return since()>(still()?150:900);                 /* the stars get to slow down first */
    };
    const open=()=>{
      root.classList.remove("shift-dark");               /* the universe moves again, under the passage */
      /* two more frames, so the last drawing is on the screen, then the fade */
      let started=false;
      const f=()=>{ if(started) return; started=true;
        fade(1,0,still()?320:900,()=>{ el.classList.remove("on"); painter.stop(); root.classList.remove("shift-arriving"); }); };
      requestAnimationFrame(()=>requestAnimationFrame(f));
      setTimeout(f,150);                                 /* (a hidden tab has no frames) */
    };
    (function wait(){ if(settled()) open(); else setTimeout(wait,80); })();
  }
  arrive();
  return {leave};
})();
