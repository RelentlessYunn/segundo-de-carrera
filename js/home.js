/* ==========================================================
   home.js — the home screen: choose between UC3M and Nolan.
   It behaves like a window on top of everything: the page behind cannot be
   clicked or tabbed into, and Escape closes it.
   Routes (#home, #nolan…) are decided in router.js; here it only opens and closes.
   ========================================================== */
const Home=(function(){
  const P=$("#portal"), views=$$("#portal .p-view");
  const behind=[$("header.top"),$("nav.bar"),$("body > div.wrap")].filter(Boolean);
  let returnFocus=null, closeTimer=0;
  const greeting=h=>t(h<6?"home.night":h<14?"home.morning":h<21?"home.afternoon":"home.night");

  /* UC3M card summary: week, class now or next, and next assessment */
  function draw(){
    const n=new Date(), k=isoDate(n), m=minutesOf(n);
    $("#homeTime").textContent=hhmm(m);
    $("#homeGreeting").textContent=t("home.greeting",{hello:greeting(n.getHours()),name:"Nolan"});
    const cs=classesOn(k), next=cs.find(c=>classState(c,m)!=="over");
    const cls=next?t(classState(next,m)==="now"?"home.now":"home.next",{subject:SUBJECTS[next.subject].name,time:hhmm(next.start),room:next.room})
      :cs.length?t("home.doneToday"):(noClassReason(k)||{text:t("home.noClassToday")}).text.replace(/\.$/,"");
    const ex=EVENTS.filter(e=>isAssessment(e)&&lastDay(e)>=k).sort(byDate)[0];
    const exam=ex?t("home.nextExam",{type:typeName(ex.type),subject:SUBJECTS[ex.subject].short,when:whenLabel(ex,k)}):"";
    const w=weekOf(k);
    $("#homeUc3mInfo").innerHTML=(w?`<i>${esc(t("header.week",{n:w.n}))}</i>`:"")+`<span>${esc(cls)}</span>`+(exam?`<span>${esc(exam)}</span>`:"");
  }
  function open(view,subroute,backTo){
    draw();
    /* the UC3M card points at the tab you were on */
    if(backTo) $("#homeUc3m").setAttribute("href","#"+backTo);
    if(view==="nolan") Nolan.render($("#nolanView"),subroute||"");
    views.forEach(v=>v.hidden=v.dataset.view!==view);
    P.dataset.view=view;
    clearTimeout(closeTimer);
    if(P.hidden||P.classList.contains("leaving")){ returnFocus=document.activeElement; P.scrollTop=0; }
    P.classList.remove("leaving"); P.hidden=false;
    document.body.classList.add("portal-open");
    behind.forEach(el=>el.inert=true);
    /* focus goes into the window (Tab continues through the cards), without marking any */
    P.focus({preventScroll:true});
    drawGalaxy();
  }
  function close(){
    if(P.hidden) return;
    document.body.classList.remove("portal-open");
    behind.forEach(el=>el.inert=false);
    if(lowMotion()) P.hidden=true;
    else { P.classList.add("leaving"); closeTimer=setTimeout(()=>{ P.hidden=true; P.classList.remove("leaving"); },280); }
    if(returnFocus&&document.contains(returnFocus)&&returnFocus!==document.body) returnFocus.focus({preventScroll:true});
    returnFocus=null;
  }
  document.addEventListener("minute",()=>{ if(!P.hidden) draw(); });

  /* ---------- the opening: the logo draws itself, NOLAN appears, then the rest ----------
     Played when the app starts (or right after the PIN), not every time home opens. */
  function intro(){
    if(P.hidden||!fullMotion()) return;
    P.classList.remove("intro"); void P.offsetWidth; P.classList.add("intro");
    setTimeout(()=>P.classList.remove("intro"),4200);
  }
  Gate.onUnlock(intro);

  /* ---------- home's galaxy, far away in the background ----------
     Drawn once (and again if the window changes size) by galaxy.js. */
  const gal=$("#homeGalaxy");
  let galDrawn="";
  function drawGalaxy(){
    if(!gal||P.hidden||!highQuality()) return;
    const key=innerWidth+"x"+innerHeight; if(key===galDrawn) return;
    galDrawn=key; Galaxy.still(gal); gal.classList.add("ready");
  }
  let rzg=0; window.addEventListener("resize",()=>{ clearTimeout(rzg); rzg=setTimeout(drawGalaxy,250); });

  /* ---------- entering UC3M: into the galaxy ----------
     Home fades away, the camera flies into home's galaxy, and UC3M appears
     inside it, with its own sky (css: .sky-inside). */
  let entering=false;
  function enter(card,go){
    if(entering) return;
    if(!fancy()||!gal){ go(); return; }
    entering=true;
    const inner=$("#portal .p-in"), bar=$("#portal .p-bar");
    const fade=[{opacity:1,transform:"none"},{opacity:0,transform:"translateY(-10px)"}];
    inner.animate(fade,{duration:500,easing:"ease-in",fill:"forwards"});
    if(bar) bar.animate(fade,{duration:400,easing:"ease-in",fill:"forwards"});
    Galaxy.fly({from:"home",duration:2800,black:false,arrive:()=>{
      go();
      document.body.classList.add("arriving");
      setTimeout(()=>{
        document.body.classList.remove("arriving"); entering=false;
        inner.getAnimations().forEach(a=>a.cancel()); if(bar) bar.getAnimations().forEach(a=>a.cancel());
        gal.style.opacity="";
      },1200);
    }});
    gal.style.opacity="0";                          /* the flying galaxy takes its place */
  }

  return {open, close, enter, intro, isOpen:()=>!P.hidden&&!P.classList.contains("leaving")};
})();
