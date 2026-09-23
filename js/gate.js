/* ==========================================================
   gate.js — the PIN screen in front of everything.
   · The PIN is never written in the code: only a PBKDF2 hash of it. The
     typed PIN is hashed the same way and compared.
   · Once the right PIN is typed on a device, that device remembers it
     (localStorage "nolan-device") and never asks again. Changing the PIN
     (a new hash here) makes every device ask again.
   · index.html marks the page as locked in <head> before painting, so
     nothing behind the gate ever flashes.
   · Right PIN: the keypad drifts away and a five-second flight into a
     galaxy ends in the page's own sky, at home.
   · Gate.lock() (Log out, in home) forgets the device and asks again.
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
    journey(done);
  }

  /* A spiral galaxy, drawn once, far away in the dark. The camera flies
     towards it for five seconds: slowly at first, then faster, while nearby
     stars drift past. At the end the galaxy fills the sky and the view
     dissolves into the page's own sky — no flash. */
  function galaxyImage(size){
    const c=document.createElement("canvas"); c.width=c.height=size;
    const x=c.getContext("2d"), R=size/2;
    const gauss=()=>(Math.random()+Math.random()+Math.random()+Math.random()-2)/2;
    x.translate(R,R); x.scale(1,.58);                       /* seen at an angle */
    /* the disk's own glow: warm in the middle, cooler outside */
    let g=x.createRadialGradient(0,0,0,0,0,R);
    g.addColorStop(0,"rgba(255,232,200,.5)"); g.addColorStop(.1,"rgba(235,210,185,.22)");
    g.addColorStop(.35,"rgba(150,150,200,.08)"); g.addColorStop(.75,"rgba(80,95,150,.03)"); g.addColorStop(1,"rgba(0,0,0,0)");
    x.fillStyle=g; x.beginPath(); x.arc(0,0,R,0,Math.PI*2); x.fill();
    /* stars along two logarithmic spiral arms (pitch ~22°), plus the ones in between */
    const B=2.5, r0=R*.05, N=Math.round(size*size*.028);
    for(let i=0;i<N;i++){
      const inArm=Math.random()<.72, u=Math.random();
      const r=r0+Math.pow(u,1.35)*(R*.95-r0);
      let a=Math.random()*Math.PI*2;
      if(inArm){ a=(i%2)*Math.PI+B*Math.log(r/r0)+gauss()*(.4+.22*(r/R)); }
      const px=Math.cos(a)*r+gauss()*R*.022, py=Math.sin(a)*r+gauss()*R*.022;
      const inner=r<R*.18, young=inArm&&!inner&&Math.random()<.45;
      const col=inner?`255,${215+Math.random()*30|0},${170+Math.random()*50|0}`:young?`${185+Math.random()*40|0},${205+Math.random()*30|0},255`:`255,${238+Math.random()*17|0},${215+Math.random()*30|0}`;
      const s=Math.random()<.015?1.8:.5+Math.random()*.8;
      x.fillStyle=`rgba(${col},${(inArm?.35:.18)+Math.random()*.5})`;
      x.fillRect(px,py,s,s);
    }
    /* star-forming knots: small pink and blue glows along the arms */
    for(let i=0;i<120;i++){
      const r=R*(.22+Math.random()*.65), a=(i%2)*Math.PI+B*Math.log(r/r0)+gauss()*.15;
      const px=Math.cos(a)*r, py=Math.sin(a)*r, rr=R*(.006+Math.random()*.012);
      const pink=Math.random()<.55;
      g=x.createRadialGradient(px,py,0,px,py,rr);
      g.addColorStop(0,pink?"rgba(255,140,190,.55)":"rgba(150,190,255,.55)"); g.addColorStop(1,"rgba(0,0,0,0)");
      x.fillStyle=g; x.beginPath(); x.arc(px,py,rr,0,Math.PI*2); x.fill();
    }
    /* dust lanes on the inner edge of each arm */
    x.globalCompositeOperation="destination-out";
    for(let i=0;i<420;i++){
      const r=R*(.12+Math.random()*.7), a=(i%2)*Math.PI+B*Math.log(r/r0)-.32+gauss()*.06;
      const px=Math.cos(a)*r, py=Math.sin(a)*r, rr=R*(.012+Math.random()*.02);
      g=x.createRadialGradient(px,py,0,px,py,rr); g.addColorStop(0,"rgba(0,0,0,.28)"); g.addColorStop(1,"rgba(0,0,0,0)");
      x.fillStyle=g; x.beginPath(); x.arc(px,py,rr,0,Math.PI*2); x.fill();
    }
    x.globalCompositeOperation="lighter";
    /* the bulge and the bright core */
    g=x.createRadialGradient(0,0,0,0,0,R*.2);
    g.addColorStop(0,"rgba(255,246,228,.95)"); g.addColorStop(.25,"rgba(255,226,190,.45)"); g.addColorStop(1,"rgba(0,0,0,0)");
    x.fillStyle=g; x.beginPath(); x.arc(0,0,R*.2,0,Math.PI*2); x.fill();
    x.setTransform(1,0,0,1,0,0);
    /* a soft haze over everything: the same picture, blurred and added on top */
    if("filter" in x){
      const h=document.createElement("canvas"); h.width=h.height=size;
      const hx=h.getContext("2d"); hx.filter=`blur(${Math.round(size/140)}px)`; hx.drawImage(c,0,0);
      x.globalCompositeOperation="lighter"; x.globalAlpha=.55; x.drawImage(h,0,0); x.globalAlpha=1;
    }
    x.globalCompositeOperation="source-over";
    return c;
  }

  function journey(arrive){
    const c=document.createElement("canvas"), x=c.getContext("2d");
    c.className="journey"; document.body.appendChild(c);
    const DPR=Math.min(devicePixelRatio||1,2), W=innerWidth, H=innerHeight;
    c.width=W*DPR; c.height=H*DPR; x.setTransform(DPR,0,0,DPR,0,0);
    const img=galaxyImage(highQuality()?1800:1100);
    const D=Math.hypot(W,H);
    /* nearby stars in 3D, drifting past the camera */
    const N=highQuality()?520:220, stars=[];
    const spawn=(s,far)=>{ s.x=(Math.random()-.5)*2.4; s.y=(Math.random()-.5)*2.4; s.z=far?1.6+Math.random()*.4:.1+Math.random()*1.9;
      s.b=.3+Math.random()*.7; s.warm=Math.random()<.3; return s; };
    for(let i=0;i<N;i++) stars.push(spawn({},false));
    const T=5000, t0=performance.now();
    const smooth=p=>p*p*(3-2*p);
    let revealed=false;
    function frame(now){
      const p=Math.min(1,(now-t0)/T);
      x.fillStyle="#000"; x.fillRect(0,0,W,H);
      /* the galaxy: appears, turns slowly and grows (exponential, like a steady flight) */
      const appear=Math.min(1,p/.18);
      const scale=D/img.width*(.22*Math.pow(22,smooth(p)));
      x.save(); x.globalAlpha=appear*(p>.82?1-(p-.82)/.18*.6:1);
      x.translate(W/2,H/2); x.rotate(-.35+p*.25); x.scale(scale,scale);
      x.drawImage(img,-img.width/2,-img.height/2); x.restore();
      /* nearby stars: speed follows the flight */
      const speed=.0025+Math.pow(smooth(p),1.6)*.03;
      const F=D*.5;
      for(const s of stars){
        const pz=s.z; s.z-=speed;
        if(s.z<=.05){ spawn(s,true); continue; }
        const sx=W/2+s.x/s.z*F, sy=H/2+s.y/s.z*F;
        if(sx<-20||sx>W+20||sy<-20||sy>H+20){ spawn(s,true); continue; }
        const near=Math.min(1,(2-s.z)/1.8), a=s.b*near*Math.min(1,p*4);
        const col=s.warm?"255,228,200":"225,232,255";
        if(speed>.012){
          /* at speed, a short soft trail */
          const qx=W/2+s.x/pz*F, qy=H/2+s.y/pz*F;
          x.strokeStyle=`rgba(${col},${a})`; x.lineWidth=Math.max(.5,near*1.6); x.lineCap="round";
          x.beginPath(); x.moveTo(qx,qy); x.lineTo(sx,sy); x.stroke();
        } else {
          x.fillStyle=`rgba(${col},${a})`; x.beginPath(); x.arc(sx,sy,Math.max(.4,near*1.3),0,Math.PI*2); x.fill();
        }
      }
      /* the last second: the page's sky shows through, and the journey fades into it */
      if(p>.8&&!revealed){ revealed=true; arrive(); }
      if(p>.8) c.style.opacity=String(1-(p-.8)/.2);
      if(p<1) requestAnimationFrame(frame); else c.remove();
    }
    requestAnimationFrame(frame);
  }

  /* ---------- log out: forget this device and show the PIN again ---------- */
  function lock(){
    try{ localStorage.removeItem(KEY); }catch(e){}
    pin=""; busy=false; paint(); msg.textContent="";
    box.classList.remove("granted","leaving","wrong","checking");
    box.hidden=false; box.classList.add("closing-in");
    root.setAttribute("data-locked","");
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
