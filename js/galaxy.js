/* ==========================================================
   galaxy.js — a galaxy you can fly into, drawn as a real 3D scene.
   · The galaxy is an oval cloud of thousands of stars: a bright warm
     bulge, a soft disk with only a hint of spiral, and a glow.
   · Galaxy.still(): draws it once, standing far away (home's background).
   · Galaxy.fly(): the camera flies into it at a steady pace; its stars
     spread out and pass on every side, more stars appear all around, and
     at the end the scene dissolves into whatever is behind. No flash.
   Used by gate.js (after the PIN) and home.js (entering UC3M).
   ========================================================== */
const Galaxy=(function(){
  const TILT=1.05, ROLL=-.42, ct=Math.cos(TILT), st=Math.sin(TILT), cr=Math.cos(ROLL), sr=Math.sin(ROLL);
  const COLOURS=["255,226,188","255,244,228","214,226,255","255,196,214"];
  let cache=null;

  /* the same galaxy every time (seeded), built once */
  function build(){
    if(cache) return cache;
    let seed=7;
    const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
    const gauss=()=>{ let u=0; for(let i=0;i<4;i++) u+=rnd(); return (u-2)/1.15; };
    const N=highQuality()?7000:2600, groups=COLOURS.map(c=>({c:`rgb(${c})`,list:[]}));
    for(let i=0;i<N;i++){
      let gx,gy,gz,g;
      if(rnd()<.3){ gx=gauss()*1.25; gy=gauss()*1.05; gz=gauss()*.8; g=0; }          /* the bulge */
      else {                                                                         /* the disk */
        let r,th;
        do{ r=-Math.log(1-rnd()*.985)*3.1; th=rnd()*Math.PI*2; }
        while(rnd()>.82+.18*Math.cos(2*(th-1.9*Math.log(r+.6))));                     /* a faint spiral */
        gx=Math.cos(th)*r; gy=Math.sin(th)*r*.78; gz=gauss()*(.22+r*.04);
        const k=rnd(); g=r<2.2?0:k<.13?2:k<.16?3:1;
      }
      groups[g].list.push({gx,gy,gz,b:.25+rnd()*.65,s:.6+rnd()*.9});
    }
    const glow=document.createElement("canvas"); glow.width=glow.height=512;
    const gx=glow.getContext("2d"); gx.translate(256,256);
    const gr=gx.createRadialGradient(0,0,0,0,0,256);
    gr.addColorStop(0,"rgba(255,236,208,.9)"); gr.addColorStop(.06,"rgba(255,222,186,.55)"); gr.addColorStop(.2,"rgba(225,205,195,.18)");
    gr.addColorStop(.5,"rgba(150,150,190,.06)"); gr.addColorStop(1,"rgba(0,0,0,0)");
    gx.fillStyle=gr; gx.fillRect(-256,-256,512,512);
    const field=[];
    for(let i=0;i<(highQuality()?1600:700);i++) field.push({x:(rnd()-.5)*140,y:(rnd()-.5)*100,z:-60+rnd()*320,t:.04+rnd()*.6,b:.3+rnd()*.7});
    return cache={groups,glow,field};
  }

  /* one frame. d: distance from the camera to the galaxy's centre; (cx,cy): where the centre is on screen */
  function draw(x,W,H,{d,spin=0,cx=W/2,cy=H/2,appear=1,fieldP=-1,fieldAlpha=1}){
    const G=build(), F=Math.min(W,H)*1.15;
    const cs=Math.cos(spin), sn=Math.sin(spin);
    x.globalCompositeOperation="lighter";
    /* the glow: an ellipse matching the tilted disk, fading once we are inside */
    const gR=16/d*F, gA=appear*Math.min(1,Math.max(0,(d-2)/10));
    if(gA>0&&gR>1){
      x.save(); x.globalAlpha=gA*.9; x.translate(cx,cy); x.rotate(ROLL); x.scale(1,ct*.85);
      x.drawImage(G.glow,-gR,-gR,gR*2,gR*2); x.restore();
    }
    /* stars all around the path, coming into view one by one (only while flying) */
    if(fieldP>=0){
      x.fillStyle="#E4EAFF";
      for(const s of G.field){
        const z=s.z+d; if(z<.8) continue;
        const k=F/z, sx=W/2+s.x*k*.35, sy=H/2+s.y*k*.35;
        if(sx<-4||sx>W+4||sy<-4||sy>H+4) continue;
        const a=fieldAlpha*s.b*Math.min(1,Math.max(0,(fieldP-s.t)/.18))*Math.min(1,40/z);
        if(a<=.01) continue;
        const sz=Math.min(2.6,.7+k*.012);
        x.globalAlpha=a; x.fillRect(sx-sz/2,sy-sz/2,sz,sz);
      }
    }
    /* the galaxy's own stars: turn in its plane, tilt, roll, project */
    for(const grp of G.groups){
      x.fillStyle=grp.c;
      for(const s of grp.list){
        const px=s.gx*cs-s.gy*sn, py=s.gx*sn+s.gy*cs;
        const y1=py*ct-s.gz*st, z1=py*st+s.gz*ct;
        const wx=px*cr-y1*sr, wy=px*sr+y1*cr;
        const z=z1+d; if(z<.25) continue;
        const k=F/z, sx=cx+wx*k, sy=cy+wy*k;
        if(sx<-6||sx>W+6||sy<-6||sy>H+6) continue;
        const sz=Math.min(3.2,s.s*(.5+k*.004));
        x.globalAlpha=s.b*appear*Math.min(1,.35+k*.004)*Math.min(1,z/.9);
        if(sz<2) x.fillRect(sx-sz/2,sy-sz/2,sz,sz);
        else { x.beginPath(); x.arc(sx,sy,sz/2,0,6.283); x.fill(); }
      }
    }
    x.globalCompositeOperation="source-over"; x.globalAlpha=1;
  }

  function canvasFor(c){
    const DPR=Math.min(devicePixelRatio||1,2), W=innerWidth, H=innerHeight;
    c.width=Math.round(W*DPR); c.height=Math.round(H*DPR); c.style.width=W+"px"; c.style.height=H+"px";
    const x=c.getContext("2d"); x.setTransform(DPR,0,0,DPR,0,0);
    return {x,W,H};
  }

  /* far away, standing still: home's galaxy. Where it sits is given in fractions of the screen. */
  const HOME={d:95,fx:.74,fy:.3,spin:.2};
  function homeSpot(W,H){ const small=W<700; return {cx:W*(small?.72:HOME.fx),cy:H*(small?.2:HOME.fy),d:small?110:HOME.d}; }
  function still(c){
    const {x,W,H}=canvasFor(c), s=homeSpot(W,H);
    x.clearRect(0,0,W,H);
    draw(x,W,H,{d:s.d,spin:HOME.spin,cx:s.cx,cy:s.cy});
  }

  /* the flight. from: "far" (a tiny smudge in the dark, for the PIN) or "home" (home's galaxy).
     black: paint the dark behind it. arrive() is called when the scene starts to dissolve. */
  function fly({from="far",duration=5400,black=true,arrive}){
    const c=document.createElement("canvas"); c.className="journey"; document.body.appendChild(c);
    const {x,W,H}=canvasFor(c);
    const s=homeSpot(W,H);
    const D0=from==="home"?s.d:300, D1=1.6;
    const c0x=from==="home"?s.cx:W/2, c0y=from==="home"?s.cy:H/2;
    const ease=p=>p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
    const t0=performance.now();
    let revealed=false;
    function frame(now){
      const p=Math.min(1,(now-t0)/duration), e=ease(p);
      const d=D0*Math.pow(D1/D0,e);                          /* steady flight: distance shrinks exponentially */
      const m=Math.min(1,e*1.6);                             /* the galaxy slides to the middle as we head for it */
      x.globalCompositeOperation="source-over"; x.globalAlpha=1;
      if(black){ x.fillStyle="#000"; x.fillRect(0,0,W,H); } else x.clearRect(0,0,W,H);
      draw(x,W,H,{d,spin:(from==="home"?HOME.spin:0)+p*.35,
        cx:c0x+(W/2-c0x)*m, cy:c0y+(H/2-c0y)*m,
        appear:from==="home"?1:Math.min(1,p/.15), fieldP:from==="home"?.6+p:p, fieldAlpha:from==="home"?.7:1});
      if(p>.8&&!revealed){ revealed=true; if(arrive) arrive(); }
      if(p>.8) c.style.opacity=String(Math.max(0,1-(p-.8)/.2));
      if(p<1) requestAnimationFrame(frame); else c.remove();
    }
    requestAnimationFrame(frame);
  }

  return {still, fly};
})();
