/* ==========================================================
   gate.js — the PIN screen in front of everything.
   · The PIN is never written in the code: only a PBKDF2 hash of it. The
     typed PIN is hashed the same way and compared.
   · Once the right PIN is typed on a device, that device remembers it
     (localStorage "nolan-device") and never asks again. Changing the PIN
     (a new hash here) makes every device ask again.
   · index.html marks the page as locked in <head> before painting, so
     nothing behind the gate ever flashes.
   · Right PIN: the keypad drifts away and the camera flies from deep space
     into the Nolan galaxy, which is home (universe.js).
   · Gate.lock() (Log out, in Settings) forgets the device and asks again.
   This keeps people out of the page; it does not hide the code or the data
   files, which are public in the repository (see README, "PIN").
   ========================================================== */
const Gate=(function(){
  const HASH="f9d8f1cd96a7b5ffd4c1f01c7f5f0a7c00940726b33625b4755a1d4f25a91f20";
  const SALT="nolan·with-nolan·2026", ROUNDS=150000, KEY="nolan-device", LEN=6;
  const root=document.documentElement, box=$("#gate");
  const locked=()=>root.hasAttribute("data-locked");
  const listeners=[];
  if(!box) return {locked, lock(){}, onOpen:fn=>fn(), onUnlock(){}};

  async function hash(pin){
    const enc=new TextEncoder();
    const key=await crypto.subtle.importKey("raw",enc.encode(pin),"PBKDF2",false,["deriveBits"]);
    const bits=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:enc.encode(SALT),iterations:ROUNDS},key,256);
    return [...new Uint8Array(bits)].map(b=>b.toString(16).padStart(2,"0")).join("");
  }

  const dots=$$("#gate .g-dot"), msg=$("#gateMsg");
  let pin="", busy=false;
  function paint(){ dots.forEach((d,i)=>d.classList.toggle("on",i<pin.length)); }
  function press(k){
    if(busy) return;
    if(k==="del"){ pin=pin.slice(0,-1); paint(); return; }
    if(pin.length>=LEN) return;
    pin+=k; paint(); msg.textContent="";
    if(pin.length===LEN) check();
  }
  async function check(){
    busy=true; box.classList.add("checking");
    let ok=false;
    try{ ok=(await hash(pin))===HASH; }catch(e){ ok=false; }
    box.classList.remove("checking");
    if(ok){ try{ localStorage.setItem(KEY,HASH); }catch(e){} open(); return; }
    /* wrong: the dots shake and empty */
    msg.textContent=t("gate.wrong");
    box.classList.remove("wrong"); void box.offsetWidth; box.classList.add("wrong");
    if(navigator.vibrate) navigator.vibrate([40,40,40]);
    setTimeout(()=>{ pin=""; paint(); busy=false; },450);
  }

  box.addEventListener("click",e=>{ const b=e.target.closest("[data-k]"); if(b) press(b.dataset.k); });
  document.addEventListener("keydown",e=>{
    if(!locked()) return;
    if(/^[0-9]$/.test(e.key)) press(e.key);
    else if(e.key==="Backspace") press("del");
  });

  /* ---------- right PIN: the keypad drifts away and we travel into a galaxy ---------- */
  function open(){
    box.classList.add("granted");
    const done=()=>{ root.removeAttribute("data-locked"); box.hidden=true; box.classList.remove("granted","leaving"); listeners.forEach(fn=>fn()); };
    if(lowMotion()){ setTimeout(done,300); return; }
    /* the digits, dots and logo float away one after another (css: .gate.leaving) */
    setTimeout(()=>box.classList.add("leaving"),350);
    root.classList.add("flying");                       /* the far stars fade in during the flight (css) */
    Universe.go("home",{duration:5600,arriveAt:.8,onArrive:()=>{ done(); setTimeout(()=>root.classList.remove("flying"),1500); }});
  }

  /* ---------- log out: forget this device and show the PIN again ---------- */
  function lock(){
    try{ localStorage.removeItem(KEY); }catch(e){}
    pin=""; busy=false; paint(); msg.textContent="";
    box.classList.remove("granted","leaving","wrong","checking");
    box.hidden=false; box.classList.add("closing-in");
    root.setAttribute("data-locked","");
    /* next time, the flight lands at home (not on the page you logged out from) */
    history.replaceState(null,"","#home"); Home.open("home");
    Universe.go("gate",{animate:false});
    setTimeout(()=>box.classList.remove("closing-in"),900);
  }

  /* already remembered on this device: the gate is never shown */
  if(!locked()) box.hidden=true;

  /* onOpen: runs once now if already open, or every time the gate opens */
  return {locked, lock,
    /* onOpen: now if already open, and again after every unlock · onUnlock: only after an unlock */
    onOpen:fn=>{ listeners.push(fn); if(!locked()) fn(); },
    onUnlock:fn=>{ listeners.push(fn); }};
})();
