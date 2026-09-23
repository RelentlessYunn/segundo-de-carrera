/* ==========================================================
   astro.js — sunrise and sunset for any place, computed offline
   (the NOAA / SunCalc method, accurate to a minute or two).
   weather.js uses it when the weather service cannot be reached.
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
  return {sun};
})();
