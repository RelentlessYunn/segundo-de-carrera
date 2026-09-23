/* ==========================================================
   planner.js — monthly calendar for the whole year (from CALENDAR.year),
   with periods, holidays, week numbers, yellow "done" days and the dates
   of EVENTS as chips that open their detail.
   ========================================================== */
(function(){
  /* months of the academic year */
  const months=[];
  for(let d=fromISO(CALENDAR.year.from.slice(0,8)+"01"); isoDate(d)<=CALENDAR.year.to; d.setMonth(d.getMonth()+1))
    months.push({y:d.getFullYear(),m:d.getMonth()});
  const indexOf=k=>{ const d=fromISO(k), i=months.findIndex(mo=>mo.y===d.getFullYear()&&mo.m===d.getMonth()); return i<0?0:i; };
  let current=indexOf(todayISO());
  const box=$("#planner-grid");

  /* teaching week number, only on each row's Monday */
  const weekTag=k=>{
    if(fromISO(k).getDay()!==1) return "";
    const w=weekOf(k);
    return w?`<div class="m-wk">${t("planner.weekTag",{n:w.n})}</div>`:"";
  };
  const chip=(e,closing)=>{
    const S=SUBJECTS[e.subject];
    const label=t("event.title",{type:typeName(e.type),subject:S.name})+(e.noDay?", "+t("event.noDay"):"")+(closing?", "+t("planner.closes"):"");
    return `<button class="m-chip ${e.type}${e.noDay?" tbd":""}${closing?" closing":""}" data-ev="${EVENTS.indexOf(e)}" style="--sc:${S.color}" `+
      `aria-label="${esc(label)}"><i></i><span>${esc(S.short)} · ${esc(closing?t("planner.closes"):typeName(e.type))}</span></button>`;
  };

  function render(){
    const mo=months[current], today=todayISO();
    let html=`<div class="month"><div class="m-title">`+
      `<button class="m-nav" data-go="-1"${current===0?" disabled":""} aria-label="${esc(t("planner.prev"))}">‹</button>`+
      `<span class="m-name">${esc(fmtMonthYear(new Date(mo.y,mo.m,1)))}</span>`+
      `<button class="m-nav" data-go="1"${current===months.length-1?" disabled":""} aria-label="${esc(t("planner.next"))}">›</button>`+
      `<button class="m-today" data-go="today">${esc(t("today.button"))}</button></div>`;
    html+='<div class="m-grid head">'+WEEKDAY_LETTER.map(d=>`<div>${d}</div>`).join("")+'</div><div class="m-grid days">';

    const first=new Date(mo.y,mo.m,1).getDay(), lead=first===0?6:first-1;
    const total=new Date(mo.y,mo.m+1,0).getDate();
    /* days of the previous and next month fill the rows */
    const outside=dt=>`<div class="m-day out">${weekTag(isoDate(dt))}<div class="m-date">${dt.getDate()}</div></div>`;
    for(let i=lead;i>0;i--) html+=outside(new Date(mo.y,mo.m,1-i));

    for(let d=1;d<=total;d++){
      const dt=new Date(mo.y,mo.m,d), k=isoDate(dt);
      const weekend=dt.getDay()===0||dt.getDay()===6;
      const h=holidayOn(k), p=periodOn(k), mark=CALENDAR.marks.find(x=>x.date===k);
      const onBreak=p&&p.type==="break";
      let cls="m-day", tag="";
      if(weekend) cls+=" weekend";
      if(onBreak){ cls+=" break"; if(k===p.from||d===1) tag=`<div class="m-tag">${esc(p.label)}</div>`; }
      else if(p&&p.type==="exams"){ cls+=" exams"; if(k===p.from||d===1) tag=`<div class="m-tag">${esc(p.label)}</div>`; }
      if(h&&!weekend&&!onBreak){ cls+=" no-class"; tag=`<div class="m-tag">${esc(t("today.noClass")+(h.campus?" · "+t("today.onlyCampus",{campus:CAMPUS[h.campus.toUpperCase()]}):""))}</div>`; }
      /* yellow progress: any past day without another colour */
      const plain=!weekend&&!(h&&!onBreak)&&!(p&&(p.type==="exams"||onBreak));
      if(plain&&k<today&&k>=CALENDAR.year.from) cls+=" past";
      if(k===today) cls+=" today";
      if(mark) tag=`<div class="m-tag mark">${esc(mark.label)}</div>`+tag;
      /* the chip goes on its date; windows of several days also get one on the closing day */
      const chips=EVENTS.filter(e=>e.date===k).map(e=>chip(e))
        .concat(EVENTS.filter(e=>e.until===k&&e.date!==k).map(e=>chip(e,true)));
      html+=`<div class="${cls}"${k===today?' aria-current="date"':""}>${weekTag(k)}<div class="m-date">${d}</div>${tag}${chips.join("")}</div>`;
    }
    const rest=(lead+total)%7;
    if(rest) for(let i=1;i<=7-rest;i++) html+=outside(new Date(mo.y,mo.m+1,i));
    box.innerHTML=html+'</div></div><div id="planner-detail" class="ev-detail" hidden></div>';
  }

  box.addEventListener("click",ev=>{
    const c=ev.target.closest(".m-chip");
    if(c){ showDetail("planner-detail",EVENTS[+c.dataset.ev]); return; }
    const b=ev.target.closest("[data-go]"); if(!b) return;
    if(b.dataset.go==="today") current=indexOf(todayISO());
    else { const n=current+(+b.dataset.go); if(n<0||n>=months.length) return; current=n; }
    render();
  });
  closeDetailOn("planner-detail",".m-chip");
  /* at midnight the today box and the yellow move on; if you were on today's month, it follows */
  document.addEventListener("newDay",e=>{
    if(current===indexOf(addDays(e.detail,-1))) current=indexOf(e.detail);
    render();
  });
  render();
})();
