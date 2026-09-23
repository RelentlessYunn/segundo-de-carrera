/* ==========================================================
   notes.js — "Notes for Claude": free text saved in the cloud.
   You can't type until the saved text has arrived, so nothing is erased.
   Note: Claude cannot read JSONBin by itself; the Copy button is for
   pasting the notes into the chat.
   ========================================================== */
(function(){
  const box=$("#notesText"), status=$("#notesStatus"), copy=$("#copyNotes");
  const example=box.placeholder;
  let loaded=!Cloud.enabled;
  if(Cloud.enabled){ box.readOnly=true; box.placeholder=t("notes.loading"); }

  Cloud.onLoad(rec=>{
    /* refreshed from another device, unless you are typing */
    if(!loaded||document.activeElement!==box) box.value=rec.notas||"";
    loaded=true; box.readOnly=false; box.placeholder=example;
  });
  box.addEventListener("input",()=>{
    if(!loaded) return;
    const text=box.value;
    Cloud.change("notes",rec=>{ rec.notas=text; });
  });
  document.addEventListener("cloud",e=>{ status.textContent=e.detail.text; });

  copy.addEventListener("click",async()=>{
    clearTimeout(copy.resetTimer);
    try{ await navigator.clipboard.writeText(box.value); copy.textContent=t("notes.copied"); }
    catch(e){ box.select(); copy.textContent=t("notes.selectAndCopy"); }
    copy.resetTimer=setTimeout(()=>{ copy.textContent=t("notes.copy"); },1600);
  });
})();
