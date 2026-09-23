/* ==========================================================
   universe.js — one universe for the whole app, drawn in 3D on a canvas
   (#universe) behind everything.
   · Home is the Nolan galaxy: you arrive there after the PIN, flying in
     from deep space, and it stays around you, low on one side.
   · Every section is another galaxy you can see from home: UC3M, Nolan
     (under construction) and the ones kept for what comes next. Entering
     a section flies the camera into its galaxy and its inside becomes the
     background; going back home flies you back out. Same scene all along.
   · Galaxies are clouds of thousands of stars (seeded, so they always look
     the same), each with its own shape and colours. Far away they are drawn from a small pre-rendered picture;
     up close, star by star.
   · Universe.go(scene, {animate, duration, onArrive}) moves the camera.
     Without animations (or Quality = Low) it simply jumps.
   ========================================================== */
const Universe=(function(){
  const cv=$("#universe");
  const HQ=highQuality();
  /* every galaxy: its kind, size, angle, colours, and where it sits seen from home
     (at: fraction of the half screen, x to the right and y down; z: how far) */
  /* each has its own colours: core (the bulge), stars (the disk, [colour, weight]) and glow (inner, outer) */
  const GALAXIES={
    /* home: a calm golden oval, rose at the edges */
    nolan:    {kind:"oval",      r:10,  n:6500, tilt:1.10, roll:-.50, at:{d:[-.8,.78],m:[-.95,.82]},  z:30,
               core:"255,214,160", stars:[["255,236,208",5],["255,200,170",2],["246,190,210",1.2],["220,226,255",.8]],
               glow:["255,205,150","210,140,150"]},
    /* UC3M: a lively blue spiral with a sea-green heart and pink star-forming knots */
    uc3m:     {kind:"spiral",    r:5.5, n:5200, tilt:.85,  roll:.55,  at:{d:[.62,-.42],m:[.62,-.56]}, z:60,
               core:"200,255,232", stars:[["190,214,255",4],["150,235,215",2],["236,242,255",2],["255,170,205",.9]],
               glow:["120,230,200","80,130,230"]},
    /* Nolan (under construction): a big round ember, amber and orange */
    forge:    {kind:"elliptical",r:4.2, n:3200, tilt:.6,   roll:-.2,  at:{d:[-.66,-.5],m:[-.62,-.74]}, z:75,
               core:"255,196,120", stars:[["255,176,96",3],["255,214,160",2],["255,140,80",1]],
               glow:["255,170,90","200,90,40"]},
    /* Andrómeda: a wide violet spiral, seen almost flat */
    andromeda:{kind:"spiral",    r:6,   n:3800, tilt:.55,  roll:-.9,  at:{d:[.82,.42],m:[.7,.72]},     z:110,
               core:"236,216,255", stars:[["200,180,255",3],["170,200,255",2],["255,200,240",1],["240,236,255",1.5]],
               glow:["200,170,255","110,90,200"]},
    /* Sombrero: seen edge-on, a bright white bulge cut by a dark lane of dust */
    sombrero: {kind:"edge",      r:4.6, n:3000, tilt:1.52, roll:.18,  at:{d:[-.2,-.78],m:[.05,-.86]},  z:130,
               core:"255,246,226", stars:[["255,240,215",3],["230,230,240",2],["255,210,170",1]],
               glow:["255,240,215","180,170,160"]}
  };
  /* scenes: where the camera stands */
  const IDS=Object.keys(GALAXIES);
  let W=0,H=0,F=1,DPR=1,x=null;
  let cam={x:0,y:0,z:0}, scene=null, anim=null;

  let seed=1;
  const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
  const gauss=()=>{ let u=0; for(let i=0;i<4;i++) u+=rnd(); return (u-2)/1.15; };
  const pick=list=>{ const tot=list.reduce((t,c)=>t+c[1],0); let r=rnd()*tot; for(const c of list){ r-=c[1]; if(r<=0) return c[0]; } return list[0][0]; };

  /* a galaxy's stars, in its own frame (unit ≈ its radius) */
  function makeStars(g,idx){
    seed=idx*7919+11;
    const n=Math.round(g.n*(HQ?1:.4)), out=[];
    const bulgeShare={elliptical:1,spiral:.18,edge:.42,oval:.3}[g.kind];
    for(let i=0;i<n;i++){
      let px,py,pz,col;
      if(rnd()<bulgeShare){
        const s=g.kind==="elliptical"?[.42,.34,.3]:g.kind==="edge"?[.14,.12,.12]:[.12,.1,.08];
        px=gauss()*s[0]; py=gauss()*s[1]; pz=gauss()*s[2];
        col=rnd()<.6?g.core:pick(g.stars);
      } else {
        let r,th;
        const arms=g.kind==="spiral"?.55:g.kind==="oval"?.18:0;
        do{ r=-Math.log(1-rnd()*.985)*(g.kind==="edge"?.36:.3); th=rnd()*Math.PI*2; }
        while(arms&&rnd()>1-arms+arms*Math.cos(2*(th-2.1*Math.log(r*10+.6))));
        px=Math.cos(th)*r; py=Math.sin(th)*r*(g.kind==="oval"?.78:1); pz=gauss()*(g.kind==="edge"?.012:.02+r*.04);
        col=pick(g.stars);
      }
      out.push({px,py,pz,col,b:.25+rnd()*.65,s:.6+rnd()*.9});
    }
    return out;
  }
  const galaxyStars={}; IDS.forEach((id,i)=>{ galaxyStars[id]=makeStars(GALAXIES[id],i+1); });

  /* stars scattered through space, so a flight passes between them */
  seed=424242;
  const field=[]; for(let i=0;i<(HQ?1400:600);i++) field.push({x:(rnd()-.5)*300,y:(rnd()-.5)*200,z:-440+rnd()*620,b:.25+rnd()*.7});

  /* ---------- placing everything for this screen ---------- */
  let world={};             /* per galaxy: centre and stars in world coordinates, glow and far sprite */
  function place(){
    DPR=Math.min(devicePixelRatio||1,2); W=innerWidth; H=innerHeight; F=Math.min(W,H)*1.15;
    cv.width=Math.round(W*DPR); cv.height=Math.round(H*DPR);
    x=cv.getContext("2d"); x.setTransform(DPR,0,0,DPR,0,0);
    const small=W<760;
    IDS.forEach(id=>{
      const g=GALAXIES[id], at=small?g.at.m:g.at.d;
      const cx=at[0]*(W/2)/F*g.z, cy=at[1]*(H/2)/F*g.z;
      const ct=Math.cos(g.tilt), st=Math.sin(g.tilt), cr=Math.cos(g.roll), sr=Math.sin(g.roll);
      const pts=galaxyStars[id].map(s=>{
        const y1=s.py*ct-s.pz*st, z1=s.py*st+s.pz*ct;
        const wx=s.px*cr-y1*sr, wy=s.px*sr+y1*cr;
        return {x:cx+wx*g.r*3, y:cy+wy*g.r*3, z:g.z+z1*g.r*3, col:s.col, b:s.b, s:s.s};
      });
      world[id]={g,cx,cy,cz:g.z,r:g.r,pts,sprite:sprite(g,pts,cx,cy)};
    });
    if(!scene) scene=startScene();
    if(!anim) Object.assign(cam,camFor(scene));
    draw();
  }
  /* a small picture of a galaxy, for when it is far away */
  function sprite(g,pts,cx,cy){
    const S=256, c=document.createElement("canvas"); c.width=c.height=S;
    const k=c.getContext("2d"), R=g.r*3.3, sc=S/2/R;
    k.globalCompositeOperation="lighter";
    glowShape(k,g,S/2,S/2,S/2,1);
    for(const p of pts){ k.fillStyle=`rgba(${p.col},${p.b*.55})`; k.fillRect(S/2+(p.x-cx)*sc,S/2+(p.y-cy)*sc,1,1); }
    if(g.kind==="edge") dustLane(k,g,S/2,S/2,S/2,1);
    return c;
  }
  /* the glow: an ellipse along the disk in the galaxy's colours, and a rounder core */
  function glowShape(k,g,px,py,pr,alpha){
    const flat=Math.max(.12,Math.abs(Math.cos(g.tilt)));
    k.save(); k.translate(px,py); k.rotate(g.roll);
    /* the disk */
    k.save(); k.scale(1,g.kind==="elliptical"?.8:flat);
    let gr=k.createRadialGradient(0,0,0,0,0,pr);
    gr.addColorStop(0,`rgba(${g.glow[0]},${.32*alpha})`); gr.addColorStop(.3,`rgba(${g.glow[1]},${.12*alpha})`); gr.addColorStop(1,`rgba(${g.glow[1]},0)`);
    k.fillStyle=gr; k.beginPath(); k.arc(0,0,pr,0,6.283); k.fill(); k.restore();
    /* the core: small and bright; round, or a little squashed */
    const cr=pr*(g.kind==="elliptical"?.45:g.kind==="edge"?.3:.22);
    k.save(); k.scale(1,g.kind==="edge"?.75:Math.max(.55,flat));
    gr=k.createRadialGradient(0,0,0,0,0,cr);
    gr.addColorStop(0,`rgba(255,255,255,${.7*alpha})`); gr.addColorStop(.2,`rgba(${g.core},${.5*alpha})`); gr.addColorStop(1,`rgba(${g.core},0)`);
    k.fillStyle=gr; k.beginPath(); k.arc(0,0,cr,0,6.283); k.fill(); k.restore();
    k.restore();
  }
  /* Sombrero's dark lane of dust, right across its middle */
  function dustLane(k,g,px,py,pr,alpha){
    k.save(); k.globalCompositeOperation="source-over"; k.translate(px,py); k.rotate(g.roll); k.scale(1,.05);
    const gr=k.createRadialGradient(0,0,0,0,0,pr*.9);
    gr.addColorStop(0,`rgba(4,4,8,${.75*alpha})`); gr.addColorStop(.8,`rgba(4,4,8,${.5*alpha})`); gr.addColorStop(1,"rgba(4,4,8,0)");
    k.fillStyle=gr; k.beginPath(); k.arc(0,0,pr*.9,0,6.283); k.fill(); k.restore();
  }

  /* ---------- scenes ---------- */
  function camFor(s){
    if(s==="gate") return {x:0,y:0,z:-430};
    if(s==="home"||!GALAXIES[s]||!world[s]) return {x:0,y:0,z:0};
    const w=world[s], r=w.r*3;
    /* close to the galaxy, a little off its centre: the core glows high on the right, over the header */
    return {x:w.cx-r*.5, y:w.cy+r*.32, z:w.cz-r*1.3};
  }
  function startScene(){
    if(document.documentElement.hasAttribute("data-locked")) return "gate";
    const h=location.hash.slice(1);
    return !h||/^(home|notes|settings|nolan|soon|inicio|notas|ajustes|configuracion)/.test(h)?"home":"uc3m";
  }

  /* ---------- drawing a frame ---------- */
  function draw(fieldBoost=0){
    if(!x) return;
    x.setTransform(DPR,0,0,DPR,0,0);
    x.clearRect(0,0,W,H);
    x.globalCompositeOperation="lighter";
    const cx0=W/2, cy0=H/2;
    /* stars scattered in space */
    x.fillStyle="#E6EBFF";
    for(const s of field){
      const dz=s.z-cam.z; if(dz<1) continue;
      const k=F/dz, sx=cx0+(s.x-cam.x)*k*.4, sy=cy0+(s.y-cam.y)*k*.4;
      if(sx<-3||sx>W+3||sy<-3||sy>H+3) continue;
      const a=s.b*Math.min(1,60/dz)*(.35+fieldBoost);
      if(a<.02) continue;
      const sz=Math.min(2.4,.6+k*.01);
      x.globalAlpha=Math.min(1,a); x.fillRect(sx-sz/2,sy-sz/2,sz,sz);
    }
    /* galaxies, far to near */
    const order=IDS.map(id=>world[id]).filter(Boolean).sort((a,b)=>(b.cz-cam.z)-(a.cz-cam.z));
    for(const w of order){
      const dz=w.cz-cam.z, R=w.r*3;
      if(dz<-R) continue;                                      /* well behind us */
      const k=F/Math.max(dz,.5), px=cx0+(w.cx-cam.x)*k, py=cy0+(w.cy-cam.y)*k, pr=R*1.1*k;
      /* the glow: fades once we are inside */
      const inside=Math.min(1,Math.max(0,(dz-R*.5)/(R*1.2)));
      if(dz>0&&pr>2&&inside>0&&(pr>60)){ x.globalAlpha=1; glowShape(x,w.g,px,py,pr*1.05,inside*Math.min(1,(pr-60)/60)); }
      /* far: the picture; near: star by star; in between, one fades into the other */
      const mix=Math.min(1,Math.max(0,(pr-70)/60));
      if(mix<1&&dz>0){
        x.globalAlpha=1-mix;
        const size=pr*2;                                   /* the picture spans the galaxy's full size */
        x.drawImage(w.sprite,px-size/2,py-size/2,size,size);
      }
      if(mix>0){
        let lastCol="";
        for(const p of w.pts){
          const pz=p.z-cam.z; if(pz<.3) continue;
          const kk=F/pz, sx=cx0+(p.x-cam.x)*kk, sy=cy0+(p.y-cam.y)*kk;
          if(sx<-4||sx>W+4||sy<-4||sy>H+4) continue;
          const sz=Math.min(3,p.s*(.45+kk*.0035));
          if(p.col!==lastCol){ x.fillStyle=`rgb(${p.col})`; lastCol=p.col; }
          x.globalAlpha=mix*p.b*Math.min(1,.3+kk*.004)*Math.min(1,pz/1.2);
          if(sz<2) x.fillRect(sx-sz/2,sy-sz/2,sz,sz); else { x.beginPath(); x.arc(sx,sy,sz/2,0,6.283); x.fill(); }
        }
        if(w.g.kind==="edge"&&dz>0){ x.globalAlpha=1; dustLane(x,w.g,px,py,pr,mix); x.globalCompositeOperation="lighter"; }
      }
    }
    x.globalCompositeOperation="source-over"; x.globalAlpha=1;
  }

  /* ---------- moving the camera ---------- */
  const easeInOut=p=>p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
  function go(to,{animate=true,duration=2600,onArrive,arriveAt=.85}={}){
    /* already flying there: let that flight finish */
    if(anim&&to===scene){ if(onArrive) onArrive(); return; }
    if(anim){ cancelAnimationFrame(anim.raf); anim=null; }
    const sameScene=to===scene;
    scene=to;
    if(!x){ if(onArrive) onArrive(); return; }          /* no universe drawn (Quality = Low) */
    const target=camFor(to), from={...cam};
    if(!animate||!fancy()||sameScene){ Object.assign(cam,target); draw(); if(onArrive) onArrive(); return; }
    const t0=performance.now(); let arrived=false;
    const me={raf:0}; anim=me;
    const step=now=>{
      if(anim!==me) return;                               /* replaced by a newer flight */
      const p=Math.min(1,(now-t0)/duration), e=easeInOut(p);
      cam.x=from.x+(target.x-from.x)*e; cam.y=from.y+(target.y-from.y)*e; cam.z=from.z+(target.z-from.z)*e;
      /* while flying, the scattered stars shine more: that is where the sense of speed comes from */
      draw(Math.sin(Math.PI*p)*.9);
      if(p>=arriveAt&&!arrived){ arrived=true; if(onArrive) onArrive(); }
      if(anim!==me) return;
      if(p<1) me.raf=requestAnimationFrame(step); else anim=null;
    };
    me.raf=requestAnimationFrame(step);
  }

  if(cv&&HQ){
    place();
    /* only a real change of size: the phone's address bar showing or hiding is not one */
    let rz=0; window.addEventListener("resize",()=>{ clearTimeout(rz); rz=setTimeout(()=>{
      if(Math.abs(innerWidth-W)>2||Math.abs(innerHeight-H)>140) place(); },200); });
  }
  return {go, scene:()=>scene, busy:()=>!!anim, GALAXIES};
})();
