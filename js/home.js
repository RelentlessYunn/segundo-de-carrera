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
    clearTimeout(closeTimer);
    if(P.hidden||P.classList.contains("leaving")){ returnFocus=document.activeElement; P.scrollTop=0; }
    P.classList.remove("leaving"); P.hidden=false;
    document.body.classList.add("portal-open");
    behind.forEach(el=>el.inert=true);
    /* focus goes into the window (Tab continues through the cards), without marking any */
    P.focus({preventScroll:true});
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
  if(Gate.locked()) Gate.onOpen(intro);           /* after the PIN; otherwise router.js starts it */

  /* ---------- entering UC3M: the camera flies into a star ----------
     The star is born on the card's icon; the sky rushes towards it, the star
     swallows the screen in white, and the timetable appears out of the light. */
  let entering=false;
  function enter(card,go){
    if(entering) return;
    if(!fancy()){ go(); return; }
    entering=true;
    const r=(card.querySelector(".p-ic")||card).getBoundingClientRect();
    const x=r.left+r.width/2, y=r.top+r.height/2;
    const star=document.createElement("div");
    star.className="zoom-star"; star.style.left=x+"px"; star.style.top=y+"px";
    document.body.appendChild(star);
    const sky=$("#sky"), inner=$("#portal .p-in");
    const origin=`${x}px ${y}px`;
    const EASE_IN="cubic-bezier(.55,0,.85,.3)";
    inner.style.transformOrigin=origin;
    inner.animate([{transform:"none",opacity:1,filter:"blur(0)"},{transform:"scale(1.6)",opacity:0,filter:"blur(6px)"}],
      {duration:700,easing:EASE_IN,fill:"forwards"});
    if(sky){ sky.style.transformOrigin=origin;
      sky.animate([{transform:"none"},{transform:"scale(4)"}],{duration:1400,easing:EASE_IN,fill:"forwards"}); }
    /* big enough for its white core to cover the farthest corner of the screen */
    const far=Math.max(Math.hypot(x,y),Math.hypot(innerWidth-x,y),Math.hypot(x,innerHeight-y),Math.hypot(innerWidth-x,innerHeight-y));
    const S=Math.ceil(far/(44*.3)*1.15);
    star.animate([
      {transform:"translate(-50%,-50%) scale(.4)",opacity:0},
      {transform:"translate(-50%,-50%) scale(1.6)",opacity:1,offset:.22},
      {transform:"translate(-50%,-50%) scale(2.2)",opacity:1,offset:.45},
      {transform:`translate(-50%,-50%) scale(${S})`,opacity:1}
    ],{duration:1400,easing:EASE_IN,fill:"forwards"}).onfinish=()=>{
      go();                                                     /* behind the white, the timetable */
      document.body.classList.add("arriving");
      inner.getAnimations().forEach(a=>a.cancel()); inner.style.transformOrigin="";
      if(sky){ sky.getAnimations().forEach(a=>a.cancel()); sky.style.transformOrigin=""; }
      star.animate([{opacity:1},{opacity:0}],{duration:900,easing:"ease-out",fill:"forwards"}).onfinish=()=>{
        star.remove(); document.body.classList.remove("arriving"); entering=false;
      };
    };
  }

  return {open, close, enter, intro, isOpen:()=>!P.hidden&&!P.classList.contains("leaving")};
})();
