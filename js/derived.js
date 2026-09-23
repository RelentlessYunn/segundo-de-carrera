/* ==========================================================
   derived.js — data computed from data.js, so nothing has to be marked by hand.
   · CLASHES: classes that really overlap on a given date. They are added to
     EVENTS as type "cf" (unless there is a hand-written one that day for that
     subject, which usually carries the exact room).
   · Grid layout: which classes share a time slot and go half width.
   ========================================================== */
const CLASHES=[];
(function(){
  const overlap=(x,y)=>x.start<y.end&&y.start<x.end;

  /* 1 · clashes on specific dates: every class day of every term */
  TERMS.forEach(term=>{
    for(let k=term.start; k<=term.end; k=addDays(k,1)){
      const cs=classesOn(k);
      for(let i=0;i<cs.length;i++) for(let j=i+1;j<cs.length;j++)
        if(cs[i].subject!==cs[j].subject&&overlap(cs[i],cs[j])) CLASHES.push({date:k,x:cs[i],y:cs[j]});
    }
  });
  /* filed under the "exceptional" class (the one with loose dates), which is the one that moves */
  CLASHES.forEach(c=>{
    const [p,q]=c.y.dates&&!c.x.dates?[c.y,c.x]:[c.x,c.y];
    if(EVENTS.some(e=>e.type==="cf"&&e.date===c.date&&(e.subject===p.subject||e.subject===q.subject))) return;
    EVENTS.push({subject:p.subject, date:c.date, type:"cf", weight:t("clash.weight"), generated:true,
      time:`${hhmm(Math.max(p.start,q.start))}–${hhmm(Math.min(p.end,q.end))}`,
      what:t("clash.what",{a:cap(p.kind),subjectA:SUBJECTS[p.subject].name,room:p.room,b:q.kind.charAt(0).toLowerCase()+q.kind.slice(1),subjectB:SUBJECTS[q.subject].name})});
  });

  /* 2 · grid layout: columns inside each group of overlapping classes */
  for(let d=0; d<5; d++){
    const day=CLASSES.filter(c=>c.day===d).sort((x,y)=>x.start-y.start||x.end-y.end);
    let group=[], groupEnd=-1;
    const close=()=>{
      const cols=[];                               /* end of the last class in each column */
      group.forEach(c=>{
        let i=cols.findIndex(end=>end<=c.start);
        if(i<0){ i=cols.length; cols.push(0); }
        cols[i]=c.end; c.col=i;
      });
      group.forEach(c=>c.ncol=cols.length);
    };
    day.forEach(c=>{
      if(c.start>=groupEnd&&group.length){ close(); group=[]; }
      group.push(c); groupEnd=Math.max(groupEnd,c.end);
    });
    if(group.length) close();
  }
  /* a class "clashes" in the grid if any of its dates overlaps another class */
  CLASHES.forEach(c=>{ c.x.clashes=true; c.y.clashes=true; });
})();
