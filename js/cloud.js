/* ==========================================================
   cloud.js — saving to JSONBin (ticked tasks, exam grades, notes for Claude).
   Rules, so nothing is ever lost:
   · Until the first read has succeeded nothing is written: it retries and
     your changes wait in a queue.
   · Saves are CHANGES (this task done, this grade) applied to a fresh re-read,
     so nothing you didn't touch — or another device changed — is overwritten.
   · Writes go one after another.
   · Pending changes are flushed when the app is hidden or closed.
   Stored keys ("hechas", "grades", "notas") are kept as they were so old data still loads.
   Usage from other files:
     Cloud.onLoad(rec=>…)            called with the data (and again if refreshed)
     Cloud.change("key", rec=>…)     queues a change; the last one with the same key wins
   Status: "cloud" event with {kind, text}.
   ========================================================== */
const Cloud=(function(){
  const cfg=window.CONFIG||{}, ID=cfg.BIN_ID||"", KEY=cfg.API_KEY||"";
  const URL_BIN="https://api.jsonbin.io/v3/b/"+ID;
  const enabled=!!(ID&&KEY);
  let record=null, ready=false, retry=2000, timer=null, hiddenSince=0;
  let queue=Promise.resolve();
  const pending=new Map();          /* key → function that applies the change to a record */
  const listeners=[];
  const copy=o=>JSON.parse(JSON.stringify(o||{}));
  const status=(kind,text)=>emit("cloud",{kind,text});
  const headers={"X-Access-Key":KEY};

  async function read(){
    const r=await fetch(URL_BIN+"/latest",{headers,cache:"no-store"});
    if(!r.ok) throw new Error("HTTP "+r.status);
    return (await r.json()).record||{};
  }
  /* what was read plus what is still queued: that is what the screen must show */
  function view(rec){ const v=copy(rec); pending.forEach(fn=>fn(v)); return v; }
  function hand(rec){
    const v=view(rec);
    listeners.forEach(fn=>{ try{ fn(v); }catch(e){ console.error(e); } });
  }

  function load(){
    if(!enabled){ status("off",t("cloud.off")); return; }
    status("loading",t("cloud.loading"));
    read().then(rec=>{
      record=rec; ready=true; retry=2000;
      hand(rec);
      status("ok",t("cloud.synced"));
      if(pending.size) schedule();
    }).catch(()=>{
      status("error",t("cloud.retrying",{s:Math.round(retry/1000)}));
      setTimeout(load,retry); retry=Math.min(retry*2,60000);
    });
  }
  /* back in the app after a while: re-read in case another device changed something */
  function refresh(){
    read().then(rec=>{ if(pending.size) return; record=rec; hand(rec); }).catch(()=>{});
  }

  function schedule(){ clearTimeout(timer); timer=setTimeout(write,800); }
  function write(){
    if(!ready||!pending.size) return queue;
    const batch=new Map(pending); pending.clear();
    queue=queue.then(async()=>{
      try{
        const rec=await read();
        batch.forEach(fn=>fn(rec));
        const r=await fetch(URL_BIN,{method:"PUT",headers:{...headers,"Content-Type":"application/json"},body:JSON.stringify(rec)});
        if(!r.ok) throw new Error("HTTP "+r.status);
        record=rec;
        status(pending.size?"saving":"ok",pending.size?t("cloud.saving"):t("cloud.saved"));
      }catch(e){
        /* back to the queue, without overwriting a newer change with the same key */
        batch.forEach((fn,k)=>{ if(!pending.has(k)) pending.set(k,fn); });
        status("error",t("cloud.saveFailed"));
        setTimeout(schedule,5000);
      }
    });
    return queue;
  }
  /* when the app is hidden or closed there is no time to re-read: write over the last copy */
  function flushOnExit(){
    if(!ready||!pending.size||!record) return;
    const rec=view(record);
    try{
      fetch(URL_BIN,{method:"PUT",keepalive:true,headers:{...headers,"Content-Type":"application/json"},body:JSON.stringify(rec)});
    }catch(e){}
  }
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden){ hiddenSince=Date.now(); flushOnExit(); }
    else if(ready&&Date.now()-hiddenSince>60000) refresh();
  });
  window.addEventListener("pagehide",flushOnExit);

  /* read once every file has loaded and everyone is listening */
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",load); else setTimeout(load,0);
  return {
    enabled,
    ready:()=>ready,
    onLoad(fn){ listeners.push(fn); if(ready&&record) fn(view(record)); },
    change(key,fn){
      pending.set(key,fn);
      if(!enabled) return;
      if(!ready){ status("waiting",t("cloud.waiting")); return; }
      status("saving",t("cloud.saving")); schedule();
    }
  };
})();
