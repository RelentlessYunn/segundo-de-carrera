/* ==========================================================
   header.js — clock, date, week badge and figures at the top.
   It is also the page's only clock: when the minute changes it emits
   "minute", and when the day changes "newDay". Whatever needs refreshing
   (Today, the planner, home…) just listens.
   ========================================================== */
(function(){
  let day=todayISO(), weekHtml="", timer=null;

  /* digits are only touched when they change, and drop in */
  function drawTime(n){
    const digits=$$("#clockTime .digit"); if(!digits.length) return;
    [String(n.getHours()).padStart(2,"0"),String(n.getMinutes()).padStart(2,"0")].forEach((pair,i)=>{
      if(!digits[i]||digits[i].textContent===pair) return;
      digits[i].textContent=pair;
      digits[i].classList.remove("tick-in"); void digits[i].offsetWidth; digits[i].classList.add("tick-in");
    });
  }
  /* the small clocks of the compact header (scrolled down) */
  function drawMini(n){
    const hm=String(n.getHours()).padStart(2,"0")+":"+String(n.getMinutes()).padStart(2,"0");
    $$(".mini-time").forEach(el=>{ if(el.textContent!==hm) el.textContent=hm; });
  }
  /* ---------- compact header ----------
     Scrolled down, the big header is out of sight, so the essentials stay at hand:
     on a computer they slide into the tab bar (logo = home, time, Aula Global,
     notes, settings); on a phone the header shrinks to one row. */
  function setCompact(on){
    if(document.body.classList.contains("compact")===on) return;
    document.body.classList.toggle("compact",on);
    $$("nav.bar .mini").forEach(m=>{ m.inert=!on; });
    /* the tabs may lose their labels on narrower screens: the pill has to follow */
    requestAnimationFrame(()=>window.dispatchEvent(new Event("resize")));
  }
  const phone=matchMedia("(max-width:820px)");
  const scroller=$("body > div.wrap");
  function onScroll(){
    if(document.body.classList.contains("portal-open")) return;
    if(phone.matches){
      const y=scroller?scroller.scrollTop:0;
      /* a gap between on and off, so it does not flicker at the edge */
      /* only when there is enough to scroll: shrinking the header makes room, and on a
         short page that would pull the scroll back to the top and undo it */
      const room=scroller?scroller.scrollHeight-scroller.clientHeight:0;
      if(y>56&&room>180) setCompact(true); else if(y<8) setCompact(false);
    } else {
      const h=$("header.top"); if(!h) return;
      setCompact(h.getBoundingClientRect().bottom<=0);
    }
  }
  window.addEventListener("scroll",onScroll,{passive:true});
  if(scroller) scroller.addEventListener("scroll",onScroll,{passive:true});
  phone.addEventListener("change",()=>{ setCompact(false); onScroll(); });
  window.addEventListener("hashchange",()=>setTimeout(onScroll,60));

  /* the week badge is only rebuilt when it changes (otherwise its bar would regrow every minute) */
  function drawWeek(k){
    const w=weekOf(k), p=periodOn(k);
    const html=w
      ? `<b>${esc(t("header.week",{n:w.n}))}</b><span>${esc(t("header.ofWeeks",{n:weeksInTerm(w.term)}))}</span><i class="w-bar"><u style="width:${Math.round(w.n/weeksInTerm(w.term)*100)}%"></u></i>`
      : `<b>${esc(k<TERMS[0].start?t("header.notStarted"):p?p.label:t("header.noClasses"))}</b>`;
    if(html===weekHtml) return;
    weekHtml=html; $("#weekBadge").innerHTML=html;
  }
  /* label, figures and texts that depend on the term */
  function drawTerm(k){
    $$("[data-term]").forEach(el=>el.textContent=t("term.name",{n:termOrdinal(termOn(k))}));
    const ids=subjectsOn(k);
    const figures=[[ids.length,t("header.subjects")],[ids.reduce((s,id)=>s+(SUBJECTS[id].ects||0),0),"ECTS"],
                   [new Set(ids.map(id=>SUBJECTS[id].campus)).size,t("header.campus")]];
    $("#stats").innerHTML=figures.map(f=>`<div class="stat"><b data-end="${f[0]}">${f[0]}</b><span>${f[1]}</span></div>`).join("");
  }
  /* figures count up from zero on load */
  function countUp(){
    if(!fullMotion()) return;
    $$("#stats b[data-end]").forEach((b,i)=>{
      const end=+b.dataset.end; if(!end) return;
      const t0=performance.now()+i*120, dur=900;
      b.textContent="0";
      (function step(now){
        const x=Math.min(1,Math.max(0,(now-t0)/dur));
        b.textContent=Math.round(end*(1-Math.pow(1-x,3)));
        if(x<1) requestAnimationFrame(step);
      })(performance.now());
    });
  }

  function tick(){
    const n=new Date(), k=isoDate(n);
    drawTime(n); drawMini(n);
    $("#clockDate").textContent=fmtLong(n);
    drawWeek(k);
    if(k!==day){
      /* a new term starts at midnight: simplest and safest is to reload */
      if(termOn(k)!==termOn(day)){ location.reload(); return; }
      day=k; drawTerm(k); emit("newDay",k);
    }
    emit("minute",k);
  }
  /* right when the minute changes; when coming back to the browser tab, at once
     (timers sleep in the background) */
  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(()=>{ tick(); schedule(); }, 60000-Date.now()%60000+30);
  }
  document.addEventListener("visibilitychange",()=>{ if(!document.hidden){ tick(); schedule(); } });

  drawTerm(day);
  countUp();
  tick();
  schedule();
})();
