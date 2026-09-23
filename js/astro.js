/* ==========================================================
   astro.js — the real sky over Getafe, under the clock: the moon's phase
   (drawn as it looks tonight) and when the sun rises or sets.
   Computed here, offline, with the usual astronomical formulas
   (sun: the NOAA / SunCalc method; moon: the mean synodic month).
   Accurate to a minute or two, which is plenty for "the sun sets at 20:04".
   ========================================================== */
const Astro=(function(){
  const LAT=40.3057, LNG=-3.7329;                 /* Getafe */
  const rad=Math.PI/180, DAY=864e5, J1970=2440588, J2000=2451545;
  const toDays=d=>d/DAY-.5+J1970-J2000;
  const fromJulian=j=>new Date((j+.5-J1970)*DAY);
  const E=rad*23.4397;

  /* sunrise and sunset for a date (local day) */
  function sun(date){
    const lw=rad*-LNG, phi=rad*LAT, d=toDays(new Date(date.getFullYear(),date.getMonth(),date.getDate(),12));
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

  /* moon: age in days since the last new moon (0–29.5) and lit fraction */
  const SYNODIC=29.530588853, NEW_MOON=Date.UTC(2000,0,6,18,14);
  function moon(date){
    const age=(((date-NEW_MOON)/DAY)%SYNODIC+SYNODIC)%SYNODIC;
    return {age, phase:age/SYNODIC, lit:(1-Math.cos(2*Math.PI*age/SYNODIC))/2};
  }
  /* eight named phases */
  const phaseKey=p=>["new","waxingCrescent","firstQuarter","waxingGibbous","full","waningGibbous","lastQuarter","waningCrescent"][Math.floor(((p*8)+.5)%8)];

  /* the moon as it looks: the lit part on the right while it grows, on the left while it shrinks */
  function moonSVG(p){
    const r=7, c=8, k=Math.cos(2*Math.PI*p), rx=Math.abs(k)*r, waxing=p<.5;
    const crescent=k>0;
    const outer=waxing?`M${c} ${c-r}A${r} ${r} 0 0 1 ${c} ${c+r}`:`M${c} ${c-r}A${r} ${r} 0 0 0 ${c} ${c+r}`;
    const sweep=waxing?(crescent?0:1):(crescent?1:0);
    const lit=p<.02||p>.98?"":`<path class="moon-lit" d="${outer}A${rx.toFixed(2)} ${r} 0 0 ${sweep} ${c} ${c-r}Z"/>`;
    return `<svg class="moon" viewBox="0 0 16 16" aria-hidden="true"><circle class="moon-dark" cx="${c}" cy="${c}" r="${r}"/>${lit}</svg>`;
  }
  const SUN_SVG=`<svg class="sun" viewBox="0 0 16 16" aria-hidden="true"><path d="M1.5 12.5h13"/><path class="sun-disc" d="M4.2 12.5a3.8 3.8 0 0 1 7.6 0z"/><path d="M8 5.2v1.6M3.6 7.4l1.1 1.1M12.4 7.4l-1.1 1.1"/></svg>`;

  function draw(){
    const box=$("#skyInfo"); if(!box) return;
    const now=new Date(), m=moon(now), s=sun(now);
    /* the next sun event: sunrise before dawn, sunset during the day, tomorrow's sunrise at night */
    let sunText;
    if(now<s.rise) sunText=t("astro.rises",{time:hhmm(minutesOf(s.rise))});
    else if(now<s.set) sunText=t("astro.sets",{time:hhmm(minutesOf(s.set))});
    else { const tmr=new Date(now); tmr.setDate(tmr.getDate()+1); sunText=t("astro.risesTomorrow",{time:hhmm(minutesOf(sun(tmr).rise))}); }
    const moonText=t("astro.moon."+phaseKey(m.phase))+" · "+Math.round(m.lit*100)+" %";
    const html=`<span title="${esc(moonText)}">${moonSVG(m.phase)}<span>${esc(moonText)}</span></span>`+
      `<span>${SUN_SVG}<span>${esc(sunText)}</span></span>`;
    if(html!==box.dataset.html){ box.dataset.html=html; box.innerHTML=html; }   /* only touched when it changes */
  }
  document.addEventListener("minute",draw);
  draw();
  return {sun, moon, phaseKey};
})();
