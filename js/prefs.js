/* ==========================================================
   prefs.js — user settings (language, animations, quality), saved on this
   device. index.html reads them in <head> before painting (so there is
   no flash of the wrong look) and leaves them in window.SETTINGS.
   There is only the dark, starry look: the light theme was removed in v0.52.
   ========================================================== */
const SETTINGS_KEY="settings";
const SETTINGS_DEFAULTS={lang:"es",motion:"full",quality:"high"};
const SETTINGS_OPTIONS={lang:["es","en"],motion:["full","basic","none"],quality:["high","medium","low"]};
const SETTINGS=Object.assign({},SETTINGS_DEFAULTS,window.SETTINGS||{});
Object.keys(SETTINGS_OPTIONS).forEach(k=>{ if(!SETTINGS_OPTIONS[k].includes(SETTINGS[k])) SETTINGS[k]=SETTINGS_DEFAULTS[k]; });

const systemReduced=()=>matchMedia("(prefers-reduced-motion:reduce)").matches;
/* nothing moves: "none" in Settings or reduced motion in the system */
const lowMotion=()=>SETTINGS.motion==="none"||systemReduced();
/* decorations too (stars, stardust, counters): only with "full" */
const fullMotion=()=>SETTINGS.motion==="full"&&!systemReduced();
/* high quality: the 3D universe, glass, glows. Medium: the same look with a plain sky of
   simple stars instead of the universe. Low: plain background and nothing heavy */
const highQuality=()=>SETTINGS.quality==="high";
/* the showy extras (stardust, warp, shooting stars) need both */
const fancy=()=>fullMotion()&&highQuality();

/* saves one setting. Language re-renders everything, so the page reloads. */
function saveSetting(key,value){
  if(!SETTINGS_OPTIONS[key]||!SETTINGS_OPTIONS[key].includes(value)) return;
  const changed=SETTINGS[key]!==value;
  SETTINGS[key]=value;
  try{ localStorage.setItem(SETTINGS_KEY,JSON.stringify(SETTINGS)); }catch(e){}
  if(!changed) return;
  /* these change the whole page: it reloads, through the passage of shift.js */
  if(key==="lang"||key==="motion"||key==="quality"){ if(typeof Shift!=="undefined") Shift.leave(key); else location.reload(); return; }
  emit("settings",{key,value});
}
