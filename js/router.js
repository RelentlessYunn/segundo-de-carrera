/* ==========================================================
   router.js — routes and tabs.
   · #schedule, #subjects, #exams, #tasks, #faculty: UC3M tabs
   · #home, #notes, #settings, #blackhole and #nolan (or #nolan/…): the home screen
     and its pages (home.js); an
     address without a route (the app's start) also opens home
   · #debug: debug panel (debug.js); it does not change tab
   Old Spanish links (#horario, #asignaturas…) still work.
   On mobile you can also switch tabs by swiping.
   ========================================================== */
const Router=(function(){
  /* the weekly timetable and the monthly planner share a tab */
  const TABS={
    schedule:["today","schedule","planner"], subjects:["subjects"],
    exams:["exams"], tasks:["tasks"], faculty:["faculty"]
  };
  const PAGES=[];                                  /* pages without a tab (notes and settings now live in home) */
  const ALIASES={horario:"schedule",hoy:"schedule",planificador:"schedule",asignaturas:"subjects",
    calendario:"exams",pendientes:"tasks",profesorado:"faculty",notas:"notes",configuracion:"settings",ajustes:"settings"};
  const order=Object.keys(TABS);
  const links=$$("nav.bar a[data-tab]");
  const sections=[...Object.values(TABS).flat(),...PAGES].map(id=>document.getElementById(id)).filter(Boolean);
  const canvas=$("body > div.wrap");
  const isMobile=()=>matchMedia("(max-width:820px)").matches;
  let current="schedule", last="schedule", shownOnce=false;

  /* ---------- the coloured pill that travels to the active tab ---------- */
  const bar=$("nav.bar .tabs");
  function pill(){
    const on=bar.querySelector("a[data-tab].on");
    bar.classList.toggle("no-pill",!on);
    if(!on) return;
    bar.style.setProperty("--x",on.offsetLeft+"px");
    bar.style.setProperty("--w",on.offsetWidth+"px");
    bar.style.setProperty("--cx",(on.offsetLeft+on.offsetWidth/2)+"px");
    bar.style.setProperty("--ac-on",on.style.getPropertyValue("--ac"));
  }
  window.addEventListener("resize",pill);
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(pill);
  /* the first placement is not animated: the pill appears already in place */
  requestAnimationFrame(()=>requestAnimationFrame(()=>bar.classList.add("ready")));

  const toTop=()=>{ canvas.scrollTop=0; window.scrollTo({top:0,behavior:"instant"}); };

  /* ---------- show a tab or page ---------- */
  function show(tab,opts){
    opts=opts||{};
    if(!PAGES.includes(tab)&&!TABS[tab]) tab="schedule";
    const visible=PAGES.includes(tab)?[tab]:TABS[tab];
    sections.forEach(el=>{ el.hidden=!visible.includes(el.id); });
    links.forEach(l=>{
      const on=l.dataset.tab===tab;
      l.classList.toggle("on",on);
      if(on) l.setAttribute("aria-current","page"); else l.removeAttribute("aria-current");
    });
    current=tab; shownOnce=true; if(!PAGES.includes(tab)) last=tab;
    pill();
    /* staggered entrance only on desktop: on mobile swiping is the animation */
    if(!isMobile()&&!opts.quiet&&!lowMotion()){
      const secs=visible.map(id=>document.getElementById(id)).filter(Boolean);
      const kids=secs.flatMap(el=>[...el.children]);
      secs.forEach(el=>el.classList.remove("enter"));
      kids.forEach(k=>k.classList.remove("stagger"));
      void document.body.offsetWidth;            /* a single restart for all of them */
      secs.forEach(el=>el.classList.add("enter"));
      kids.forEach((k,i)=>{ k.style.setProperty("--d",(Math.min(i,8)*55)+"ms"); k.classList.add("stagger"); });
    }
    if(opts.scroll!==false){ toTop(); requestAnimationFrame(toTop); }
    emit("tab",tab);
  }

  /* ---------- routes ---------- */
  const isHome=r=>r==="home"||r==="notes"||r==="settings"||r==="blackhole"||r==="nolan"||r.startsWith("nolan/")||r.startsWith("soon/");
  function handle(){
    let r=decodeURIComponent(location.hash.slice(1));
    if(r.includes("debug")) return;                    /* handled by debug.js */
    if(!r) r="home";                                   /* the app always starts at home */
    if(ALIASES[r]){ r=ALIASES[r]; history.replaceState(null,"","#"+r); }
    if(isHome(r)){
      if(!shownOnce) show(last,{quiet:true});          /* behind home, the last tab */
      const [view,...sub]=r.split("/"); Home.open(view,sub.join("/"),last); return;
    }
    Home.close();
    if(ALIASES[r]) r=ALIASES[r];
    const tab=PAGES.includes(r)||TABS[r]?r:"schedule";
    if("#"+tab!==location.hash&&location.hash) history.replaceState(null,"","#"+tab);   /* old or unknown links */
    show(tab);
  }
  /* go to a tab without filling the history (Back does not walk through tabs) */
  function goTo(tab){
    history.replaceState(null,"","#"+tab);
    Home.close();
    show(tab);
  }
  window.addEventListener("hashchange",handle);

  links.forEach(l=>l.addEventListener("click",ev=>{
    ev.preventDefault();
    if(leaving){ leaving.cancel(); leaving=null; }         /* a tap wins over a half-done swipe */
    const before=order.indexOf(current), after=order.indexOf(l.dataset.tab);
    goTo(l.dataset.tab);
    if(isMobile()&&before>=0&&after!==before) enter(after>before?-1:1);
  }));
  /* the UC3M card on home takes you back to the tab you were on */
  $("#homeUc3m").addEventListener("click",ev=>{ ev.preventDefault(); Home.enter(ev.currentTarget,()=>goTo(last)); });
  /* Escape: closes home or whichever detail panel is open */
  document.addEventListener("keydown",ev=>{
    if(ev.key!=="Escape") return;
    if(Home.isOpen()){ goTo(last); return; }
    ["today-detail","planner-detail","subjectPeek"].forEach(id=>{ const b=document.getElementById(id); if(b) b.hidden=true; });
  });

  /* ---------- swipe with the finger (mobile) ----------
     The content follows the finger; on release the change completes or it goes back.
     Vertical scrolling is done by the browser (touch-action: pan-y in the CSS),
     so nothing here blocks scrolling. */
  const THRESHOLD=70, EASE_IN="cubic-bezier(.4,0,1,1)", EASE_OUT="cubic-bezier(.22,.7,.25,1)";
  let x0=null,y0=null,dx=0,dragging=false,locked=false,scroller=null,leaving=null;
  /* the horizontally scrollable container under the finger, if any */
  function hScroller(el){
    for(let n=el; n&&n!==canvas&&n!==document.body; n=n.parentElement){
      if(n.scrollWidth-n.clientWidth>4){ const ox=getComputedStyle(n).overflowX; if(ox==="auto"||ox==="scroll") return n; }
    }
    return null;
  }
  /* the gesture is left to the table only if it can still scroll that way */
  const tableTakes=(sc,mx)=>!!sc&&(mx<0?sc.scrollLeft<sc.scrollWidth-sc.clientWidth-1:sc.scrollLeft>1);
  const place=(x,op)=>{ canvas.style.transform=`translate3d(${x}px,0,0)`; canvas.style.opacity=op; };
  const reset=()=>{ canvas.style.transform=""; canvas.style.opacity=""; };
  function enter(sgn){
    if(lowMotion()||!canvas.animate) return;
    canvas.animate([{transform:`translate3d(${-sgn*window.innerWidth*0.3}px,0,0)`,opacity:0},{transform:"none",opacity:1}],
      {duration:280,easing:EASE_OUT});
  }
  function snapBack(){
    const from={transform:canvas.style.transform||"none",opacity:canvas.style.opacity||1};
    reset();
    if(!lowMotion()&&canvas.animate) canvas.animate([from,{transform:"none",opacity:1}],{duration:260,easing:EASE_OUT});
  }

  document.addEventListener("touchstart",e=>{
    x0=null;
    if(!isMobile()||e.touches.length!==1||Home.isOpen()||order.indexOf(current)<0||e.target.closest("input,textarea,select")) return;
    x0=e.touches[0].clientX; y0=e.touches[0].clientY;
    scroller=hScroller(e.target);
    dx=0; dragging=false; locked=false;
  },{passive:true});

  document.addEventListener("touchmove",e=>{
    if(x0===null||locked) return;
    const mx=e.touches[0].clientX-x0, my=e.touches[0].clientY-y0;
    if(!dragging){
      if(Math.abs(my)>10&&Math.abs(my)>Math.abs(mx)){ locked=true; return; }   /* vertical scroll */
      if(tableTakes(scroller,mx)){ locked=true; return; }                     /* the table still moves */
      if(Math.abs(mx)<=12) return;
      dragging=true;
    }
    const i=order.indexOf(current), edge=(mx<0&&i>=order.length-1)||(mx>0&&i<=0);
    dx=edge?mx*0.22:mx*0.85;                      /* resistance at the ends */
    place(dx,Math.max(.45,1-Math.abs(dx)/420));
  },{passive:true});

  document.addEventListener("touchend",()=>{
    if(x0===null||!dragging){ x0=null; return; }
    x0=null;
    const i=order.indexOf(current), sgn=dx<0?-1:1, target=i-sgn;
    if(Math.abs(dx)<THRESHOLD||target<0||target>=order.length||lowMotion()||!canvas.animate){
      if(Math.abs(dx)>=THRESHOLD&&target>=0&&target<order.length){ reset(); goTo(order[target]); return; }
      snapBack(); return;
    }
    /* it leaves the way you pushed… */
    const from={transform:canvas.style.transform,opacity:canvas.style.opacity||1};
    reset();
    const far=sgn*Math.max(Math.abs(dx)+window.innerWidth*0.2,window.innerWidth*0.6);
    leaving=canvas.animate([from,{transform:`translate3d(${far}px,0,0)`,opacity:0}],{duration:150,easing:EASE_IN,fill:"forwards"});
    leaving.onfinish=()=>{
      const anim=leaving; leaving=null;
      goTo(order[target]);
      anim.cancel();
      enter(sgn);               /* …and the new one comes in from the other side */
    };
  },{passive:true});
  /* a system gesture (back, notifications…) cancels the touch: everything back in place */
  document.addEventListener("touchcancel",()=>{ if(x0!==null&&dragging) snapBack(); x0=null; },{passive:true});

  /* ---------- start ---------- */
  handle();
  if(!Gate.locked()&&Home.isOpen()) Home.intro();      /* the opening, when the app starts at home */
  if(!shownOnce) show("schedule",{quiet:true});        /* e.g. when opened with #debug */
  /* after loading, the browser jumps to the hash's anchor (#schedule is the weekly
     timetable, not Today): undo it so it always starts at the top */
  window.addEventListener("load",()=>setTimeout(toTop,0));

  return {current:()=>current, last:()=>last, goTo};
})();
