/* ==========================================================
   shift.js — the passage between two looks. Changing Animations, Quality
   or the language reloads the page; instead of everything vanishing and
   popping back, the screen fades softly to the colour of the night sky,
   the page reloads behind it and the new look fades in.
   · Leaving: a short fade (≈0.4 s), then reload.
   · Arriving: <head> already covers the page (html.shifting) before anything
     is painted; the cover fades away as soon as the page is ready, and never
     waits long: a galaxy still being built fades in by itself afterwards.
   The fades are driven here, not by CSS transitions, so they also work
   when Animations = None switches every transition off. They run on the
   compositor, so a busy page never makes them stutter; html.shift-dark tells
   the universe the screen is fully covered.
   ========================================================== */
const Shift=(function(){
  const KEY="nolan-shift";
  const root=document.documentElement;
  const el=$("#shift"); if(!el) return {leave:()=>location.reload()};
  /* shorter fades with Animations = None. Leaving, the look on screen still counts
     (html data-motion); arriving, the new one (lowMotion) */
  let still=()=>lowMotion();

  /* opacity over time, by hand (see above) */
  function fade(from,to,ms,done){
    const t0=Date.now(); let over=false, anim=null;
    const end=()=>{ if(over) return; over=true; el.style.opacity=String(to); if(anim) anim.cancel(); if(done) done(); };
    /* on the compositor when possible (Web Animations, which Animations = None leaves alone):
       it keeps its pace even while the page behind is busy starting */
    if(el.animate){
      try{
        anim=el.animate([{opacity:from},{opacity:to}],{duration:ms,easing:"cubic-bezier(.4,0,.2,1)",fill:"forwards"});
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

  /* leaving: a soft fade to the night sky, then reload */
  let leaving=false;
  function leave(key){
    if(leaving) return;                                /* one passage at a time */
    leaving=true;
    still=()=>root.dataset.motion==="none"||systemReduced();
    try{ sessionStorage.setItem(KEY,key); }catch(e){}
    el.style.opacity="0"; el.classList.add("on");
    root.classList.add("shift-leaving");
    fade(0,1,still()?160:380,()=>{
      root.classList.add("shift-dark");                /* the page is hidden now: the universe stops drawing */
      location.reload();
    });
  }

  /* arriving: the cover stays while the page gets ready behind (the universe drawn, the
     saved data read, the font in), then fades away. It never waits long: at most 2.5 s */
  function arrive(){
    try{ sessionStorage.removeItem(KEY); }catch(e){}
    if(!root.classList.contains("shifting")) return;
    el.style.opacity="1"; el.classList.add("on");
    root.classList.add("shift-arriving","shift-dark");  /* the others know nobody sees the page yet */
    root.classList.remove("shifting");                 /* from here the cover is ours */
    const t0=performance.now(), since=()=>performance.now()-t0;
    const settled=()=>{
      if(since()>2500) return true;
      if(document.readyState!=="complete") return false;
      if(typeof Universe!=="undefined"&&!Universe.ready()) return false;
      if(typeof Cloud!=="undefined"&&Cloud.enabled&&!Cloud.ready()&&since()<1500) return false;
      if(document.fonts&&document.fonts.status==="loading"&&since()<1500) return false;
      return true;
    };
    const open=()=>{
      root.classList.remove("shift-dark");               /* the universe moves again, under the cover */
      /* two more frames, so the last drawing is on the screen, then the fade */
      let started=false;
      const f=()=>{ if(started) return; started=true;
        fade(1,0,still()?220:600,()=>{ el.classList.remove("on"); root.classList.remove("shift-arriving"); }); };
      requestAnimationFrame(()=>requestAnimationFrame(f));
      setTimeout(f,150);                                 /* (a hidden tab has no frames) */
    };
    (function wait(){ if(settled()) open(); else setTimeout(wait,50); })();
  }
  arrive();
  return {leave};
})();
