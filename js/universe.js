/* ==========================================================
   universe.js — one universe for the whole app, drawn in 3D on a canvas
   (#universe) behind everything.
   · Home is the Nolan galaxy: you arrive there after the PIN, flying in
     from deep space, and it stays around you, low on one side.
   · Every section is another galaxy you can see from home: UC3M, Nolan
     (under construction) and the ones kept for what comes next. Entering
     a section flies the camera into its galaxy and its inside becomes the
     background; going back home flies you back out. Same scene all along.
   · Each galaxy is a photographic picture computed by cosmos.js (bright
     core, clumpy arms, dust lanes, pink star-forming knots), sized for the
     screen so it stays sharp, with a few thousand real stars on top that
     you fly between when you get close. A quick small version appears
     first, then the full one; after the first visit they are saved.
   · It is alive (Animations = All): spiral disks turn slowly around their
     core, the camera floats gently (near things drift against far ones)
     and some stars breathe. It pauses when the tab is hidden or after a
     while without touching anything.
   · Far behind everything, dozens of tiny galaxies, like a deep-field photo.
   · Universe.go(scene, {animate, duration, onArrive}) moves the camera.
     Without animations (or Quality = Low) it simply jumps.
   ========================================================== */
const Universe=(function(){
  const cv=$("#universe");
  const HQ=highQuality();
  /* every galaxy: its kind, size, angle, colours, and where it sits seen from home
     (at: fraction of the half screen, x to the right and y down; z: how far).
     core and stars: the colours of its own stars ([colour, weight]).
     tex: how cosmos.js paints its picture (see cosmos.js); texA: how bright it is drawn.
     spin: minutes per turn of the disk (only spirals seen at an angle turn; minus = the
     way their arms trail) */
  const GALAXIES={
    /* home: a calm golden spiral with soft arms */
    nolan:    {kind:"oval",      r:10,  n:6500, tilt:1.10, roll:-.50, at:{d:[-.8,.78],m:[-.95,.82]},  z:30,
               core:"255,214,160", stars:[["255,236,208",5],["255,200,170",2],["246,190,210",1.2],["220,226,255",.8]],
               spin:-12, texA:.62,
               tex:{seed:11,speck:.12,grain:.004,core:"255,208,150",disk:"255,228,200",arm:"205,215,255",knot:"255,150,190",bulge:1.6,bulgeR:.13,bulgeQ:.8,sersic:2,disk0:.8,h:.26,armAmp:.4,pitch:.34,knots:.3,dust:1.3}},
    /* UC3M: a lively blue spiral with a warm heart and pink star-forming knots */
    uc3m:     {kind:"spiral",    r:5.5, n:5200, tilt:.85,  roll:.55,  at:{d:[.62,-.42],m:[.62,-.56]}, z:60,
               core:"255,232,196", stars:[["190,214,255",4],["170,225,240",2],["236,242,255",2],["255,170,205",.9]],
               spin:-9,
               tex:{seed:23,core:"255,226,180",disk:"215,222,245",arm:"150,190,255",knot:"255,120,180",bulge:1.2,bulgeR:.09,bulgeQ:.85,sersic:2,disk0:1.3,h:.27,armAmp:.8,pitch:.36,knots:.9,dust:2}},
    /* Nolan (under construction): a big round ember, amber and orange */
    forge:    {kind:"elliptical",r:4.2, n:3200, tilt:.6,   roll:-.2,  at:{d:[-.66,-.5],m:[-.62,-.74]}, z:75,
               core:"255,196,120", stars:[["255,176,96",3],["255,214,160",2],["255,140,80",1]],
               texA:.8,
               tex:{seed:37,core:"255,214,170",disk:"255,190,130",arm:"255,190,130",knot:"0,0,0",Ie:.11,bulgeR:.26,bulgeQ:.8,sersic:4,disk0:0,h:.3,armAmp:0,knots:0,dust:0,exposure:1.5}},
    /* Andrómeda: a wide violet spiral, seen steeply from the side */
    andromeda:{kind:"spiral",    r:6,   n:3800, tilt:1.2,  roll:-.9,  at:{d:[.82,.42],m:[.7,.72]},     z:110,
               core:"236,216,255", stars:[["200,180,255",3],["170,200,255",2],["255,200,240",1],["240,236,255",1.5]],
               spin:-15,
               tex:{seed:41,core:"255,222,190",disk:"225,215,245",arm:"175,170,255",knot:"255,140,210",bulge:1.5,bulgeR:.1,bulgeQ:.8,sersic:2,disk0:1.1,h:.3,armAmp:.6,pitch:.26,knots:.55,dust:1.7}},
    /* Sombrero: seen edge-on, a bright white bulge cut by a dark lane of dust */
    sombrero: {kind:"edge",      r:4.6, n:3000, tilt:1.52, roll:.18,  at:{d:[-.2,-.78],m:[.05,-.86]},  z:130,
               core:"255,246,226", stars:[["255,240,215",3],["230,230,240",2],["255,210,170",1]],
               tex:{seed:53,core:"255,236,208",disk:"235,226,210",arm:"235,226,210",knot:"0,0,0",Ie:.2,bulgeR:.17,bulgeQ:.62,sersic:4,disk0:1.1,h:.34,armAmp:0,thick:.07,knots:0,dust:0,band:3.2,bandW:.032,exposure:1.6}}
  };
  const IDS=Object.keys(GALAXIES);
  let W=0,H=0,F=1,DPR=1,x=null;
  let base={x:0,y:0,z:0};            /* where the camera stands (flights move it) */
  let cam={x:0,y:0,z:0};             /* …plus its gentle float: what is drawn */
  let scene=null, anim=null;

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
      /* about one star in four breathes slowly (periods of 5 to 12 seconds) */
      const tw=rnd()<.26?.35+rnd()*.35:0;
      out.push({px,py,pz,col,b:.25+rnd()*.65,s:.6+rnd()*.9,tw,tf:.5+rnd()*.75,tp:rnd()*6.283});
    }
    /* by colour, so the brush changes colour as little as possible */
    return out.sort((a,b)=>a.col<b.col?-1:a.col>b.col?1:0);
  }
  const galaxyStars={}; IDS.forEach((id,i)=>{ galaxyStars[id]=makeStars(GALAXIES[id],i+1); });

  /* stars scattered through space, so a flight passes between them */
  seed=424242;
  const field=[]; for(let i=0;i<(HQ?1400:600);i++) field.push({x:(rnd()-.5)*300,y:(rnd()-.5)*200,z:-440+rnd()*620,b:.25+rnd()*.7});

  /* ---------- placing everything for this screen ---------- */
  let world={};             /* per galaxy: centre, size, its stars and a picture made of them */
  function place(){
    DPR=Math.min(devicePixelRatio||1,2); W=innerWidth; H=innerHeight; F=Math.min(W,H)*1.15;
    cv.width=Math.round(W*DPR); cv.height=Math.round(H*DPR);
    x=cv.getContext("2d"); x.setTransform(DPR,0,0,DPR,0,0);
    x.imageSmoothingQuality="high";
    const small=W<760;
    IDS.forEach(id=>{
      const g=GALAXIES[id], at=small?g.at.m:g.at.d;
      const cx=at[0]*(W/2)/F*g.z, cy=at[1]*(H/2)/F*g.z;
      const w={id,g,cx,cy,cz:g.z,r:g.r,R:g.r*3,stars:galaxyStars[id],
               ct:Math.cos(g.tilt),st:Math.sin(g.tilt),cr:Math.cos(g.roll),sr:Math.sin(g.roll),
               ci:Math.max(Math.cos(g.tilt),.1)};
      w.sprite=sprite(w);
      world[id]=w;
    });
    if(!scene) scene=startScene();
    if(!anim) base={...camFor(scene)};
    draw();
  }
  /* a star of a galaxy, in the world: turned by the galaxy's spin, then tilted and rolled */
  function starAt(w,s,ca,sa,o){
    const px=s.px*ca-s.py*sa, py=s.px*sa+s.py*ca;
    const y1=py*w.ct-s.pz*w.st, z1=py*w.st+s.pz*w.ct;
    o.x=w.cx+(px*w.cr-y1*w.sr)*w.R; o.y=w.cy+(px*w.sr+y1*w.cr)*w.R; o.z=w.cz+z1*w.R;
    return o;
  }
  /* a small picture of a galaxy made of its own stars: shown only until its photograph is ready */
  function sprite(w){
    const S=256, c=document.createElement("canvas"); c.width=c.height=S;
    const k=c.getContext("2d"), R=w.g.r*3.3, sc=S/2/R, o={};
    k.globalCompositeOperation="lighter";
    for(const s of w.stars){ starAt(w,s,1,0,o); k.fillStyle=`rgba(${s.col},${s.b*.55})`; k.fillRect(S/2+(o.x-w.cx)*sc,S/2+(o.y-w.cy)*sc,1,1); }
    return c;
  }

  /* ---------- photographs (cosmos.js), painted in the background ---------- */
  const tex={};             /* id → {full, small, at}: full = {disk, bulge, crop}; small: the same, little */
  const FADE=1400;
  const texAlpha=t=>t&&t.at?Math.min(1,(performance.now()-t.at)/FADE):0;
  /* a little copy for when the galaxy is small on screen: sharper than shrinking the big one */
  async function shrink(pic,S){
    if(!window.createImageBitmap) return null;
    try{
      const o={resizeWidth:S,resizeHeight:S,resizeQuality:"high"};
      const bs=pic.bulge?Math.max(8,Math.round(S*pic.crop)):0;
      return {disk:await createImageBitmap(pic.disk,o),bulge:pic.bulge?await createImageBitmap(pic.bulge,{resizeWidth:bs,resizeHeight:bs,resizeQuality:"high"}):null,crop:pic.crop,size:S};
    }catch(e){ return null; }
  }
  function arrived(obj){
    if(!obj.at) obj.at=fancy()?performance.now():-1e9;     /* without animations it simply appears */
    kick();
  }
  /* the size each picture needs to stay sharp: its biggest size on this screen (up close, in its own scene) */
  function sizeFor(id){
    const w=world[id], k=id==="nolan"?F/30:F/(1.3*w.R);    /* home for Nolan, its own scene for the others */
    const need=2*w.R*1.1*k*DPR, cap=W<760?1536:2048;
    return Math.max(384,Math.min(cap,Math.ceil(need/128)*128));
  }
  function paint(){
    if(typeof Cosmos==="undefined") return;
    /* home's galaxy first (it is the one you see right after the PIN), then UC3M, then the rest */
    IDS.forEach((id,i)=>{
      const g=GALAXIES[id], size=sizeFor(id), t=tex[id]={full:null,small:null,at:0};
      const p={...g.tex,speck:size>600?.2:.44,...(g.tex.speck!=null?{speck:g.tex.speck}:{}),size,tilt:g.tilt,roll:g.roll,split:!!g.spin};
      Cosmos.galaxy(p,{priority:i,preview:384,onPreview:pic=>{ if(!t.full){ t.small={...pic,size:384}; arrived(t); } }})
        .then(async pic=>{ t.full=pic; t.small=(await shrink(pic,384))||t.small; arrived(t); });
    });
    /* then a handful of tiny galaxies for the deep field */
    DEEP_KINDS.forEach((p,i)=>Cosmos.galaxy(p,{priority:20+i}).then(pic=>{ deep.filter(d=>d.kind===i).forEach(d=>{ d.img=pic.disk; arrived(d); }); }));
  }

  /* ---------- the deep field: tiny far galaxies, like the Hubble Deep Field ---------- */
  seed=97531;
  const DEEP_KINDS=[];
  for(let i=0;i<7;i++){
    const type=i%3;                                   /* 0 spiral, 1 elliptical, 2 edge-on */
    const warm=rnd();
    DEEP_KINDS.push(type===1
      ?{size:128,seed:200+i,tilt:rnd()*.8,roll:rnd()*6.28,core:"255,214,170",disk:"255,200,150",arm:"255,200,150",knot:"0,0,0",Ie:.3,bulgeR:.2+rnd()*.1,bulgeQ:.8,sersic:4,disk0:0,h:.3,armAmp:0,knots:0,dust:0,grain:.001,exposure:1.6}
      :{size:128,seed:200+i,tilt:type===2?1.45:.3+rnd()*.9,roll:rnd()*6.28,core:warm>.5?"255,220,180":"255,236,210",
        disk:"220,222,240",arm:warm>.5?"160,190,255":"200,190,255",knot:"255,140,190",bulge:1.3,bulgeR:.1,bulgeQ:.85,sersic:2,
        disk0:1.1,h:.28,armAmp:type===2?0:.6,pitch:.3+rnd()*.12,knots:.4,dust:type===2?0:1.2,thick:type===2?.06:0,band:type===2?2.5:0,bandW:.04,grain:.001,exposure:2});
  }
  const deep=[];
  for(let i=0;i<(HQ?46:0);i++){
    deep.push({kind:Math.floor(rnd()*DEEP_KINDS.length),x:(rnd()-.5)*380,y:(rnd()-.5)*260,z:230+rnd()*200,
               s:1.6+Math.pow(rnd(),2)*5,rot:rnd()*6.28,a:.35+rnd()*.5,img:null,at:0});
  }

  /* ---------- scenes ---------- */
  function camFor(s){
    if(s==="gate") return {x:0,y:0,z:-430};
    if(s==="home"||!GALAXIES[s]||!world[s]) return {x:0,y:0,z:0};
    const w=world[s], r=w.R;
    /* close to the galaxy, a little off its centre: the core glows high on the right, over the header */
    /* on a phone the screen is narrow: the core sits nearer the middle so the galaxy stays in view */
    return W<760?{x:w.cx-r*.25, y:w.cy+r*.82, z:w.cz-r*1.3}:{x:w.cx-r*.5, y:w.cy+r*.32, z:w.cz-r*1.3};
  }
  function startScene(){
    if(document.documentElement.hasAttribute("data-locked")) return "gate";
    const h=location.hash.slice(1);
    return !h||/^(home|notes|settings|nolan|soon|inicio|notas|ajustes|configuracion)/.test(h)?"home":"uc3m";
  }

  /* ---------- life: time that only runs while the universe is alive ---------- */
  let life=0;               /* seconds of life so far */
  const alive=()=>fancy()&&!document.hidden&&!document.body.classList.contains("idle");
  /* the camera floats: slow, never quite repeating, a few % of the way to home's galaxy */
  function float(){
    const t=life, a=Math.min(1,life/6);                     /* it starts gently */
    return {x:a*(Math.sin(t*.061)*.9+Math.sin(t*.147)*.25), y:a*(Math.cos(t*.053)*.55+Math.sin(t*.119)*.18), z:a*Math.sin(t*.043)*1.4};
  }
  const angleOf=g=>g.spin?life*2*Math.PI/(g.spin*60):0;

  /* ---------- drawing a frame ---------- */
  const tmp={};
  function draw(fieldBoost=0){
    if(!x) return;
    const f=float(); cam.x=base.x+f.x; cam.y=base.y+f.y; cam.z=base.z+f.z;
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
    /* the deep field: tiny galaxies far behind everything */
    x.globalCompositeOperation="source-over";
    for(const d of deep){
      if(!d.img) continue;
      const dz=d.z-cam.z; if(dz<1) continue;
      const k=F/dz, sx=cx0+(d.x-cam.x)*k, sy=cy0+(d.y-cam.y)*k, sz=d.s*k;
      if(sz<1.5||sx<-sz||sx>W+sz||sy<-sz||sy>H+sz) continue;
      x.globalAlpha=d.a*texAlpha(d)*Math.min(1,(sz-1.5)/4);
      x.save(); x.translate(sx,sy); x.rotate(d.rot); x.drawImage(d.img,-sz,-sz,sz*2,sz*2); x.restore();
    }
    x.globalCompositeOperation="lighter";
    /* galaxies, far to near */
    const order=IDS.map(id=>world[id]).filter(Boolean).sort((a,b)=>(b.cz-cam.z)-(a.cz-cam.z));
    for(const w of order){
      const dz=w.cz-cam.z, R=w.R;
      if(dz<-R) continue;                                      /* well behind us */
      const k=F/Math.max(dz,.5), px=cx0+(w.cx-cam.x)*k, py=cy0+(w.cy-cam.y)*k, pr=R*1.1*k;
      const t=tex[w.id], ta=texAlpha(t), ang=angleOf(w.g);
      /* the photograph: fades away as we fly into it, so we pass between its stars */
      const through=Math.min(1,Math.max(0,(dz-R*.12)/(R*.7)));
      if(ta>0&&through>0&&px+pr>0&&px-pr<W&&py+pr>0&&py-pr<H){
        /* the small copy when it is small on screen, the big one otherwise */
        const pic=(!t.full||(t.small&&pr*2*DPR<=t.small.size*1.3))?t.small:t.full;
        if(pic){
          x.globalAlpha=ta*through*(w.g.texA||1);
          x.save(); x.translate(px,py);
          /* the disk turns in its own plane: seen at an angle, that is an ellipse turning into itself
             (un-roll, un-tilt, turn, tilt, roll) */
          if(ang&&pic.bulge){
            const c=Math.cos(ang), s=Math.sin(ang), q=w.ci;
            x.rotate(w.g.roll); x.transform(1,0,0,q,0,0); x.transform(c,s,-s,c,0,0); x.transform(1,0,0,1/q,0,0); x.rotate(-w.g.roll);
          }
          /* painted normally, not added: the picture carries its own see-through edges */
          x.globalCompositeOperation="source-over";
          x.drawImage(pic.disk,-pr,-pr,pr*2,pr*2);
          x.restore();
          /* the bulge does not turn: it is added on top, where it was */
          if(pic.bulge){
            const br=pr*pic.crop;
            x.globalCompositeOperation="lighter";
            x.drawImage(pic.bulge,px-br,py-br,br*2,br*2);
          }
          x.globalCompositeOperation="lighter";
        }
      }
      /* until the photograph arrives: far, a picture made of its stars; near, star by star */
      const mix=Math.min(1,Math.max(0,(pr-70)/60));
      if(ta<1&&mix<1&&dz>0){
        x.globalAlpha=(1-mix)*(1-ta);
        x.drawImage(w.sprite,px-pr,py-pr,pr*2,pr*2);
      }
      /* its stars: over the photograph they are only the brightest few, resolved */
      const starA=mix*(1-ta*.62)*(ta>0?Math.max(.35,1-through*.5):1);
      if(starA>0){
        let lastCol="";
        const ca=Math.cos(ang), sa=Math.sin(ang);
        for(const s of w.stars){
          const p=starAt(w,s,ca,sa,tmp);
          const pz=p.z-cam.z; if(pz<.3) continue;
          const kk=F/pz, sx=cx0+(p.x-cam.x)*kk, sy=cy0+(p.y-cam.y)*kk;
          if(sx<-4||sx>W+4||sy<-4||sy>H+4) continue;
          const sz=Math.min(3,s.s*(.45+kk*.0035));
          if(s.col!==lastCol){ x.fillStyle=`rgb(${s.col})`; lastCol=s.col; }
          const breathe=s.tw?1-s.tw*(.5+.5*Math.sin(life*s.tf+s.tp)):1;
          x.globalAlpha=starA*s.b*breathe*Math.min(1,.3+kk*.004)*Math.min(1,pz/1.2);
          if(sz<2) x.fillRect(sx-sz/2,sy-sz/2,sz,sz); else { x.beginPath(); x.arc(sx,sy,sz/2,0,6.283); x.fill(); }
        }
      }
    }
    x.globalCompositeOperation="source-over"; x.globalAlpha=1;
  }

  /* ---------- one loop for everything that moves ----------
     It runs only while something needs it: a flight, a picture fading in, or
     life (then at about 30 frames a second, which is plenty for slow motion). */
  let raf=0, lastT=0, lastDraw=0, cost=8;
  const fading=()=>Object.values(tex).some(t=>t.at&&texAlpha(t)<1)||deep.some(d=>d.img&&texAlpha(d)<1);
  function kick(){ if(!raf&&x){ lastT=performance.now(); raf=requestAnimationFrame(loop); } }
  function loop(now){
    raf=0;
    const dt=Math.min(.1,Math.max(0,(now-lastT)/1000)); lastT=now;
    const live=alive();
    if(live) life+=dt;
    let boost=0;
    if(anim) boost=anim.step(now);
    const busy=!!anim||fading();
    if(!busy&&!live) return;
    /* life alone is slow: about 30 frames a second, fewer if drawing is heavy on this device */
    if(busy||now-lastDraw>=Math.min(100,Math.max(31,cost*3))){
      const t0=performance.now(); draw(boost); cost=cost*.9+(performance.now()-t0)*.1; lastDraw=now;
    }
    raf=requestAnimationFrame(loop);
  }
  document.addEventListener("visibilitychange",kick);
  new MutationObserver(kick).observe(document.body,{attributes:true,attributeFilter:["class"]});

  /* ---------- moving the camera ---------- */
  const easeInOut=p=>p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
  function go(to,{animate=true,duration=2600,onArrive,arriveAt=.85}={}){
    /* already flying there: let that flight finish */
    if(anim&&to===scene){ if(onArrive) onArrive(); return; }
    anim=null;
    const sameScene=to===scene;
    scene=to;
    if(!x){ if(onArrive) onArrive(); return; }          /* no universe drawn (Quality = Low) */
    const target=camFor(to), from={...base};
    if(!animate||!fancy()||sameScene){ base={...target}; draw(); if(onArrive) onArrive(); return; }
    const t0=performance.now(); let reached=false;
    const me={step(now){
      const p=Math.min(1,(now-t0)/duration), e=easeInOut(p);
      base={x:from.x+(target.x-from.x)*e, y:from.y+(target.y-from.y)*e, z:from.z+(target.z-from.z)*e};
      if(p>=arriveAt&&!reached){ reached=true; if(onArrive) onArrive(); }
      if(p>=1&&anim===me) anim=null;
      /* while flying, the scattered stars shine more: that is where the sense of speed comes from */
      return Math.sin(Math.PI*p)*.9;
    }};
    anim=me; kick();
  }

  if(cv&&HQ){
    place();
    paint();
    kick();
    /* only a real change of size: the phone's address bar showing or hiding is not one */
    let rz=0; window.addEventListener("resize",()=>{ clearTimeout(rz); rz=setTimeout(()=>{
      if(Math.abs(innerWidth-W)>2||Math.abs(innerHeight-H)>140) place(); },200); });
  }
  /* seek(seconds): jump life forward (tests and debugging) */
  return {go, seek:v=>{ life=v; draw(); }, scene:()=>scene, busy:()=>!!anim, painted:()=>Object.values(tex).filter(t=>t.full).length, GALAXIES};
})();
