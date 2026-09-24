/* ==========================================================
   wonders.js — the other wonders of the universe, beyond the galaxies
   and the black hole. Each one is drawn by the graphics card from a
   formula (no pictures), in its place in space, so the camera's flights
   and slow turns move it like everything else, and bright parts glow.
   · The Orion Nebula: a glowing cloud of hydrogen (pink-red), lit from
     inside by four hot young stars (the Trapezium), with dark lanes of dust.
   · The Pillars of Creation (in the Eagle Nebula): three dark columns of
     gas and dust, their edges lit gold, against glowing teal gas.
   · The Pleiades: a young cluster of hot blue stars wrapped in the blue
     haze of dust they light up (a reflection nebula).
   · The Ring Nebula: a dying star's shell of gas, blue-green inside and
     red at the rim, with the tiny white dwarf left in the middle.
   · A star eating its companion: a swollen red giant, pulled into a drop,
     pours a stream of gas onto a white dwarf through its bright disk; the
     two go round each other.
   · The Antennae: two galaxies colliding, their cores merging, pink
     knots of new stars where they crash, and two long tails flung out.
   · Now and then, a supernova: a star in a far galaxy flares in a second,
     blue-white with the telescope's diffraction spikes, then fades, turns
     yellow and red, and leaves a small ragged shell of glowing gas.
   · The Earth and the Moon: where every opening of the app starts (the
     camera leaves them behind on its way home): the Earth turning, its
     night side dotted with city lights, auroras over its poles, its thin
     blue air; the Moon beside it in its real phase for today.
   Registered in window.UNIVERSE_EXTRAS before universe.js runs, which
   compiles their programs and calls draw() every frame (see "api" there).
   ========================================================== */
window.UNIVERSE_EXTRAS=window.UNIVERSE_EXTRAS||[];
const Wonders=(function(){
  const TAU=Math.PI*2;
  /* 3D value noise, for the spheres (the Earth, the Moon) */
  const N3=`
float h31(vec3 p){ p=fract(p*.1031); p+=dot(p,p.zyx+31.32); return fract((p.x+p.y)*p.z); }
float vn3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm3(vec3 p,int oct){ float t=0.,a=.5,n=0.; for(int o=0;o<6;o++){ if(o>=oct) break; t+=a*vn3(p); n+=a; a*=.5; p=p*2.03+vec3(17.3,-9.1,4.7);} return t/n; }
`;
  const COMMON=`in vec2 vQ; out vec4 o; uniform float uT, uA, uS;
float edgeFade(){ return 1.-smoothstep(.82,1.,max(abs(vQ.x),abs(vQ.y))); }
`;
  /* where a wonder is on the screen now (null: not in view) */
  function spot(api,p,R){
    const a=api.onScreen(p); if(!a) return null;
    const r=R*api.F/a[2], m=r*1.6;
    if(r<1.5||a[0]<-m||a[1]<-m||a[0]>api.W+m||a[1]>api.H+m) return null;
    return {x:a[0],y:a[1],r,d:a[2]};
  }
  const set=(u,k,...v)=>{ if(u[k]!==undefined&&u[k]!==null) api0.gl["uniform"+v.length+"f"](u[k],...v); };
  let api0=null;
  const big=api=>api.W<760?1.5:1;                     /* a little bigger on a phone, so they still read */

  /* a wonder that sits in the sky seen from home */
  function skyWonder(id,{at,z,R,rot=0,phase="far",blend="add",shader,uniforms}){
    const w={id,shaders:{main:shader},
      layout(api){ w.p=api.world(at,z); },
      draw(api,ph,t,now){
        if(ph!==phase||!w.p) return;
        api0=api;
        const s=spot(api,w.p,R*big(api)); if(!s) return;
        const u=api.sprite(w.prog.main,s.x,s.y,s.r,s.r,rot);
        set(u,"uT",t); set(u,"uA",api.fade); set(u,"uS",(id.length*7.31)%10);
        if(uniforms) uniforms(api,u,t,now,s);
        blend==="add"?api.add():api.over();
        api.draw();
      }};
    window.UNIVERSE_EXTRAS.push(w);
    return w;
  }

  /* ---------- the Orion Nebula ---------- */
  skyWonder("orion",{at:{d:[.8,.1],m:[-.12,.3]},z:140,R:13.5,rot:.35,blend:"over",shader:COMMON+`
float warp(vec2 p){ vec2 q=vec2(fbm(p+uS,5),fbm(p+vec2(5.2,1.3)+uS,5)); return fbm(p+2.3*q+vec2(uT*.004,0.),5); }
void main(){
  vec2 p=vQ*1.15; float r=length(p);
  float env=exp(-r*r*2.3);
  float n=warp(p*1.7);
  float gas=pow(clamp(n*1.4-.28,0.,1.),1.5)*env;
  /* the bright heart around the Trapezium, and the "wings" of the nebula */
  vec2 c=p-vec2(.08,-.04); float core=exp(-dot(c,c)*22.);
  float wings=exp(-pow(p.y+.9*p.x*p.x,2.)*7.)*exp(-abs(p.x)*1.1);
  vec3 col=vec3(.98,.24,.42)*gas*(.55+1.1*wings)*1.35
          +vec3(1.,.55,.32)*gas*.4*smoothstep(.25,.9,r)
          +vec3(.45,.66,1.)*core*(.35+.6*n)*gas*2.2+vec3(1.,.86,.9)*pow(core,4.)*.55;
  /* a veil of dust in front, in filaments */
  float fil=1.-abs(fbm(p*3.4+vec2(9.,uS),5)*2.-1.);
  float dust=smoothstep(.55,.9,fil)*smoothstep(.35,.7,fbm(p*2.+3.,4))*env;
  /* the Trapezium: four hot stars close together, and young stars scattered in the gas */
  vec2 tp[4]=vec2[4](vec2(.05,-.07),vec2(.11,-.03),vec2(.08,-.11),vec2(.13,-.09));
  float st=0.; for(int i=0;i<4;i++){ vec2 d=p-tp[i]; st+=exp(-dot(d,d)*9000.)*2.6+exp(-dot(d,d)*700.)*.3; }
  vec2 g=floor(p*24.); float hs=h12(g+uS); vec2 f=fract(p*24.)-.5-(vec2(h12(g+3.1),h12(g+7.7))-.5)*.6;
  float sp=step(.9,hs)*exp(-dot(f,f)*70.)*(.35+hs);
  vec3 C=col*(1.-dust*.85)+vec3(.85,.9,1.)*(st+sp*env*1.3);
  float e=edgeFade();
  o=vec4(C*uA*e,clamp(dust*.75,0.,.8)*uA*e);
}`});

  /* ---------- the Pillars of Creation ---------- */
  skyWonder("pillars",{at:{d:[.3,-.8],m:[.22,-.62]},z:150,R:11,blend:"over",shader:COMMON+`
/* a pillar: a column narrowing upwards, its edges ragged */
float pillar(vec2 p,float x0,float top,float w0,float lean,float sd){
  float y=clamp(p.y,top,1.4), w=w0*(.55+.45*smoothstep(top,1.,y));
  float cx=x0+lean*(y-1.)+.05*(fbm(vec2(y*4.,sd),3)-.5);
  vec2 d=vec2(p.x-cx,p.y-y);
  return length(d)-w+.035*(fbm(p*9.+sd,4)-.5);
}
void main(){
  vec2 p=vQ; float rr=length(p);
  /* a round cloud with ragged edges, not a box */
  float env=smoothstep(1.,.25,rr+.25*(fbm(p*2.5+uS+4.,4)-.5))*exp(-rr*rr*.8);
  /* glowing gas behind: teal (oxygen and hydrogen), gold where the light is strongest */
  float n=fbm(p*2.1+uS+vec2(0.,uT*.003),5), n2=fbm(p*6.+uS*2.,4);
  vec3 bg=mix(vec3(.08,.36,.36),vec3(.92,.66,.3),smoothstep(.45,.85,n+.3*(-p.y)))*pow(n,1.4)*env*1.6;
  float d=min(pillar(p,-.4,-.25,.12,.1,1.),min(pillar(p,.03,-.5,.1,-.03,2.),pillar(p,.42,-.05,.09,.12,3.)));
  float inside=smoothstep(.012,-.012,d)*smoothstep(1.05,.55,rr);   /* the columns melt into the cloud at its edge */
  /* their edges, lit by the young stars above: brightest at the tips */
  float rim=exp(-abs(d)*42.)*(1.-.6*smoothstep(-.6,.8,p.y));
  vec3 C=bg*(1.-inside)+vec3(1.,.78,.5)*rim*env*1.2+vec3(.24,.15,.1)*inside*n2*.45*env;
  vec2 g=floor(p*20.); float hs=h12(g+uS); vec2 f=fract(p*20.)-.5;
  C+=vec3(.9,.95,1.)*step(.93,hs)*exp(-dot(f,f)*80.)*(1.-inside)*.9;
  float e=edgeFade();
  o=vec4(C*uA*e,inside*.9*uA*e);
}`});

  /* ---------- the Pleiades ---------- */
  skyWonder("pleiades",{at:{d:[-.85,-.03],m:[.72,.05]},z:120,R:8,rot:-.2,shader:COMMON+`
/* the nine brightest (positions and brightness after the real cluster) */
const vec3 S[9]=vec3[9](vec3(0.,0.,1.),vec3(-.48,.05,.62),vec3(-.5,-.08,.2),vec3(.36,-.1,.58),vec3(.17,.2,.42),
                        vec3(.23,-.26,.5),vec3(.35,-.44,.38),vec3(.49,-.28,.16),vec3(.33,-.56,.14));
void main(){
  vec2 p=vQ*1.1; vec3 C=vec3(0.);
  /* the blue haze: a cloud of dust the cluster is drifting through, lit by its stars. It
     hangs in fine parallel streaks, thickest round Merope, fading away from each star */
  float ca=cos(-.6), sa=sin(-.6); vec2 q=vec2(ca*p.x-sa*p.y,sa*p.x+ca*p.y);
  float streak=fbm(q*vec2(2.,5.)+uS,5), broad=fbm(p*2.6+uS+4.,4);
  float fine=pow(1.-abs(fbm(q*vec2(3.,12.)+uS*1.7,4)*2.-1.),2.);
  float lit=0.;
  for(int i=0;i<9;i++){ vec2 d=p-S[i].xy*.78; float k=i==3?1.8:1.; lit+=S[i].z*k*(exp(-dot(d,d)*9.)*.8+exp(-length(d)*9.)*.35); }
  float dust=smoothstep(.3,.75,broad*.6+streak*.6);
  C+=vec3(.3,.5,1.)*lit*dust*(.6+.5*fine)*.5;
  C+=vec3(.5,.66,1.)*lit*lit*.05;
  /* the stars: hot and blue-white, the brightest with the telescope's spikes */
  for(int i=0;i<9;i++){
    vec2 d=p-S[i].xy*.78; float b=S[i].z*(.94+.06*sin(uT*2.3+float(i)*2.1)), r2=dot(d,d), r=sqrt(r2);
    float spk=(exp(-abs(d.x)*420.)+exp(-abs(d.y)*420.))*exp(-r*(9.-5.*b))*b*b;
    C+=vec3(.78,.87,1.)*b*(exp(-r2*9000.)*5.+exp(-r2*900.)*.9+exp(-r*22.)*.22)+vec3(.7,.82,1.)*spk*.9;
  }
  /* the fainter members, a hundred or so, thinning outwards */
  vec2 g=floor(p*16.); float hs=h12(g+uS+1.); vec2 f=fract(p*16.)-.5-(vec2(h12(g),h12(g+5.))-.5)*.6;
  C+=vec3(.82,.88,1.)*step(.8,hs)*exp(-dot(f,f)*110.)*(.3+hs)*exp(-dot(p,p)*1.1);
  o=vec4(C*uA*edgeFade(),0.);
}`});

  /* ---------- the Ring Nebula ---------- */
  skyWonder("ringneb",{at:{d:[-.72,.27],m:[-.38,.5]},z:120,R:4.6,rot:.5,shader:COMMON+`
void main(){
  vec2 p=vQ*1.25; vec2 e=p/vec2(1.,.8); float r=length(e), a=atan(e.y,e.x);
  float fil=fbm(vec2(a*2.6,r*9.)+uS,4), grain=fbm(p*7.+uS,4);
  float ring=exp(-pow((r-.6)/.14,2.)), inner=smoothstep(.62,.05,r);
  vec3 C=vec3(.3,.78,.85)*inner*(.45+.6*grain)*.85
        +mix(vec3(1.,.5,.22),vec3(.92,.18,.28),smoothstep(.5,.78,r))*ring*(.55+.9*fil)*1.4
        +vec3(.85,.28,.35)*exp(-pow((r-.95)/.22,2.))*.14*(.4+fil)
        +vec3(1.)*exp(-dot(p,p)*1500.)*1.6;
  o=vec4(C*uA*edgeFade(),0.);
}`});

  /* ---------- a star eating its companion ---------- */
  skyWonder("binary",{at:{d:[.61,.12],m:[.05,-.1]},z:110,R:5.2,blend:"over",shader:COMMON+`
uniform float uPh;    /* where they are on their orbit */
void main(){
  vec2 p=vQ*1.3; const float ci=.34;                         /* the orbit, seen tilted */
  vec2 A=-.42*vec2(cos(uPh),sin(uPh)*ci), B=.88*vec2(cos(uPh),sin(uPh)*ci);
  float bFront=sin(uPh)<0.?1.:0.;                             /* the white dwarf is in front of the giant */
  vec2 toB=normalize(B-A), dA=p-A;
  float along=dot(dA,toB), Rg=.4*(1.+.22*smoothstep(0.,.4,along));        /* pulled into a drop */
  float rg=length(dA)/Rg;
  vec3 C=vec3(0.); float a=0.;
  /* the disk round the white dwarf, and the hot spot where the stream lands */
  vec2 dB=p-B; float rd=length(dB/vec2(1.,ci+.08));
  float disk=smoothstep(.27,.06,rd)*smoothstep(.012,.03,rd);
  vec3 dc=mix(vec3(.75,.85,1.),vec3(1.,.55,.3),smoothstep(.04,.24,rd))*disk*(1.3+.7*fbm(vec2(atan(dB.y,dB.x)*3.-uT*2.,rd*20.),3));
  vec2 hot=B-toB*.16; dc+=vec3(1.,.9,.8)*exp(-dot(p-hot,p-hot)*900.)*1.5;
  dc+=vec3(.85,.93,1.)*exp(-dot(dB,dB)*9000.)*3.;
  /* the stream: from the giant's tip, curving (the orbit turns under it) onto the disk */
  float st=0.; vec2 L1=A+toB*Rg*1.02, nrm=vec2(-toB.y,toB.x);
  for(int i=0;i<18;i++){ float s=float(i)/17.; vec2 q=mix(L1,hot,s)+nrm*sin(s*3.1416)*.07;
    st+=exp(-dot(p-q,p-q)*(4000.-2500.*s))*(1.-.4*s); }
  vec3 sc=mix(vec3(1.,.4,.18),vec3(1.,.8,.6),.5)*st*.5*(.7+.5*fbm(p*20.-uT,2));
  /* the red giant: darker at its edge, its surface boiling */
  vec3 gc=vec3(0.); float ga=0.;
  if(rg<1.){ float mu=sqrt(1.-rg*rg), gr=fbm(dA*13.+vec2(uT*.05,0.),4);
    gc=mix(vec3(.9,.22,.08),vec3(1.,.6,.3),mu)*(.35+.65*mu)*(.7+.55*gr)*1.3; ga=1.; }
  gc+=vec3(1.,.35,.15)*exp(-max(rg-1.,0.)*4.)*.25*(1.-ga);
  vec3 other=dc+sc; float oa=clamp(disk*.9,0.,1.);
  C=bFront>.5?other+gc*(1.-oa):gc+other*(1.-ga);        /* whichever is in front hides the other */
  a=max(ga,oa*.7);
  float e=edgeFade();
  o=vec4(C*uA*e,a*uA*e);
}`,uniforms(api,u,t){ set(u,"uPh",t*TAU/70); }});

  /* ---------- the Antennae: two galaxies colliding ---------- */
  /* NGC 4038/4039: two spirals in the middle of crashing. Their pull has thrown out two long
     curved tails of stars (the "antennae"); where their disks meet, the squeezed gas lights
     up in hundreds of pink knots of newborn stars, crossed by lanes of dust. */
  skyWonder("antennae",{at:{d:[.93,-.76],m:[-.38,-.5]},z:160,R:9,rot:-.3,blend:"over",shader:COMMON+`
float seg(vec2 p,vec2 a,vec2 b){ vec2 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h); }
/* a tidal tail: a spiral arc thrown out of a disk, wider and fainter as it goes */
vec2 tail(vec2 p,vec2 c,float th0,float dir,float sd){
  float best=1e3, bs=0.; vec2 prev=c;
  for(int i=1;i<=22;i++){ float s=float(i)/22.;
    float th=th0+dir*s*2.5, R=.12+.8*pow(s,1.15);
    vec2 q=c+R*vec2(cos(th),sin(th)*.78);
    float d=seg(p,prev,q); if(d<best){ best=d; bs=s; } prev=q; }
  float w=.018+.075*bs;
  float lum=exp(-pow(best/w,2.))*(1.-.75*bs)*(.55+.9*fbm(p*11.+sd,4));
  return vec2(lum,bs);
}
/* one of the two disks, pulled out of shape */
float disk(vec2 p,vec2 c,float ang,float sq){
  vec2 d=p-c; float ca=cos(ang), sa=sin(ang); d=vec2(ca*d.x-sa*d.y,sa*d.x+ca*d.y)*vec2(1.,sq);
  d+=.04*vec2(fbm(d*5.+3.,3)-.5,fbm(d*5.+9.,3)-.5);
  float r=length(d), th=atan(d.y,d.x), arm=.5+.5*sin(2.*th-5.5*log(r+.03));
  return exp(-r/.085)*1.1+exp(-r/.19)*(.35+.65*arm)*.95;
}
void main(){
  vec2 p=vQ*1.05; vec2 c1=vec2(-.09,.05), c2=vec2(.1,-.05);
  float d1=disk(p,c1,.5,1.5), d2=disk(p,c2,-.8,1.8);
  vec2 T1=tail(p,c1,1.9,1.,1.), T2=tail(p,c2,-1.25,1.,5.);
  /* the old stars: warm light near the hearts, bluer out in the disks and the tails */
  vec3 C=mix(vec3(.62,.7,1.),vec3(1.,.84,.6),smoothstep(.3,1.2,d1+d2))*(d1+d2)*.75;
  C+=vec3(1.,.9,.72)*(exp(-dot(p-c1,p-c1)*700.)+exp(-dot(p-c2,p-c2)*900.)*.8)*1.2;
  C+=vec3(.66,.76,1.)*(T1.x+T2.x)*.5;
  /* where they meet: dust lanes, and knots of newborn stars (pink gas, blue clusters) */
  vec2 m=(p-vec2(.0,.0))*vec2(1.,1.35); float meet=exp(-dot(m,m)*10.);
  float lane=pow(1.-abs(fbm(p*7.+uS,5)*2.-1.),5.)*meet*smoothstep(.1,.4,d1+d2);
  float loop=exp(-pow((length((p-c1)*vec2(1.,1.4))-.13)/.05,2.))+exp(-pow((length((p-c2)*vec2(1.,1.5))-.1)/.045,2.));
  float knotsWhere=clamp(loop*.8+meet*.9,0.,1.);
  vec2 g=floor(p*46.); float hs=h12(g+uS); vec2 f=fract(p*46.)-.5-(vec2(h12(g+1.7),h12(g+4.2))-.5)*.5;
  float knot=step(.72,hs)*exp(-dot(f,f)*55.)*knotsWhere;
  C+=mix(vec3(1.,.32,.62),vec3(.55,.7,1.),step(.87,hs))*knot*1.9;
  C+=vec3(1.,.35,.55)*pow(fbm(p*9.+uS*2.,4),3.)*knotsWhere*.9;                       /* their pink glow */
  /* single bright stars scattered along the tails */
  vec2 g2=floor(p*60.); float h2=h12(g2+uS+9.); vec2 f2=fract(p*60.)-.5;
  C+=vec3(.8,.87,1.)*step(.9,h2)*exp(-dot(f2,f2)*80.)*clamp((T1.x+T2.x)*1.5,0.,1.)*.8;
  float e=edgeFade();
  o=vec4(C*(1.-lane*.7)*uA*e,lane*.65*uA*e);
}`});

  /* ---------- now and then, a supernova ---------- */
  let nova=null, nextNova=0;
  const novaW={id:"nova",shaders:{main:COMMON+`
uniform float uK;     /* how far along its life (0 to 1) */
void main(){
  vec2 p=vQ; float r=length(p), k=uK;
  /* its light: a sudden rise, a peak, then weeks of fading, seen in seconds */
  float B=smoothstep(0.,.02,k)*(exp(-k*4.2)*.9+.1*(1.-k));
  /* the colour: blue-white when it bursts, yellow, then red as it cools */
  vec3 col=mix(mix(vec3(.72,.84,1.),vec3(1.,.9,.72),smoothstep(.04,.3,k)),vec3(1.,.55,.36),smoothstep(.3,.85,k));
  /* the star itself and its glow */
  vec3 C=col*B*(exp(-r*r*2600.)*6.+exp(-r*r*180.)*1.1+exp(-r*9.)*.28);
  /* diffraction spikes (the telescope's mark on every very bright star), a little turned */
  float ca=cos(.35), sa=sin(.35); vec2 q=vec2(ca*p.x-sa*p.y,sa*p.x+ca*p.y);
  float sp=exp(-abs(q.y)*260./(.3+r))*exp(-abs(q.x)*3.2)+exp(-abs(q.x)*260./(.3+r))*exp(-abs(q.y)*3.2);
  sp+=.35*(exp(-abs(q.x+q.y)*380./(.3+r))+exp(-abs(q.x-q.y)*380./(.3+r)))*exp(-r*7.);
  C+=col*sp*B*B*1.6*(1.+.08*sin(uT*9.+uS));
  /* the flash of the shock breaking out, in the first moments */
  C+=vec3(.75,.9,1.)*exp(-r*r*14.)*exp(-k*60.)*smoothstep(0.,.006,k)*.8;
  /* much later: the debris, a ragged small shell of glowing gas (hydrogen red, oxygen teal) */
  float R=.05+.2*smoothstep(.2,1.,k), a=atan(p.y,p.x);
  float fil=fbm(vec2(a*2.5,r*7.)+uS,4), rag=R*(1.+.3*(fbm(vec2(a*2.,uS),3)-.5));
  float shell=(exp(-pow((r-rag)/(.03+.04*k),2.))+.25*smoothstep(rag,rag*.3,r))*smoothstep(.2,.55,k)*(1.-smoothstep(.85,1.,k));
  C+=mix(vec3(.3,.85,.8),vec3(1.,.3,.35),smoothstep(.45,.8,fil))*shell*pow(fil,1.5)*1.1;
  o=vec4(C*uA*edgeFade()*(1.-smoothstep(.9,1.,k)),0.);
}`},
    draw(api,ph,t,now){
      if(ph!=="far") return;
      api0=api;
      const clock=now;
      if(!nova&&api.alive()&&!api.robot){
        if(!nextNova) nextNova=clock+180+Math.random()*240;
        if(clock>=nextNova) spawnNova(api,clock);
      }
      if(!nova) return;
      const k=(clock-nova.t0)/nova.dur;
      if(k>=1){ nova=null; nextNova=clock+240+Math.random()*300; return; }
      const a=api.onScreen(nova.p); if(!a) return; const s={x:a[0],y:a[1]};
      const R=Math.min(api.W,api.H)*.16;
      const u=api.sprite(novaW.prog.main,s.x,s.y,R,R,0);
      set(u,"uK",k); set(u,"uA",api.fade); set(u,"uS",nova.seed); set(u,"uT",t);
      api.add(); api.draw(); api.need();
    }};
  function spawnNova(api,clock,x,y){
    /* far away, somewhere away from the middle of the screen */
    if(x===undefined) do{ x=Math.random()*1.8-.9; y=Math.random()*1.7-.85; }while(Math.abs(x)<.35&&Math.abs(y)<.35);
    nova={t0:clock,dur:70,p:api.world({d:[x,y],m:[x,y]},900),seed:Math.random()*10};
  }
  window.UNIVERSE_EXTRAS.push(novaW);

  /* ---------- the Earth and the Moon (where the opening starts) ---------- */
  const EARTH_P=[-21,13,-392], EARTH_R=15, MOON_P=[22,-16,-350], MOON_R=4.5;
  const earth={id:"earth",early:true,shaders:{main:COMMON+N3+`
uniform vec3 uL;      /* where the sunlight comes from */
uniform float uSpin;
vec3 spin(vec3 n){ float c=cos(uSpin), s=sin(uSpin); vec3 m=vec3(c*n.x+s*n.z,n.y,-s*n.x+c*n.z);
  float t=.41, ct=cos(t), st=sin(t); return vec3(ct*m.x-st*m.y,st*m.x+ct*m.y,m.z); }   /* its axis leans 23° */
void main(){
  vec2 p=vQ*1.14; float r2=dot(p,p), rr=sqrt(r2);
  vec3 C=vec3(0.); float a=0.;
  vec3 L=normalize(uL);
  if(r2<1.){
    vec3 n=vec3(p.x,p.y,-sqrt(1.-r2)), s=spin(n);
    float lit=dot(n,L), day=smoothstep(-.1,.12,lit);
    float h=fbm3(s*1.7+uS,6), landM=smoothstep(.555,.59,h+.08*fbm3(s*6.,3));
    float lat=abs(s.y), ice=smoothstep(.8,.9,lat+.05*fbm3(s*8.,3));
    /* the surface: deep ocean, shallows along the coasts, forest, desert, ice */
    float coast=smoothstep(.49,.555,h)*(1.-landM);
    vec3 ocean=mix(vec3(.01,.045,.14),vec3(.02,.13,.3),fbm3(s*4.,3))+vec3(.02,.12,.14)*coast;
    float dry=smoothstep(.35,.65,fbm3(s*2.3+7.,4))*(1.-smoothstep(.45,.7,lat));
    vec3 land=mix(vec3(.07,.16,.05),vec3(.55,.42,.25),dry)*(.75+.5*fbm3(s*14.,4));
    land=mix(land,vec3(.35,.3,.26),smoothstep(.64,.72,h));            /* the mountains */
    vec3 surf=mix(mix(ocean,land,landM),vec3(.9,.93,.97),ice);
    float cl=smoothstep(.5,.74,fbm3(s*3.2+vec3(uT*.012,0.,0.),5))*(.75+.25*fbm3(s*18.,3));
    /* sunlight: reddened where it grazes the ground, low at the line between day and night */
    float sunL=max(lit,0.);
    vec3 sunC=mix(vec3(1.,.5,.28),vec3(1.,.97,.92),smoothstep(0.,.3,lit));
    vec3 dayC=mix(surf,vec3(.95),cl*.9)*sunL*sunC*1.3;
    /* the Sun's reflection on the sea: a small sharp spot, stretched near the edge */
    vec3 v=vec3(0.,0.,-1.), hv=normalize(L+v);
    float fres=.02+.98*pow(1.-max(dot(n,v),0.),5.);
    dayC+=vec3(1.,.9,.75)*pow(max(dot(n,hv),0.),900.)*(1.-landM)*(1.-cl)*(.8+1.5*fres)*day;
    /* the night side: nearly black, the clouds faintly seen by the Moon */
    vec3 nightC=(surf*.05+vec3(.02,.03,.05)*cl)*(1.-day);
    /* city lights: towns scattered on land, thicker along the coasts, joined by roads */
    vec3 g=floor(s*95.), fr=fract(s*95.)-.5; float hs=h31(g+uS);
    float town=step(.9,hs)*exp(-dot(fr,fr)*30.)*(.3+hs);
    float roads=pow(1.-abs(fbm3(s*48.,3)*2.-1.),14.)*.18;
    float settled=smoothstep(.56,.7,fbm3(s*4.5+11.,4))*(1.+1.5*smoothstep(.62,.555,h));
    float cities=landM*(1.-ice)*settled*(town+roads);
    nightC+=vec3(1.,.66,.3)*cities*(1.-cl*.8)*(1.-day)*1.6;
    /* auroras round the poles, over the night: thin green curtains, crimson at their tops */
    float ring=exp(-pow((lat-.87+.015*sin(atan(s.z,s.x)*5.+uT*.05))/.03,2.)), ray=pow(fbm3(s*vec3(22.,2.,22.)+vec3(0.,uT*.15,0.),4),2.5);
    float top=smoothstep(.87,.91,lat);
    nightC+=mix(vec3(.25,1.,.55),vec3(.95,.25,.45),top)*ring*ray*(1.-day)*1.3;
    C=dayC+nightC; a=1.;
    /* the air seen through, thickest towards the edge: a blue veil on the day side */
    float thick=pow(1.-max(-n.z,0.),3.);
    C+=vec3(.25,.5,1.)*thick*smoothstep(-.25,.3,lit)*.5;
  }
  /* its thin air beyond the edge: blue where the Sun shines through, a thin line over the night */
  float out_=max(rr-1.,0.);
  float limb=exp(-out_*40.)*smoothstep(.97,1.,rr)+exp(-abs(rr-1.)*60.)*.4;
  float side=smoothstep(-.35,.7,dot(normalize(vec3(p,-.25)),L));
  vec3 air=mix(vec3(.2,.35,.8)*.25,mix(vec3(1.,.55,.3),vec3(.35,.62,1.),smoothstep(-.1,.4,dot(normalize(vec3(p,-.25)),L))),side);
  C+=air*limb*(.12+.95*side);
  a=max(a,limb*(.2+.5*side));
  o=vec4(C*uA,a*uA);
}`,moon:COMMON+N3+`
uniform vec3 uL;
void main(){
  vec2 p=vQ*1.03; float r2=dot(p,p);
  if(r2>=1.){ o=vec4(0.); return; }
  vec3 n=vec3(p.x,p.y,-sqrt(1.-r2)), L=normalize(uL);
  float maria=smoothstep(.45,.6,fbm3(n*1.6+2.,4));
  float craters=pow(1.-abs(fbm3(n*9.,4)*2.-1.),6.)*.35+fbm3(n*24.,3)*.25;
  float alb=(.62-.26*maria)*(.85+craters);
  float lit=max(dot(n,L),0.), term=smoothstep(-.02,.06,dot(n,L));
  vec3 C=vec3(.95,.93,.9)*alb*pow(lit,.8)*term*1.2+vec3(.35,.45,.7)*.035*alb*(1.-term);   /* earthshine on the dark side */
  float e=smoothstep(1.,.97,sqrt(r2));
  o=vec4(C*uA*e,e*uA);
}`},
    draw(api,ph,t){
      if(ph!=="near") return;
      api0=api;
      const e=spot(api,EARTH_P,EARTH_R);
      if(e){
        const u=api.sprite(earth.prog.main,e.x,e.y,e.r*1.14,e.r*1.14,0);
        set(u,"uL",.95,-.2,.45); set(u,"uSpin",t*.05); set(u,"uT",t); set(u,"uA",1); set(u,"uS",3.7);
        api.over(); api.draw();
      }
      const m=spot(api,MOON_P,MOON_R);
      if(m){
        /* lit as it is tonight: the angle between the Sun and the Moon, seen from here */
        const ph0=typeof Astro!=="undefined"&&Astro.moon?Astro.moon(new Date()).phase:.25, th=ph0*TAU;
        const u=api.sprite(earth.prog.moon,m.x,m.y,m.r*1.03,m.r*1.03,0);
        set(u,"uL",Math.sin(th),-.05,Math.cos(th)); set(u,"uA",1); set(u,"uT",t);
        api.over(); api.draw();
      }
    }};
  window.UNIVERSE_EXTRAS.push(earth);

  /* (tests and trying things out) */
  return {
    nova:(x,y,age=20)=>{ if(api0){ spawnNova(api0,performance.now()/1000,x,y); nova.t0-=age; api0.need(); return true; } return false; },
    state:()=>nova?{k:(performance.now()/1000-nova.t0)/nova.dur,at:api0.onScreen(nova.p)}:null,
    list:()=>window.UNIVERSE_EXTRAS.map(x=>x.id)
  };
})();
