/* ==========================================================
   home.js — the home screen: one card per section (UC3M, Nolan, and the
   galaxies kept for what comes next), plus Notes and Settings.
   It behaves like a window on top of everything: the page behind cannot be
   clicked or tabbed into, and Escape closes it.
   Every section is a galaxy of the universe (universe.js): opening a
   section flies the camera into its galaxy, coming home flies back out.
   Routes (#home, #nolan, #soon/…) are decided in router.js.
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
  /* which galaxy each view of home lives in */
  /* Notes and Settings belong to every section: they open where you are, without moving the camera */
  const PAGES=["notes","settings"];
  const SOON_NAMES={andromeda:"Andrómeda",sombrero:"Sombrero"};   /* the galaxies kept for what comes next */
  const here=()=>{ const s=Universe.scene(); return !s||s==="gate"?"home":s; };
  const sceneOf=(view,sub)=>PAGES.includes(view)?here():view==="nolan"?"forge":view==="blackhole"?"blackhole":view==="soon"?(Object.prototype.hasOwnProperty.call(SOON_NAMES,sub)?sub:"home"):"home";
  let current="home";                                  /* the scene of what home shows now */
  let lastView="home";                                 /* the last view of home that is not Notes or Settings */
  function renderSoon(id){
    /* only known galaxies: anything else in the address is just "a galaxy to explore" */
    const ic=SOON_NAMES[id]&&Object.prototype.hasOwnProperty.call(SOON_NAMES,id)?$(`.p-card[data-galaxy="${id}"] .p-ic`):null;
    $("#soonView").innerHTML=`<span class="p-ic big" style="--ac:#9FB3FF">${ic?ic.innerHTML:""}</span>`+
      `<h2>${esc(SOON_NAMES[id]||id)}</h2><p>${esc(t("soon.text"))}</p>${backLink("#home","nolan.backAria")}`;
  }
  let opened=false;
  function open(view,subroute,backTo){
    draw();
    /* the camera goes to this view's galaxy; the first time, no flight (it is already there) */
    /* (behind the PIN the camera stays in deep space, ready for the flight) */
    current=sceneOf(view,subroute);
    if(!Gate.locked()){ Universe.go(current,{animate:opened,duration:2400}); opened=true; }
    if(view==="soon") renderSoon(subroute);
    /* "← Back" in Notes and Settings returns to where you came from: a tab of the app, or a view of home */
    if(PAGES.includes(view)){
      const fromApp=P.hidden||P.classList.contains("leaving");
      const back=fromApp?"#"+(backTo||"schedule"):"#"+lastView;
      $$("#portal .p-back-top").forEach(a=>a.setAttribute("href",back));
    } else lastView=view+(subroute?"/"+subroute:"");
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
  }
  function close(){
    if(P.hidden) return;
    Universe.go("uc3m");                                /* the app lives inside the UC3M galaxy */
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
    /* back from changing a setting: the page must be ready and still when the passage opens */
    if(document.documentElement.classList.contains("shift-arriving")) return;
    P.classList.remove("intro"); void P.offsetWidth; P.classList.add("intro");
    setTimeout(()=>P.classList.remove("intro"),4200);
  }
  Gate.onUnlock(intro);

  /* ---------- opening a section: into its galaxy ----------
     Home's content fades, the camera flies into the section's galaxy, and
     the section appears inside it. go() is called on arrival. */
  let entering=false;
  function enter(card,go){
    if(entering) return;
    const id=card.dataset.galaxy||"uc3m";
    /* a flight: through the 3D universe, or into a star of the sky of stars (Quality = Medium) */
    if(!fancy()&&!(fullMotion()&&window.Stars)){ Universe.go(id,{animate:false}); go(); return; }
    entering=true;
    const inner=$("#portal .p-in"), bar=$("#portal .p-bar"), from=location.hash;
    const fade=[{opacity:1,transform:"none"},{opacity:0,transform:"translateY(-10px)"}];
    inner.animate(fade,{duration:500,easing:"ease-in",fill:"forwards"});
    if(bar) bar.animate(fade,{duration:400,easing:"ease-in",fill:"forwards"});
    P.classList.add("entering");                        /* nothing faded can be clicked meanwhile (css) */
    const reset=()=>{ inner.getAnimations().forEach(a=>a.cancel()); if(bar) bar.getAnimations().forEach(a=>a.cancel()); P.classList.remove("entering"); };
    /* the trip was interrupted (Escape, Back, another page): home comes back as it was */
    const abort=()=>{ reset(); entering=false; };
    Universe.go(id,{duration:2800,arriveAt:.82,onCancel:abort,onArrive:()=>{
      if(location.hash!==from){ abort(); return; }      /* you went somewhere else meanwhile */
      go();
      if(id==="uc3m"){ document.body.classList.add("arriving"); setTimeout(reset,400); } else reset();
      setTimeout(()=>{ document.body.classList.remove("arriving"); entering=false; },1200);
    }});
  }
  /* impatient? a second click (or Enter / Space) during the trip skips it: the section shows at once */
  document.addEventListener("click",ev=>{
    if(entering&&Universe.skip()){ ev.preventDefault(); ev.stopPropagation(); }
  },true);
  document.addEventListener("keydown",ev=>{
    if(entering&&(ev.key==="Enter"||ev.key===" ")&&Universe.skip()) ev.preventDefault();
  },true);
  /* the other galaxies (Nolan and the ones to explore) open inside home */
  $$("#portal .p-card[data-galaxy]").forEach(card=>{
    if(card.id==="homeUc3m") return;                      /* router.js handles UC3M */
    card.addEventListener("click",ev=>{ ev.preventDefault(); const h=card.getAttribute("href").slice(1);
      enter(card,()=>{ history.replaceState(null,"","#"+h); const [v,...rest]=h.split("/"); open(v,rest.join("/")); }); });
  });

  /* scene(): where the camera belongs for what is on screen (the app lives in UC3M) */
  return {open, close, enter, intro, scene:()=>P.hidden||P.classList.contains("leaving")?"uc3m":current, isOpen:()=>!P.hidden&&!P.classList.contains("leaving")};
})();
