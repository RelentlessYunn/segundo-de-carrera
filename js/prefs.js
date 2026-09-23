/* ==========================================================
   prefs.js — user settings (language, theme, animations), saved on this
   device. index.html reads them in <head> before painting (so there is
   no flash of the wrong theme) and leaves them in window.SETTINGS.
   ========================================================== */
const SETTINGS_KEY="settings";
const SETTINGS_DEFAULTS={lang:"es",theme:"dark",motion:"full",quality:"high"};
const SETTINGS_OPTIONS={lang:["es","en"],theme:["dark","light","system"],motion:["full","basic","none"],quality:["high","low"]};
const SETTINGS=Object.assign({},SETTINGS_DEFAULTS,window.SETTINGS||{});
Object.keys(SETTINGS_OPTIONS).forEach(k=>{ if(!SETTINGS_OPTIONS[k].includes(SETTINGS[k])) SETTINGS[k]=SETTINGS_DEFAULTS[k]; });

const systemReduced=()=>matchMedia("(prefers-reduced-motion:reduce)").matches;
/* nothing moves: "none" in Settings or reduced motion in the system */
const lowMotion=()=>SETTINGS.motion==="none"||systemReduced();
/* decorations too (aurora, stars, confetti, counters): only with "full" */
const fullMotion=()=>SETTINGS.motion==="full"&&!systemReduced();
/* high quality: the sea of stars, glass, glows. Low: plain background and nothing heavy */
const highQuality=()=>SETTINGS.quality==="high";
/* the showy extras (stardust, warp, shooting stars) need both */
const fancy=()=>fullMotion()&&highQuality();

/* the header stays dark in both themes, so the browser's bar colour (theme-color) does not change */
function applyTheme(){
  const dark=matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.dataset.theme=SETTINGS.theme==="system"?(dark?"dark":"light"):SETTINGS.theme;
}
matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{ if(SETTINGS.theme==="system") applyTheme(); });

/* saves one setting. Language re-renders everything, so the page reloads. */
function saveSetting(key,value){
  if(!SETTINGS_OPTIONS[key]||!SETTINGS_OPTIONS[key].includes(value)) return;
  const changed=SETTINGS[key]!==value;
  SETTINGS[key]=value;
  try{ localStorage.setItem(SETTINGS_KEY,JSON.stringify(SETTINGS)); }catch(e){}
  if(!changed) return;
  if(key==="lang"||key==="motion"||key==="quality"){ location.reload(); return; }
  if(key==="theme") applyTheme();
  emit("settings",{key,value});
}
applyTheme();
