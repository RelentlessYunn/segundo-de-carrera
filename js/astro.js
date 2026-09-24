/* ==========================================================
   astro.js — the real sky, computed offline.
   · sun(): sunrise and sunset for any place (the NOAA / SunCalc method,
     accurate to a minute or two). weather.js uses it without connection.
   · moon(): the Moon's phase for a date (SunCalc's method): how much of it
     is lit, and whether it is growing or shrinking.
   · planets(): which of the five bright planets can be seen tonight from
     a place (Paul Schlyter's orbital elements: good to a degree or two,
     plenty to say whether a planet is up and above the horizon).
   · shower(): the meteor shower going on, if any, on its real dates
     (after the International Meteor Organization's calendar), and how
     strong it is: universe.js makes more shooting stars, from its radiant.
   ========================================================== */
const Astro=(function(){
  const rad=Math.PI/180, DAY=864e5, J1970=2440588, J2000=2451545;
  const toDays=d=>d/DAY-.5+J1970-J2000;
  const fromJulian=j=>new Date((j+.5-J1970)*DAY);
  const E=rad*23.4397;
  function sun(date,lat,lng){
    const lw=rad*-lng, phi=rad*lat, d=toDays(new Date(date.getFullYear(),date.getMonth(),date.getDate(),12));
    const n=Math.round(d-.0009-lw/(2*Math.PI));
    const ds=.0009+lw/(2*Math.PI)+n;
    const M=rad*(357.5291+.98560028*ds);
    const L=M+rad*(1.9148*Math.sin(M)+.02*Math.sin(2*M)+.0003*Math.sin(3*M))+rad*102.9372+Math.PI;
    const dec=Math.asin(Math.sin(E)*Math.sin(L));
    const noon=J2000+ds+.0053*Math.sin(M)-.0069*Math.sin(2*L);
    const w=Math.acos((Math.sin(-.833*rad)-Math.sin(phi)*Math.sin(dec))/(Math.cos(phi)*Math.cos(dec)));
    const set=J2000+.0009+(w+lw)/(2*Math.PI)+n+.0053*Math.sin(M)-.0069*Math.sin(2*L);
    return {rise:fromJulian(noon-(set-noon)), set:fromJulian(set)};
  }

  /* ---------- the Moon's phase ---------- */
  const ra=(l,b)=>Math.atan2(Math.sin(l)*Math.cos(E)-Math.tan(b)*Math.sin(E),Math.cos(l));
  const decl=(l,b)=>Math.asin(Math.sin(b)*Math.cos(E)+Math.cos(b)*Math.sin(E)*Math.sin(l));
  function sunCoords(d){
    const M=rad*(357.5291+.98560028*d), C=rad*(1.9148*Math.sin(M)+.02*Math.sin(2*M)+.0003*Math.sin(3*M));
    const L=M+C+rad*102.9372+Math.PI;
    return {ra:ra(L,0),dec:decl(L,0)};
  }
  function moonCoords(d){
    const L=rad*(218.316+13.176396*d), M=rad*(134.963+13.064993*d), F=rad*(93.272+13.22935*d);
    const l=L+rad*6.289*Math.sin(M), b=rad*5.128*Math.sin(F), dist=385001-20905*Math.cos(M);
    return {ra:ra(l,b),dec:decl(l,b),dist};
  }
  /* phase: 0 new, .25 first quarter, .5 full, .75 last quarter; fraction: how much is lit */
  function moon(date){
    const d=toDays(date), s=sunCoords(d), m=moonCoords(d), sdist=149598000;
    const phi=Math.acos(Math.sin(s.dec)*Math.sin(m.dec)+Math.cos(s.dec)*Math.cos(m.dec)*Math.cos(s.ra-m.ra));
    const inc=Math.atan2(sdist*Math.sin(phi),m.dist-sdist*Math.cos(phi));
    const angle=Math.atan2(Math.cos(s.dec)*Math.sin(s.ra-m.ra),Math.sin(s.dec)*Math.cos(m.dec)-Math.cos(s.dec)*Math.sin(m.dec)*Math.cos(s.ra-m.ra));
    const fraction=(1+Math.cos(inc))/2, phase=.5+.5*inc*(angle<0?-1:1)/Math.PI;
    /* its name: new, waxing crescent, first quarter, waxing gibbous, full, and back */
    const names=["new","waxingCrescent","firstQuarter","waxingGibbous","full","waningGibbous","lastQuarter","waningCrescent"];
    return {phase,fraction,name:names[Math.round(phase*8)%8]};
  }

  /* ---------- the bright planets ---------- */
  /* orbital elements (N, i, w, a, e, M in degrees and AU), each [value at 2000, change per day] */
  const EL={
    mercury:[[48.3313,3.24587e-5],[7.0047,5e-8],[29.1241,1.01444e-5],[.387098,0],[.205635,5.59e-10],[168.6562,4.0923344368]],
    venus:  [[76.6799,2.4659e-5],[3.3946,2.75e-8],[54.891,1.38374e-5],[.72333,0],[.006773,-1.302e-9],[48.0052,1.6021302244]],
    mars:   [[49.5574,2.11081e-5],[1.8497,-1.78e-8],[286.5016,2.92961e-5],[1.523688,0],[.093405,2.516e-9],[18.6021,.5240207766]],
    jupiter:[[100.4542,2.76854e-5],[1.303,-1.557e-7],[273.8777,1.64505e-5],[5.20256,0],[.048498,4.469e-9],[19.895,.0830853001]],
    saturn: [[113.6634,2.3898e-5],[2.4886,-1.081e-7],[339.3939,2.97661e-5],[9.55475,0],[.055546,-9.499e-9],[316.967,.0334442282]]
  };
  const norm=x=>((x%360)+360)%360;
  function kepler(M,e){ let E0=M+e*Math.sin(M)*(1+e*Math.cos(M)); for(let k=0;k<6;k++) E0-=(E0-e*Math.sin(E0)-M)/(1-e*Math.cos(E0)); return E0; }
  /* where a body is, around the Sun (ecliptic, AU) */
  function helio(el,d){
    const [N,i,w,a,e,M]=el.map(([v,dv])=>v+dv*d);
    const Er=kepler(rad*norm(M),e), xv=a*(Math.cos(Er)-e), yv=a*Math.sqrt(1-e*e)*Math.sin(Er);
    const v=Math.atan2(yv,xv), r=Math.hypot(xv,yv), Nr=rad*N, ir=rad*i, u=v+rad*w;
    return [r*(Math.cos(Nr)*Math.cos(u)-Math.sin(Nr)*Math.sin(u)*Math.cos(ir)), r*(Math.sin(Nr)*Math.cos(u)+Math.cos(Nr)*Math.sin(u)*Math.cos(ir)), r*Math.sin(u)*Math.sin(ir)];
  }
  /* the Sun seen from the Earth (ecliptic), and its mean longitude (for the sidereal hour) */
  function sunGeo(d){
    const w=282.9404+4.70935e-5*d, e=.016709-1.151e-9*d, M=norm(356.047+.9856002585*d);
    const Er=kepler(rad*M,e), xv=Math.cos(Er)-e, yv=Math.sqrt(1-e*e)*Math.sin(Er);
    const v=Math.atan2(yv,xv), r=Math.hypot(xv,yv), lon=v+rad*w;
    return {x:r*Math.cos(lon),y:r*Math.sin(lon),L:norm(M+w)};
  }
  /* how high a body is above the horizon (degrees), from its place around the Sun */
  function altitude(xyz,date,lat,lon){
    const d=(date-Date.UTC(1999,11,31))/DAY, s=sunGeo(d);
    const x=xyz[0]+s.x, y=xyz[1]+s.y, z=xyz[2], ecl=rad*(23.4393-3.563e-7*d);
    const xe=x, ye=y*Math.cos(ecl)-z*Math.sin(ecl), ze=y*Math.sin(ecl)+z*Math.cos(ecl);
    const RA=Math.atan2(ye,xe), Dec=Math.atan2(ze,Math.hypot(xe,ye));
    const UT=date.getUTCHours()+date.getUTCMinutes()/60;
    const LST=rad*norm(s.L+180+UT*15+lon), HA=LST-RA;
    return Math.asin(Math.sin(rad*lat)*Math.sin(Dec)+Math.cos(rad*lat)*Math.cos(Dec)*Math.cos(HA))/rad;
  }
  /* tonight: the planets that are well above the horizon at some moment of the dark hours */
  function planets(date,lat,lon){
    const today=sun(date,lat,lon), tm=new Date(date); tm.setDate(tm.getDate()+1);
    const from=new Date(today.set.getTime()+50*60000), to=new Date(sun(tm,lat,lon).rise.getTime()-50*60000);
    const seen=[];
    Object.keys(EL).forEach(k=>{
      let best=-90;
      for(let t=from.getTime();t<=to.getTime();t+=30*60000){
        const when=new Date(t), d=(when-Date.UTC(1999,11,31))/DAY;
        best=Math.max(best,altitude(helio(EL[k],d),when,lat,lon));
      }
      if(best>10) seen.push(k);
    });
    return seen;
  }

  /* ---------- meteor showers ---------- */
  /* peak (month, day), how many days either side it lasts, its strength (ZHR), and where its
     radiant sits on the screen (x, y as a share of it) */
  const SHOWERS=[
    {id:"quadrantids",m:1,d:3,w:1.5,zhr:110,rx:.3,ry:.16},
    {id:"lyrids",m:4,d:22,w:2,zhr:18,rx:.72,ry:.2},
    {id:"etaAquariids",m:5,d:6,w:4,zhr:50,rx:.2,ry:.3},
    {id:"perseids",m:8,d:12,w:5,zhr:100,rx:.78,ry:.14},
    {id:"draconids",m:10,d:8,w:1,zhr:10,rx:.5,ry:.1},
    {id:"orionids",m:10,d:21,w:4,zhr:20,rx:.25,ry:.2},
    {id:"leonids",m:11,d:17,w:2,zhr:15,rx:.68,ry:.24},
    {id:"geminids",m:12,d:14,w:3,zhr:150,rx:.4,ry:.15},
    {id:"ursids",m:12,d:22,w:1.5,zhr:10,rx:.62,ry:.1}
  ];
  function shower(date){
    let best=null;
    SHOWERS.forEach(s=>{
      /* the nearest peak, this year or the next/previous one */
      let dd=Infinity;
      [-1,0,1].forEach(y=>{ const pk=new Date(date.getFullYear()+y,s.m-1,s.d,12); dd=Math.min(dd,Math.abs(date-pk)/DAY); });
      const strength=Math.sqrt(s.zhr/150)*Math.exp(-Math.pow(dd/s.w,2));
      if(strength>.06&&(!best||strength>best.strength)) best={...s,strength,share:.35+.5*strength,peak:dd<1};
    });
    return best;
  }

  return {sun,moon,planets,shower};
})();
