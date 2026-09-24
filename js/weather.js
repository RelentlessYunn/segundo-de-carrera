/* ==========================================================
   weather.js — the sky outside, on home: weather now, today's high and
   low, and the next sunrise or sunset.
   · Place: where the device is (the browser asks once for permission);
     if it says no or cannot tell, Getafe.
   · Weather: Open-Meteo (free, no key). Place name: BigDataCloud.
   · Saved for 20 minutes on this device, so home opens instantly.
   · Without connection it still shows the sun, computed by astro.js.
   ========================================================== */
(function(){
  const box=$("#homeWeather"); if(!box) return;
  const FALLBACK={lat:40.3057, lon:-3.7329, name:"Getafe"};
  const CACHE="weather", FRESH=20*60000;
  let place=null, data=null, asked=false;

  /* weather codes (WMO) → text and icon */
  const KIND=c=>c===0?"clear":c<=2?"partly":c===3?"cloudy":c<=48?"fog":c<=57?"drizzle":c<=67?"rain":c<=77?"snow":c<=82?"showers":c<=86?"snow":"storm";
  const ICON={
    clear:(day)=>day?'<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3"/>'
      :'<path d="M15.5 3.8a8 8 0 1 0 4.7 12.3A6.5 6.5 0 0 1 15.5 3.8z"/>',
    partly:()=>'<path d="M8 5.2v1.4M3.7 9.5h1.4M4.9 6.4l1 1M11.1 6.4l-1 1"/><path d="M11.8 9.9a3.6 3.6 0 0 0-6.6 2"/><path d="M7.5 19.5h9.8a3.6 3.6 0 0 0 .3-7.2 5 5 0 0 0-9.6 1.1 3.1 3.1 0 0 0-.5 6.1z"/>',
    cloudy:()=>'<path d="M6.5 18.5h11a4 4 0 0 0 .4-8 5.6 5.6 0 0 0-10.8 1.3 3.4 3.4 0 0 0-.6 6.7z"/>',
    fog:()=>'<path d="M4 9h16M6 13h12M4 17h16"/>',
    drizzle:()=>'<path d="M6.5 14.5h11a4 4 0 0 0 .4-8 5.6 5.6 0 0 0-10.8 1.3 3.4 3.4 0 0 0-.6 6.7z"/><path d="M9 18v1M13 18v1M17 18v1"/>',
    rain:()=>'<path d="M6.5 13.5h11a4 4 0 0 0 .4-8 5.6 5.6 0 0 0-10.8 1.3 3.4 3.4 0 0 0-.6 6.7z"/><path d="M8.5 16.5l-1 3M12.5 16.5l-1 3M16.5 16.5l-1 3"/>',
    showers:()=>'<path d="M6.5 13.5h11a4 4 0 0 0 .4-8 5.6 5.6 0 0 0-10.8 1.3 3.4 3.4 0 0 0-.6 6.7z"/><path d="M8.5 16.5l-1.5 4M12.5 16.5l-1.5 4M16.5 16.5l-1.5 4"/>',
    snow:()=>'<path d="M6.5 13.5h11a4 4 0 0 0 .4-8 5.6 5.6 0 0 0-10.8 1.3 3.4 3.4 0 0 0-.6 6.7z"/><path d="M8.5 17.5h.01M12 19.5h.01M15.5 17.5h.01"/>',
    storm:()=>'<path d="M6.5 13.5h11a4 4 0 0 0 .4-8 5.6 5.6 0 0 0-10.8 1.3 3.4 3.4 0 0 0-.6 6.7z"/><path d="M12.5 14.5l-2 3.5h3l-2 3.5"/>'
  };
  const SUN='<path d="M2.5 16.5h19"/><path d="M6.8 16.5a5.2 5.2 0 0 1 10.4 0"/><path d="M12 7.3v1.8M6.2 10.2l1.2 1.2M17.8 10.2l-1.2 1.2"/>';
  const svg=(inner,cls)=>`<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
  const hm=d=>hhmm(minutesOf(d));

  /* the next sun event: sunrise before dawn, sunset during the day, tomorrow's sunrise at night */
  function nextSun(now,rise,set,riseTomorrow){
    if(now<rise) return [t("weather.sunriseLabel"),hm(rise)];
    if(now<set) return [t("weather.sunsetLabel"),hm(set)];
    return [t("weather.sunriseTomorrowLabel"),hm(riseTomorrow)];
  }
  /* a small card: now (icon, temperature, sky, place) on top, the day in four figures below */
  function draw(){
    const now=new Date(), p=place||FALLBACK;
    let rise,set,riseT;
    if(data&&data.daily&&data.daily.sunrise){
      rise=new Date(data.daily.sunrise[0]); set=new Date(data.daily.sunset[0]); riseT=new Date(data.daily.sunrise[1]);
    }
    if(!rise||isNaN(rise)||rise.toDateString()!==now.toDateString()){
      const s=Astro.sun(now,p.lat,p.lon), tm=new Date(now); tm.setDate(tm.getDate()+1);
      rise=s.rise; set=s.set; riseT=Astro.sun(tm,p.lat,p.lon).rise;
    }
    const [sunLabel,sunTime]=nextSun(now,rise,set,riseT);
    const c=data&&data.current, dl=data&&data.daily, k=c?KIND(c.weather_code):null;
    const stat=(label,value)=>`<div class="w-stat"><small>${esc(label)}</small><b>${esc(value)}</b></div>`;
    const html=`<div class="w-card">`+
      (c?`<div class="w-main">${svg(ICON[k](c.is_day),"w-ic")}<b class="w-temp">${Math.round(c.temperature_2m)}°</b>`+
          `<div class="w-what"><span>${esc(t("weather."+(k==="rain"?"rain_":k)))}</span><em>${esc(p.name)}</em></div></div>`
        :`<div class="w-main"><div class="w-what"><em>${esc(p.name)}</em></div></div>`)+
      `<div class="w-stats">`+
        (dl?stat(t("weather.max"),Math.round(dl.temperature_2m_max[0])+"°")+stat(t("weather.min"),Math.round(dl.temperature_2m_min[0])+"°")+
            stat(t("weather.rainLabel"),(dl.precipitation_probability_max?dl.precipitation_probability_max[0]:0)+" %"):"")+
        `<div class="w-stat w-sunstat"><small>${svg(SUN,"w-sun-ic")}${esc(sunLabel)}</small><b>${esc(sunTime)}</b></div>`+
      `</div></div>`;
    if(html!==box.dataset.html){ box.dataset.html=html; box.innerHTML=html; }
  }

  async function fetchWeather(p){
    const url=`https://api.open-meteo.com/v1/forecast?latitude=${p.lat.toFixed(3)}&longitude=${p.lon.toFixed(3)}`+
      `&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max`+
      `&timezone=auto&forecast_days=2`;
    const r=await fetch(url); if(!r.ok) throw new Error("weather "+r.status);
    return r.json();
  }
  async function placeName(lat,lon){
    try{
      const r=await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=${LANG}`);
      const j=await r.json(); return j.city||j.locality||j.principalSubdivision||"";
    }catch(e){ return ""; }
  }
  const locate=()=>new Promise(res=>{
    if(!navigator.geolocation) return res(null);
    navigator.geolocation.getCurrentPosition(pos=>res({lat:pos.coords.latitude,lon:pos.coords.longitude}),()=>res(null),
      {timeout:9000,maximumAge:30*60000});
  });

  async function load(p){
    try{
      const d=await fetchWeather(p);
      place=p; data=d;
      try{ localStorage.setItem(CACHE,JSON.stringify({at:Date.now(),place:p,data:d})); }catch(e){}
    }catch(e){ place=place||p; }
    draw();
  }
  const far=(a,b)=>Math.hypot(a.lat-b.lat,(a.lon-b.lon)*Math.cos(a.lat*Math.PI/180))>.05;   /* more than ~5 km */
  async function refresh(){
    let fresh=false;
    try{
      const saved=JSON.parse(localStorage.getItem(CACHE)||"null");
      if(saved&&saved.place){ place=saved.place; data=saved.data; draw(); fresh=Date.now()-saved.at<FRESH; }
    }catch(e){}
    /* the weather for the last known place (or Getafe) comes at once… */
    if(!fresh) load(place||FALLBACK);
    /* …and if the device says it is somewhere else, the weather follows it */
    if(asked) return;
    asked=true;
    const pos=await locate(); if(!pos) return;
    if(place&&!far(pos,place)&&fresh) return;
    const name=await placeName(pos.lat,pos.lon);
    load({lat:pos.lat,lon:pos.lon,name:name||t("weather.here")});
  }

  draw();                                          /* the sun, even before the weather arrives */
  /* only once the PIN is right: asking for the location over the PIN screen would be odd */
  Gate.onOpen(()=>refresh());
  document.addEventListener("minute",()=>{ draw(); if(!document.hidden&&!Gate.locked()){
    try{ const s=JSON.parse(localStorage.getItem(CACHE)||"null"); if(!s||Date.now()-s.at>FRESH) refresh(); }catch(e){} } });
})();
