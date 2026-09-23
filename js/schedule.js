/* ==========================================================
   schedule.js — weekly timetable: proportional grid (desktop), list by
   day (mobile), clash status bar and colour key.
   Everything comes from CLASSES; layout and clashes come from derived.js.
   ========================================================== */
const PX_PER_MIN=1.2;   /* grid scale */
(function(){
  const today=todayISO();
  const ids=subjectsOn(today);
  const rows=CLASSES.filter(c=>ids.includes(c.subject));
  const DAYS=WEEKDAY_LONG.slice(1,6);

  /* ---------- grid: hours fit the first and last class ---------- */
  const hFirst=rows.length?Math.floor(Math.min(...rows.map(c=>c.start))/60):9;
  const hLast=rows.length?Math.ceil(Math.max(...rows.map(c=>c.end))/60):20;
  const T0=hFirst*60;
  const todayCol=fromISO(today).getDay()-1;

  $("#calhead").innerHTML="<div></div>"+DAYS.map((d,i)=>`<div${i===todayCol?' class="is-today"':""}>${d}</div>`).join("");
  let g='<div class="gutter">';
  for(let h=hFirst;h<=hLast;h++) g+=`<b style="top:${(h*60-T0)*PX_PER_MIN}px">${String(h).padStart(2,"0")}:00</b>`;
  g+="</div>";
  let n=0;   /* order of appearance, for the staggered entrance */
  DAYS.forEach((_,d)=>{
    g+=`<div class="daycol${d===todayCol?" is-today":""}">`;
    rows.filter(c=>c.day===d).forEach(c=>{
      const S=SUBJECTS[c.subject], nc=c.ncol||1, col=c.col||0;
      const pos=nc===1?"left:5px;right:5px;"
        :`left:calc(${col*100/nc}% + ${col?2:5}px);width:calc(${100/nc}% - 7px);`;
      const cls="ev"+(nc>1?" half":"")+(c.clashes?" dash":"")+(c.dates?" hatch":"");
      g+=`<div class="${cls}" style="${pos}top:${(c.start-T0)*PX_PER_MIN}px;height:${(c.end-c.start)*PX_PER_MIN}px;`+
         `background-image:linear-gradient(${S.tint},${S.tint});border-color:${S.color};--sc:${S.color};--i:${n++}">`+
         (c.clashes?`<span class="mark" style="color:${S.color}" title="${esc(t("schedule.clashTip"))}">⚠</span>`:"")+
         `<div class="tags" style="color:${S.color}"><span class="tag grp">${esc(t("schedule.group",{g:c.group}))}</span><span class="tag cam">${S.campus}</span></div>`+
         `<b>${esc(S.name)}</b><u>${hhmm(c.start)}–${hhmm(c.end)} · ${esc(c.kind)}</u><s>${esc(c.room)}</s></div>`;
    });
    g+="</div>";
  });
  const body=$("#calbody");
  body.innerHTML=g;
  body.style.setProperty("--grid-h",((hLast*60-T0)*PX_PER_MIN+14)+"px");

  /* at midnight the highlighted column moves to the new day */
  document.addEventListener("newDay",e=>{
    const d=fromISO(e.detail).getDay()-1;
    $$("#calhead > div").forEach((x,i)=>x.classList.toggle("is-today",i-1===d));
    $$("#calbody .daycol").forEach((x,i)=>x.classList.toggle("is-today",i===d));
  });

  /* ---------- status bar: computed from the timetable, never written by hand ---------- */
  const overlap=(x,y)=>x.start<y.end&&y.start<x.end;
  const fixed=[];
  rows.forEach((x,i)=>rows.slice(i+1).forEach(y=>{
    if(x.subject!==y.subject&&x.day===y.day&&!x.dates&&!y.dates&&overlap(x,y)&&x.from<=y.to&&y.from<=x.to) fixed.push([x,y]);
  }));
  const pairs=new Map();
  /* clashes between two weekly classes already show as "fixed"; these are the loose-date ones */
  CLASHES.filter(c=>ids.includes(c.x.subject)&&ids.includes(c.y.subject)&&(c.x.dates||c.y.dates)).forEach(c=>{
    const key=[c.x.subject,c.y.subject].sort().join("×");
    if(!pairs.has(key)) pairs.set(key,{x:c.x,y:c.y,dates:[]});
    pairs.get(key).dates.push(c.date);
  });
  const parts=[];
  parts.push(fixed.length
    ? `<span class="s wr">⚠ ${esc(tn("schedule.fixed",fixed.length))}: ${fixed.map(p=>SUBJECTS[p[0].subject].short+" "+t("and")+" "+SUBJECTS[p[1].subject].short).join(", ")}</span>`
    : `<span class="s ok">✓ ${esc(t("schedule.noFixed"))}</span>`);
  pairs.forEach(p=>{
    const [u,v]=p.y.dates&&!p.x.dates?[p.y,p.x]:[p.x,p.y];   /* the loose-date one first */
    const first=fromISO(p.dates[0]);
    const when=p.dates.length===1?t("schedule.clashOn",{day:dayName(first),date:fmtDayMonth(first)})
      :t("schedule.clashTimes",{n:p.dates.length,day:dayNamePlural(first)});
    parts.push(`<span class="s wr">⚠ ${esc(t("schedule.clash",{a:SUBJECTS[u.subject].short,b:SUBJECTS[v.subject].short,when}))}</span>`);
  });
  const mixed=DAYS.filter((_,d)=>new Set(rows.filter(c=>c.day===d).map(c=>SUBJECTS[c.subject].campus)).size>1)
    .map(x=>WEEKDAY_MID[WEEKDAY_LONG.indexOf(x)]);
  if(mixed.length) parts.push(`<span class="s">${esc(t("schedule.bothCampus",{campus:Object.values(CAMPUS).join(" "+t("and")+" "),days:mixed.join(" "+t("and")+" ")}))}</span>`);
  parts.push(`<span class="sep"></span><span class="key">`+
    (CLASHES.length?`<span><i class="kbox"></i>${esc(t("schedule.keyClash"))}</span>`:"")+
    `<span><i class="kbox hatch"></i>${esc(t("schedule.keyLoose"))}</span></span>`);
  $("#scheduleStatus").innerHTML=parts.join("");

  /* ---------- colour key and list by day (mobile) ---------- */
  $("#subjectKey").innerHTML=ids.map(k=>`<span><i class="sw" style="background:${SUBJECTS[k].color}"></i>${esc(SUBJECTS[k].name)}</span>`).join("");
  $("#dayblocks").innerHTML=DAYS.map((dn,d)=>{
    const list=rows.filter(c=>c.day===d).sort((a,b)=>a.start-b.start);
    if(!list.length) return "";
    const cam=[...new Set(list.map(c=>campusOf(c.subject)))].join(" "+t("and")+" ");
    return `<div class="dayblock"><h3>${dn}<em>${cam}</em></h3>`+list.map(c=>{
      const S=SUBJECTS[c.subject];
      return `<div class="trow"><span class="sw" style="background:${S.color}"></span><time>${hhmm(c.start)}–${hhmm(c.end)}</time>`+
        `<div class="m"><b>${esc(S.name)}</b><em>${esc(c.kind)} · ${esc(t("schedule.groupLong",{g:c.group}))} · ${esc(c.when)}</em></div><span class="room">${esc(c.room)}</span></div>`;
    }).join("")+"</div>";
  }).join("");
})();
