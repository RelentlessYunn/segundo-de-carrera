/* ==========================================================
   gate.js — the PIN screen in front of everything.
   · The PIN is never written in the code: only a PBKDF2 hash of it. The
     typed PIN is hashed the same way and compared.
   · Once the right PIN is typed on a device, that device remembers it
     (localStorage "nolan-device") and never asks again. Changing the PIN
     (a new hash here) makes every device ask again.
   · index.html marks the page as locked in <head> before painting, so
     nothing behind the gate ever flashes.
   · Right PIN: a jump to hyperspace into the galaxy, then home.
   This keeps people out of the page; it does not hide the code or the data
   files, which are public in the repository (see README, "PIN").
   ========================================================== */
const Gate=(function(){
  const HASH="f9d8f1cd96a7b5ffd4c1f01c7f5f0a7c00940726b33625b4755a1d4f25a91f20";
  const SALT="nolan·with-nolan·2026", ROUNDS=150000, KEY="nolan-device", LEN=6;
  const root=document.documentElement, box=$("#gate");
  const locked=()=>root.hasAttribute("data-locked");
  const listeners=[];
  if(!box) return {locked, onOpen:fn=>fn()};

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

  /* ---------- right PIN: into the galaxy at full speed ---------- */
  function open(){
    box.classList.add("granted");
    const done=()=>{ root.removeAttribute("data-locked"); box.hidden=true; listeners.forEach(fn=>fn()); };
    if(lowMotion()){ setTimeout(done,250); return; }
    hyperspace(done);
  }

  function hyperspace(arrive){
    const c=document.createElement("canvas"), x=c.getContext("2d");
    c.className="hyperspace"; document.body.appendChild(c);
    const DPR=Math.min(devicePixelRatio||1,2);
    let W=0,H=0;
    const size=()=>{ W=innerWidth; H=innerHeight; c.width=W*DPR; c.height=H*DPR; x.setTransform(DPR,0,0,DPR,0,0); };
    size();
    const N=highQuality()?900:380, stars=[];
    const spawn=s=>{ s.x=(Math.random()-.5)*2; s.y=(Math.random()-.5)*2; s.z=.2+Math.random()*1.8; s.pz=s.z;
      s.t=Math.random(); return s; };
    for(let i=0;i<N;i++) stars.push(spawn({}));
    const T=2300, t0=performance.now();
    const ease=p=>p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
    function frame(now){
      const p=Math.min(1,(now-t0)/T);
      /* speed: a slow start, a violent acceleration, then flat out */
      const speed=.002+ease(Math.min(1,p*1.25))*.09;
      x.fillStyle=`rgba(0,0,0,${p<.15?.9:.35})`;            /* short trails early, long streaks later */
      x.fillRect(0,0,W,H);
      const cx=W/2, cy=H/2, F=Math.max(W,H)*.55;
      x.lineCap="round";
      for(const s of stars){
        s.pz=s.z; s.z-=speed;
        if(s.z<=.02){ spawn(s); s.z=2; s.pz=2; continue; }
        const sx=cx+s.x/s.z*F, sy=cy+s.y/s.z*F, px=cx+s.x/s.pz*F, py=cy+s.y/s.pz*F;
        if(sx<-50||sx>W+50||sy<-50||sy>H+50){ spawn(s); s.z=2; s.pz=2; continue; }
        const b=Math.min(1,(2-s.z)/1.4);
        /* colour shifts from cold white to blue as it speeds up */
        const r=Math.round(255-60*p*s.t), g=Math.round(255-30*p), bl=255;
        x.strokeStyle=`rgba(${r},${g},${bl},${b})`;
        x.lineWidth=Math.max(.6,(1-s.z/2)*2.4);
        x.beginPath(); x.moveTo(px,py); x.lineTo(sx,sy); x.stroke();
      }
      /* the core of the galaxy grows ahead of you */
      const glow=Math.pow(p,2.2);
      if(glow>.01){
        const R=Math.max(W,H)*(.08+glow*1.1);
        const g=x.createRadialGradient(cx,cy,0,cx,cy,R);
        g.addColorStop(0,`rgba(255,248,235,${.9*glow})`); g.addColorStop(.25,`rgba(210,200,255,${.35*glow})`); g.addColorStop(1,"rgba(0,0,0,0)");
        x.fillStyle=g; x.fillRect(0,0,W,H);
      }
      if(p<1) requestAnimationFrame(frame);
      else {
        /* arrival: white out, then the flash fades into the sky */
        c.classList.add("arrived");
        arrive();
        setTimeout(()=>c.remove(),1400);
      }
    }
    x.fillStyle="#000"; x.fillRect(0,0,W,H);
    requestAnimationFrame(frame);
  }

  /* already remembered on this device: the gate is never shown */
  if(!locked()) box.hidden=true;

  return {locked, onOpen:fn=>{ if(!locked()) fn(); else listeners.push(fn); }};
})();
