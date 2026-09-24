/* ==========================================================
   run.js — automatic checks of the site in a real browser.
   Usage (from the project folder):   node tests/run.js
   Needs Playwright with Chromium (npm i playwright). It never touches the
   real cloud: JSONBin calls are simulated.
   Exits with code 1 if anything fails.
   ========================================================== */
const {chromium}=require("playwright");
const path=require("path");
const PAGE="file://"+path.resolve(__dirname,"..","index.html");
let failures=0;
const ok=(c,text)=>{ console.log((c?"  ✔ ":"  ✘ ")+text); if(!c) failures++; };
const section=text=>console.log("\n"+text);

/* opens the page at a given time (local time of this computer) */
const DEVICE="f9d8f1cd96a7b5ffd4c1f01c7f5f0a7c00940726b33625b4755a1d4f25a91f20";
async function open(b,{hash="",time="2026-09-21T13:06:00",mobile=false,clock="fixed",routes,before,settings,locked=false}={}){
  const ctx=await b.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},hasTouch:mobile,isMobile:mobile});
  const p=await ctx.newPage();
  p.errors=[];
  p.on("pageerror",e=>p.errors.push(e.message));
  await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  if(routes) await routes(p);
  if(settings) await p.addInitScript(s=>localStorage.setItem("settings",s),JSON.stringify(settings));
  /* this device already knows the PIN, unless the test is about the gate */
  if(!locked) await p.addInitScript(k=>{ if(!sessionStorage.getItem("keep")) localStorage.setItem("nolan-device",k); },DEVICE);
  if(before) await p.addInitScript(before);
  if(clock==="fixed") await p.clock.setFixedTime(new Date(time)); else await p.clock.install({time:new Date(time)});
  await p.goto(PAGE+(hash?"#"+hash:""),{waitUntil:"load"});
  await p.waitForTimeout(clock==="fixed"?900:50);
  return p;
}
/* simulated JSONBin: remembers the last write */
function fakeCloud(initial,mode,writes){
  return async p=>{
    let reads=0;
    await p.route("https://api.jsonbin.io/**",async r=>{
      if(r.request().method()==="PUT"){ writes.push(JSON.parse(r.request().postData())); return r.fulfill({status:200,body:"{}",contentType:"application/json"}); }
      reads++;
      if(mode==="fails"&&reads===1) return r.fulfill({status:503,body:"down"});
      if(mode==="slow"&&reads===1) await new Promise(x=>setTimeout(x,2500));
      const rec=writes.length?writes[writes.length-1]:initial;
      return r.fulfill({status:200,contentType:"application/json",body:JSON.stringify({record:rec})});
    });
  };
}
const FAKE_CONFIG=()=>{ Object.defineProperty(window,"CONFIG",{value:{BIN_ID:"test",API_KEY:"test"},writable:false}); };

(async()=>{
  /* if this Playwright version has no browser of its own, the system Chromium is used */
  const b=await chromium.launch().catch(()=>chromium.launch({executablePath:process.env.CHROMIUM||"/opt/pw-browsers/chromium"}));

  section("Loading");
  for(const mobile of [false,true]){
    const p=await open(b,{mobile});
    const r=await p.evaluate(()=>({width:document.documentElement.scrollWidth,errors:CHECK.errors,warnings:CHECK.warnings.length,
      banner:!document.getElementById("errorBanner").hidden}));
    ok(!p.errors.length,`${mobile?"mobile":"desktop"}: no JavaScript errors ${p.errors.join(" | ")}`);
    ok(!r.errors.length&&!r.banner,`${mobile?"mobile":"desktop"}: data without errors ${r.errors.join(" | ")}`);
    if(mobile) ok(r.width<=390,`mobile: nothing sticks out of the screen (${r.width}px)`);
    if(r.warnings) console.log(`    (the checker leaves ${r.warnings} warnings in the console)`);
    await p.context().close();
  }

  section("PIN and start");
  {
    const p=await open(b,{locked:true,mobile:true});
    ok(await p.evaluate(()=>document.documentElement.hasAttribute("data-locked")&&!document.getElementById("gate").hidden
      &&getComputedStyle(document.querySelector("body > div.wrap")).visibility==="hidden"),"a new device sees only the PIN screen");
    for(const k of "123456") await p.click(`#gate [data-k="${k}"]`);
    await p.waitForTimeout(1200);
    ok(await p.evaluate(()=>document.documentElement.hasAttribute("data-locked")&&/incorrecto/.test(document.getElementById("gateMsg").textContent)),"a wrong PIN keeps it locked");
    for(const k of "220226") await p.click(`#gate [data-k="${k}"]`);
    await p.waitForTimeout(2500);
    ok(await p.evaluate(()=>Universe.busy()&&Universe.scene()==="home"&&document.getElementById("gate").classList.contains("leaving")),"the keypad drifts away and the camera flies into the home galaxy");
    /* (a slow software graphics card stretches the flight: wait for it to land, not a fixed time) */
    await p.waitForFunction(()=>!document.documentElement.hasAttribute("data-locked")&&!Universe.busy(),null,{timeout:20000}).catch(()=>{});
    const r=await p.evaluate(()=>({locked:document.documentElement.hasAttribute("data-locked"),saved:localStorage.getItem("nolan-device"),
      home:!document.getElementById("portal").hidden,canvas:Universe.busy()}));
    ok(!r.locked&&r.saved&&r.home&&!r.canvas,"the right PIN opens it, lands on home and the device remembers it");
    await p.evaluate(()=>sessionStorage.setItem("keep","1"));
    await p.reload(); await p.waitForTimeout(600);
    ok(await p.evaluate(()=>!document.documentElement.hasAttribute("data-locked")&&document.getElementById("gate").hidden),"the same device is not asked again");
    ok(!(await p.content()).includes("220226"),"the PIN itself is nowhere in the page");
    await p.goto(PAGE+"#settings"); await p.waitForTimeout(500);
    await p.click("#logout"); await p.waitForTimeout(400);
    ok(await p.evaluate(()=>document.documentElement.hasAttribute("data-locked")&&!document.getElementById("gate").hidden&&!localStorage.getItem("nolan-device")),
      "Log out (in Settings) forgets the device and asks for the PIN again");
    for(const k of "220226") await p.click(`#gate [data-k="${k}"]`);
    await p.waitForFunction(()=>!document.documentElement.hasAttribute("data-locked")&&!Universe.busy(),null,{timeout:20000}).catch(()=>{});
    ok(await p.evaluate(()=>!document.documentElement.hasAttribute("data-locked")&&location.hash==="#home"&&!document.querySelector('#portal .p-view[data-view="home"]').hidden),
      "after logging out from Settings, the PIN lands on home again");
    await p.context().close();
  }
  {
    const p=await open(b);
    ok(await p.evaluate(()=>!document.getElementById("portal").hidden),"the app starts at home");
    await p.waitForTimeout(3500); await p.click("#homeUc3m"); await p.waitForTimeout(1200);
    ok(await p.evaluate(()=>Universe.busy()&&Universe.scene()==="uc3m"),"UC3M: the camera flies to the UC3M galaxy");
    /* (a slow software graphics card can stretch the flight: wait for it to land, not a fixed time) */
    await p.waitForFunction(()=>document.getElementById("portal").hidden&&!Universe.busy(),null,{timeout:10000}).catch(()=>{});
    ok(await p.evaluate(()=>document.getElementById("portal").hidden&&location.hash==="#schedule"&&!Universe.busy()&&Universe.scene()==="uc3m"),
      "…and lands on the timetable, inside that galaxy");
    await p.click('header a[href="#notes"]'); await p.waitForTimeout(600);
    ok(await p.evaluate(()=>Universe.scene()==="uc3m"&&!document.getElementById("notes").hidden&&document.querySelector("#notes .p-back-top").getAttribute("href")==="#schedule"),
      "Notes open from UC3M without leaving its galaxy, and Back returns to the timetable");
    await p.click("#notes .p-back-top"); await p.waitForTimeout(600);
    await p.click("header .home-btn"); await p.waitForTimeout(3200);
    await p.click("#homeUc3m"); await p.waitForTimeout(250); await p.mouse.click(640,450);
    /* (home fades out in 280 ms; a slow software graphics card can delay that timer, so wait for it) */
    await p.waitForFunction(()=>document.getElementById("portal").hidden,null,{timeout:2000}).catch(()=>{});
    ok(await p.evaluate(()=>document.getElementById("portal").hidden&&location.hash==="#schedule"&&Universe.busy()&&Universe.scene()==="uc3m"),
      "a second click during the trip shows the timetable at once, while the camera flies on (the sky never jumps)");
    await p.click("header .home-btn"); await p.waitForTimeout(200);
    ok(await p.evaluate(()=>Universe.scene()==="home"&&!!document.querySelector("header .home-btn .logo-mark")),"the logo takes you home, flying back to the home galaxy");
    await p.waitForTimeout(2800);
    await p.click('.p-card[data-galaxy="andromeda"]'); await p.waitForFunction(()=>location.hash==="#soon/andromeda"&&!Universe.busy(),null,{timeout:15000}).catch(()=>{});
    ok(await p.evaluate(()=>Universe.scene()==="andromeda"&&!document.getElementById("soonView").hidden&&location.hash==="#soon/andromeda"),"a galaxy to explore opens inside its own galaxy");
    await p.goto(PAGE+"#notes"); await p.waitForTimeout(500);
    ok(await p.evaluate(()=>!document.getElementById("portal").hidden&&!document.getElementById("notes").hidden&&!!document.querySelector("#portal #notesText")),"Notes open inside home");
    await p.goto(PAGE+"#ajustes"); await p.waitForTimeout(500);
    ok(await p.evaluate(()=>!document.getElementById("portal").hidden&&!document.getElementById("settings").hidden&&location.hash==="#settings"),"Settings open inside home (old links too)");
    await p.context().close();
  }
  {
    /* on a phone home's content spans the whole width: it must not cover Notes and Settings */
    const p=await open(b,{hash:"soon/sombrero",mobile:true});
    const onTop=await p.evaluate(()=>[...document.querySelectorAll("#portal .p-tool")].every(a=>{
      const r=a.getBoundingClientRect(), hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      return r.width>0&&a.contains(hit);
    }));
    await p.tap("#portal .p-tool.gear-btn"); await p.waitForTimeout(400);
    ok(onTop&&await p.evaluate(()=>location.hash==="#settings"&&!document.getElementById("settings").hidden),
      "mobile: inside a galaxy, Notes and Settings can be tapped");
    await p.context().close();
  }
  for(const mobile of [false,true]){
    const p=await open(b,{hash:"home",mobile});
    await p.waitForFunction(()=>Universe.ready(),null,{timeout:20000}).catch(()=>{});
    const seen=await p.evaluate(()=>!Universe.gl()||Universe.hole());
    ok(seen&&!p.errors.length,`${mobile?"mobile":"desktop"}: the black hole is in the sky of home ${p.errors.join(" | ")}`);
    /* its own window: the camera flies up close, the text sits below it */
    await p.click('.p-card[data-galaxy="blackhole"]');
    await p.waitForFunction(()=>location.hash==="#blackhole"&&!Universe.busy(),null,{timeout:12000}).catch(()=>{});
    const r=await p.evaluate(()=>({scene:Universe.scene(),hash:location.hash,view:!document.getElementById("holeView").hidden,
      top:getComputedStyle(document.querySelector("#portal .p-top")).display,seen:!Universe.gl()||Universe.hole()}));
    ok(r.scene==="blackhole"&&r.hash==="#blackhole"&&r.view&&r.top==="none"&&r.seen,`${mobile?"mobile":"desktop"}: the black hole card flies up close to it (${JSON.stringify(r)})`);
    await p.click("#holeView .p-back"); await p.waitForTimeout(3200);
    ok(await p.evaluate(()=>Universe.scene()==="home"&&location.hash==="#home"),`${mobile?"mobile":"desktop"}: and back home`);
    await p.context().close();
  }

  section("Tabs");
  {
    const p=await open(b,{hash:"schedule"});
    for(const tab of ["subjects","exams","tasks","faculty","schedule"]){
      await p.click(`nav.bar a[data-tab=${tab}]`); await p.waitForTimeout(1000);
      const r=await p.evaluate(()=>{ const on=document.querySelector("a[data-tab].on"), i=document.querySelector(".tab-pill").getBoundingClientRect(), a=on.getBoundingClientRect();
        return {tab:on.dataset.tab,dx:Math.abs(i.left-a.left),cur:on.getAttribute("aria-current")}; });
      ok(r.tab===tab&&r.dx<2&&r.cur==="page",`${tab}: active, with the pill on top and aria-current (${r.dx.toFixed(1)}px)`);
    }
    await p.goto(PAGE+"#asignaturas"); await p.waitForTimeout(500);
    ok(await p.evaluate(()=>location.hash==="#subjects"&&!document.getElementById("subjects").hidden),"old Spanish links (#asignaturas) still work");
    await p.context().close();
  }

  section("Today: red line and live status (Monday 21 Sep)");
  for(const [time,mode,text] of [["08:12","pinned-top","empiezas en 48 min"],["10:36","","siguiente en 9 min"],["13:06","","quedan 54 min"],["16:40","pinned-bottom","día de clase terminado"]]){
    const p=await open(b,{time:"2026-09-21T"+time+":00"});
    const r=await p.evaluate(()=>({live:document.getElementById("dayLive").textContent,cls:(document.querySelector(".now-line")||{}).className}));
    ok(r.live===text&&r.cls==="now-line"+(mode?" "+mode:""),`${time}: "${r.live}" (${r.cls})`);
    await p.context().close();
  }
  {
    const p=await open(b,{time:"2026-09-21T13:06:00"});
    ok(await p.evaluate(()=>!document.querySelector("#dayList .trow i, #dayList .trow u")),"the class rows have no progress bar");
    await p.context().close();
  }
  {
    const p=await open(b,{time:"2026-09-21T12:28:50",clock:"live"});
    await p.clock.runFor(72000);
    const r=await p.evaluate(()=>[document.querySelector("#clockTime").textContent.replace(/\s/g,""),document.getElementById("dayLive").textContent,document.querySelectorAll(".trow.now").length]);
    ok(r[0]==="12:30"&&r[1]==="quedan 1 h 30 min"&&r[2]===1,`when the minute changes everything updates together (${r.join(" · ")})`);
    await p.clock.setSystemTime(new Date("2026-09-21T23:59:50")); await p.clock.runFor(61000);
    ok(/Martes, 22/.test(await p.textContent("#dayTitle")),"at midnight Today moves to the next day");
    await p.context().close();
  }
  {
    const p=await open(b,{time:"2026-12-01T08:00:00"});
    const r=await p.evaluate(()=>document.getElementById("next7").textContent);
    ok(/semana 13/.test(r)&&!/en 4 días/.test(r),"dates without a confirmed day show as \"semana N\", without a countdown");
    await p.context().close();
    const q=await open(b,{time:"2026-10-27T10:00:00"});
    ok(/cierra el sábado/.test(await q.textContent("#next7")),"a window of several days stays visible while it is open");
    await q.context().close();
  }

  section("Cloud (simulated JSONBin)");
  const REC={hechas:["gk_0","tk_is_0"],grades:{g_main_ed_0:"7"},notas:"old notes"};
  for(const mode of ["fails","slow","normal"]){
    const writes=[];
    const p=await open(b,{hash:"tasks",routes:fakeCloud(REC,mode,writes),before:FAKE_CONFIG});
    await p.locator("#generalTasks input").nth(2).check();
    await p.waitForTimeout(5000);
    const u=writes[writes.length-1]||{};
    ok(u.notas==="old notes"&&(u.hechas||[]).length===3&&u.grades&&u.grades["g_main_ed_parcial-1"]==="7",
      `first read ${mode}: nothing is lost and old ids are translated (${(u.hechas||[]).length} ticks)`);
    await p.context().close();
  }
  {
    const writes=[];
    const p=await open(b,{hash:"notes",routes:fakeCloud(REC,"fails",writes),before:FAKE_CONFIG});
    ok(await p.evaluate(()=>document.getElementById("notesText").readOnly),"notes cannot be typed until the saved ones arrive");
    await p.waitForTimeout(3000);
    ok(await p.inputValue("#notesText")==="old notes","after retrying the saved notes appear");
    await p.goto(PAGE+"#subjects"); await p.waitForTimeout(2500);
    const inp=p.locator('.g-input[data-scope=main][data-subj=ed]').nth(1);
    await inp.fill("7,5"); await inp.press("Tab"); await p.waitForTimeout(1500);
    ok(/Acumulado: 3.63/.test(await p.textContent("#res-main-ed")),"a grade with a comma (7,5) counts as 7.5");
    await p.context().close();
  }

  section("Planner");
  {
    const p=await open(b,{time:"2026-10-20T10:00:00"});
    const r=await p.evaluate(()=>({opens:document.querySelectorAll("#planner-grid .m-chip.opens").length,
      closes:document.querySelectorAll("#planner-grid .m-chip.closing").length,links:document.querySelectorAll("#planner-grid .m-link").length}));
    ok(r.opens===1&&r.closes===1&&r.links===4,`a window of several days (26–31 Oct) is joined by a line (${r.links} days in between)`);
    await p.context().close();
  }

  section("Home");
  {
    const p=await open(b,{hash:"subjects"});
    await p.click(".home-btn"); await p.waitForTimeout(400);
    ok(await p.evaluate(()=>!document.getElementById("portal").hidden&&document.querySelector("nav.bar").inert),"the home button opens the window and blocks what is behind");
    ok(await p.evaluate(()=>{ const w=getComputedStyle(document.querySelector("body > div.wrap"));
      return w.visibility==="hidden"&&w.opacity==="0"&&w.contentVisibility==="hidden"; }),"while home is open, the page behind is not drawn at all (no lines of its tables through home)");
    await p.keyboard.press("Escape");
    await p.waitForFunction(()=>document.getElementById("portal").hidden,null,{timeout:3000}).catch(()=>{});
    ok(await p.evaluate(()=>document.getElementById("portal").hidden&&location.hash==="#subjects"),"Escape closes it and you are back on the same tab");
    /* just the sky: the interface hides, the way back stays, Escape returns */
    await p.click('header [data-view-sky]'); await p.waitForTimeout(800);
    const v=await p.evaluate(()=>({on:document.documentElement.classList.contains("viewing"),exit:!document.getElementById("viewExit").hidden,
      page:getComputedStyle(document.querySelector("body > div.wrap")).opacity,header:getComputedStyle(document.querySelector("header.top")).pointerEvents}));
    await p.keyboard.press("Escape"); await p.waitForTimeout(800);
    const back=await p.evaluate(()=>!document.documentElement.classList.contains("viewing")&&document.getElementById("viewExit").hidden
      &&getComputedStyle(document.querySelector("body > div.wrap")).opacity==="1"&&location.hash==="#subjects");
    ok(v.on&&v.exit&&v.page==="0"&&v.header==="none"&&back,`the eye button shows just the sky, and Escape brings everything back (${JSON.stringify(v)})`);
    await p.goto(PAGE+"#nolan"); await p.waitForTimeout(600);
    ok(await p.evaluate(()=>!document.getElementById("nolanView").hidden),"#nolan opens the Nolan section");
    await p.context().close();
  }

  section("Settings");
  {
    const p=await open(b,{hash:"settings"});
    ok(await p.evaluate(()=>!document.getElementById("settings").hidden&&document.querySelectorAll("#settingsList .seg").length===2&&!!document.querySelector(".seg[data-key=look]")&&!document.querySelector(".seg[data-key=theme]")),"#settings shows language and Effects, one choice for animations and quality (no light theme any more)");
    const nav=p.waitForEvent("framenavigated");
    await p.click('.seg[data-key=lang] button[data-value=en]'); await p.waitForTimeout(250);
    ok(await p.evaluate(()=>document.getElementById("shift").classList.contains("on")&&!document.querySelector("#shift canvas")),"changing a setting fades softly before reloading (no tunnel of stars)");
    await nav; await p.waitForLoadState("domcontentloaded");
    ok(await p.evaluate(()=>document.documentElement.classList.contains("shifting")||document.getElementById("shift").classList.contains("on")),"after reloading, the passage still covers the page");
    await p.waitForLoadState("load");
    await p.waitForFunction(()=>!document.documentElement.classList.contains("shifting")&&!document.getElementById("shift").classList.contains("on"),null,{timeout:20000}).catch(()=>{});
    const en=await p.evaluate(()=>({lang:document.documentElement.lang,tab:document.querySelector("a[data-tab=schedule] .tab-label").textContent,
      title:document.querySelector("#settings h2").textContent,shift:document.getElementById("shift").classList.contains("on"),
      light:!!document.querySelector('link[href*="light.css"]')}));
    ok(en.lang==="en"&&en.tab==="Schedule"&&en.title==="Settings"&&!en.shift,`English after reloading, and the passage has faded away (${JSON.stringify(en)})`);
    ok(!en.light,"the light theme is gone");
    await p.context().close();
  }
  for(const lang of ["es","en"]){
    const p=await open(b,{settings:{lang}});
    for(const h of ["schedule","subjects","exams","tasks","faculty","notes","settings","home","nolan"]){ await p.goto(PAGE+"#"+h); await p.waitForTimeout(250); }
    const r=await p.evaluate(()=>({missing:[...I18N_MISSING],raw:[...document.querySelectorAll("body *")].filter(el=>el.children.length===0&&/^[a-z]+\.[a-zA-Z.]+$/.test(el.textContent.trim())).map(el=>el.textContent)}));
    ok(!r.missing.length&&!r.raw.length&&!p.errors.length,`${lang}: every text has a translation ${r.missing.concat(r.raw).join(", ")}`);
    await p.context().close();
  }
  {
    const p=await open(b,{settings:{lang:"en"},time:"2026-10-27T10:00:00"});
    const r=await p.evaluate(()=>[document.getElementById("dayTitle").textContent,document.getElementById("next7").textContent]);
    ok(r[0]==="Today · Tuesday, 27 October"&&/closes Saturday/.test(r[1]),`English dates: "${r[0]}"`);
    await p.context().close();
  }
  {
    const p=await open(b,{settings:{motion:"none"},hash:"schedule"});
    ok(await p.evaluate(()=>getComputedStyle(document.querySelector(".sky-layer.l-a")).animationName==="none"&&document.documentElement.dataset.motion==="none"),"Animations: None stops everything");
    await p.context().close();
    const q=await open(b,{settings:{motion:"basic"},hash:"schedule"});
    ok(await q.evaluate(()=>getComputedStyle(document.querySelector(".sky-layer.l-a")).animationName==="none"&&getComputedStyle(document.querySelector("#stats b")).animationName!==undefined),"Animations: Basic stops the decorations");
    await q.context().close();
  }

  section("Astral");
  {
    const weather=async p=>{
      await p.route("https://api.open-meteo.com/**",r=>r.fulfill({status:200,contentType:"application/json",body:JSON.stringify({
        current:{temperature_2m:24.4,weather_code:1,is_day:1},
        daily:{temperature_2m_max:[28.2,27],temperature_2m_min:[14.1,13],sunrise:["2026-09-23T08:04","2026-09-24T08:05"],sunset:["2026-09-23T20:13","2026-09-24T20:11"],precipitation_probability_max:[5,0]}})}));
    };
    const p=await open(b,{time:"2026-09-23T16:05:00",routes:weather});
    await p.waitForTimeout(1500);
    const r=await p.evaluate(()=>({w:document.getElementById("homeWeather").textContent,
      layers:document.querySelectorAll("#sky .sky-layer").length,shown:getComputedStyle(document.querySelector("#sky .sky-par")).display,
      header:!!document.getElementById("skyInfo")}));
    ok(/24°/.test(r.w)&&/Getafe/.test(r.w)&&/20:13/.test(r.w)&&/Máx\.28°/.test(r.w)&&/Puesta de sol20:13/.test(r.w)&&!r.header,`weather and sunset on home, nothing under the UC3M clock ("${r.w}")`);
    const painted=await p.waitForFunction(()=>Universe.gl()&&Universe.painted()===5,null,{timeout:120000}).then(()=>true,()=>false);
    ok(painted&&await p.evaluate(()=>document.documentElement.classList.contains("gl")&&getComputedStyle(document.getElementById("sky")).display==="none"),"Quality = High: the whole sky and the five galaxies are drawn in 3D by the graphics card (the CSS sky steps aside)");
    const all=await p.waitForFunction(()=>Universe.built().length===8,null,{timeout:60000}).then(()=>true,()=>false);
    ok(all&&await p.evaluate(()=>{ Universe.seek(120); Universe.shoot(.4); return true; })&&!p.errors.length,"Andrómeda's companions are built too; time, shooting stars and a comet run without errors");
    /* the wonders: each one compiled and drawn, a supernova shown, nothing left out */
    await p.waitForFunction(()=>window.UNIVERSE_EXTRAS.every(x=>x.ready||x.broken),null,{timeout:60000}).catch(()=>{});
    await p.waitForTimeout(300);
    const wn=await p.evaluate(()=>({list:Wonders.list(),broken:window.UNIVERSE_EXTRAS.filter(x=>x.broken).map(x=>x.id),nova:Wonders.nova(-.5,-.5,10),state:Wonders.state()}));
    ok(wn.list.join()==="orion,pillars,pleiades,ringneb,pulsar,binary,antennae,nova,earth"&&!wn.broken.length&&wn.nova&&wn.state&&wn.state.k>0&&wn.state.at&&!p.errors.length,
      `the nine wonders compile and draw, and a supernova can flare (${JSON.stringify(wn)})`);
    /* the opening: from the Earth and the Moon, the first time in a session */
    ok(await p.evaluate(()=>{ Universe.go("gate",{animate:false}); return Universe.ready(); })&&!p.errors.length,"the Earth and the Moon are drawn at the opening");
    /* tonight's sky on the weather card: the Moon as it is, the planets up tonight */
    const night=await p.evaluate(()=>{ const n=document.querySelector("#homeWeather .w-night"); return n?n.textContent:""; });
    ok(/Esta noche/.test(night)&&/Luna gibosa creciente/.test(night)&&/90\s*%/.test(night)&&/Marte/.test(night)&&/Júpiter/.test(night)&&/Saturno/.test(night),`tonight's sky on the weather card ("${night}")`);
    await p.context().close();
    /* the real sky, computed without connection */
    const ast=await (async()=>{ const a=await open(b,{time:"2026-08-12T22:00:00",hash:"schedule"});
      const r=await a.evaluate(()=>({new0:Astro.moon(new Date(2026,7,12,12)).name,full:Astro.moon(new Date(2026,9,26,12)).name,
        per:(Astro.shower(new Date(2026,7,12,22))||{}).id,gem:(Astro.shower(new Date(2026,11,14,22))||{}).id,none:Astro.shower(new Date(2026,2,10)),
        pl:Astro.planets(new Date(2026,8,23,16),40.305,-3.731)}));
      await a.context().close(); return r; })();
    ok(ast.new0==="new"&&ast.full==="full"&&ast.per==="perseids"&&ast.gem==="geminids"&&ast.none===null&&ast.pl.join()==="mars,jupiter,saturn",
      `the Moon's phase, the planets and the meteor showers come out right (${JSON.stringify(ast)})`);
    const q=await open(b,{settings:{quality:"low"},hash:"tasks"});
    const s=await q.evaluate(()=>({shown:getComputedStyle(document.querySelector("#sky .sky-par")).display,
      blur:getComputedStyle(document.querySelector("nav.bar")).backdropFilter,stars:document.querySelectorAll("#tasksConstellation .c-star").length}));
    ok(s.shown==="none"&&(s.blur==="none"||!s.blur),"Quality = Low: no stars, no glass");
    ok(await q.evaluate(()=>Universe.painted()===0&&!Universe.gl()&&!document.documentElement.classList.contains("gl")),"Quality = Low: no 3D universe at all");
    await q.locator("#generalTasks input").nth(0).check(); await q.waitForTimeout(200);
    ok(s.stars>0&&await q.evaluate(()=>document.querySelectorAll("#tasksConstellation .c-star.on").length===1),`the constellation lights a star per task done (${s.stars} stars)`);
    await q.context().close();
    const md=await open(b,{settings:{quality:"medium"},hash:"schedule"});
    const mr=await md.evaluate(()=>{ const c=document.querySelector("#sky .sky-simple");
      return {gl:Universe.gl(),cls:document.documentElement.classList.contains("gl"),canvas:!!c&&c.classList.contains("ready")&&c.width>0,
        layers:getComputedStyle(document.querySelector("#sky .sky-par")).display,sky:getComputedStyle(document.getElementById("sky")).display,
        uni:getComputedStyle(document.getElementById("universe")).display,glass:getComputedStyle(document.querySelector("nav.bar")).backdropFilter}; });
    ok(!mr.gl&&!mr.cls&&mr.canvas&&mr.layers==="none"&&mr.sky!=="none"&&mr.uni==="none"&&mr.glass&&mr.glass!=="none"&&!md.errors.length,
      `Quality = Medium: no galaxies, a still sky of simple stars, the glass look kept (${JSON.stringify(mr)})`);
    ok(await md.evaluate(()=>document.querySelectorAll('.seg[data-key="look"] button').length===3
      &&document.querySelector('.seg[data-key="look"] button[aria-checked=true]').dataset.value==="medium"
      &&LOOKS.high.motion==="full"&&LOOKS.high.quality==="high"&&LOOKS.medium.quality==="medium"&&LOOKS.low.motion==="none"&&LOOKS.low.quality==="low"),
      "Effects offers three levels (High, Medium, Minimal), each setting animations and quality together");
    /* Medium: each section is a star; opening one flies into it, quicker than the 3D flight */
    await md.goto(PAGE+"#home"); await md.waitForTimeout(3500);
    await md.click("#homeUc3m"); await md.waitForTimeout(300);
    const fly=await md.evaluate(()=>({busy:Universe.busy(),stars:!!window.Stars,scene:Stars.scene()}));
    await md.waitForFunction(()=>location.hash==="#schedule"&&!Universe.busy(),null,{timeout:5000}).catch(()=>{});
    ok(fly.busy&&fly.stars&&fly.scene==="uc3m"&&await md.evaluate(()=>document.getElementById("portal").hidden&&Stars.scene()==="uc3m"),
      `Quality = Medium: opening UC3M flies into its star and lands in its own sky (${JSON.stringify(fly)})`);
    await md.context().close();
  }

  section("Compact header when scrolled");
  {
    const p=await open(b,{hash:"subjects"});
    await p.waitForTimeout(400); await p.evaluate(()=>window.scrollTo(0,700));
    await p.waitForFunction(()=>scrollY>600&&document.body.classList.contains("compact"),null,{timeout:4000}).catch(()=>{}); await p.waitForTimeout(500);
    const d=await p.evaluate(()=>({on:document.body.classList.contains("compact"),time:document.querySelector(".mini-l .mini-time").textContent,
      home:getComputedStyle(document.querySelector(".mini-l")).opacity,inert:document.querySelector(".mini-r").inert,
      links:[...document.querySelectorAll(".mini-r a")].map(a=>a.getAttribute("href")).join(" ")}));
    ok(d.on&&d.time==="13:06"&&+d.home>.9&&!d.inert&&/#notes/.test(d.links)&&/#settings/.test(d.links),`computer: scrolled down, the tab bar keeps home, the time, notes and settings (${JSON.stringify(d)})`);
    await p.click(".mini-l .home-btn"); await p.waitForTimeout(400);
    ok(await p.evaluate(()=>location.hash==="#home"),"the small logo takes you home");
    await p.goto(PAGE+"#subjects"); await p.waitForTimeout(400); await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(300);
    ok(await p.evaluate(()=>!document.body.classList.contains("compact")&&document.querySelector(".mini-l").inert),"back at the top, the full header again");
    await p.context().close();
    const m=await open(b,{hash:"subjects",mobile:true});
    await m.evaluate(()=>{ document.querySelector("body > div.wrap").scrollTop=500; }); await m.waitForTimeout(700);
    const r=await m.evaluate(()=>({on:document.body.classList.contains("compact"),h:document.querySelector("header.top").getBoundingClientRect().height,
      t:getComputedStyle(document.querySelector(".hdr-time")).opacity,txt:document.querySelector(".hdr-time").textContent}));
    ok(r.on&&r.h<90&&+r.t>.9&&r.txt==="13:06",`phone: scrolled down, the header shrinks to one row with the time (${Math.round(r.h)} px)`);
    await m.context().close();
  }

  section("Mobile: swiping between tabs");
  {
    const p=await open(b,{hash:"subjects",mobile:true});
    const cdp=await p.context().newCDPSession(p);
    const swipe=async(x1,x2,end="touchEnd")=>{
      await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:x1,y:450}]});
      for(let k=1;k<=10;k++) await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:x1+(x2-x1)*k/10,y:450}]});
      await cdp.send("Input.dispatchTouchEvent",{type:end,touchPoints:[]});
      await p.waitForTimeout(700);
      return p.evaluate(()=>document.querySelector("a[data-tab].on").dataset.tab);
    };
    ok(await swipe(320,80)==="exams","to the left: next tab");
    ok(await swipe(80,320)==="subjects","to the right: previous tab");
    await swipe(300,180,"touchCancel");
    ok(await p.evaluate(()=>{ const w=document.querySelector("body > div.wrap"); return !w.style.transform&&!w.style.opacity; }),"a cancelled gesture leaves everything in place");
    await p.context().close();
  }

  section("Idle");
  {
    const p=await open(b,{clock:"live"});
    await p.clock.runFor(46000);
    ok(await p.evaluate(()=>document.body.classList.contains("idle")),"after 45 s without touching anything the decorations stop");
    await p.mouse.click(100,400); await p.clock.runFor(100);
    ok(await p.evaluate(()=>!document.body.classList.contains("idle")),"touching brings them back");
    await p.context().close();
  }

  section("Offline");
  {
    /* the offline copy needs the site served over http: a tiny local server */
    const http=require("http"), fs=require("fs");
    const TYPES={".html":"text/html",".js":"text/javascript",".css":"text/css",".png":"image/png",".svg":"image/svg+xml",".ico":"image/x-icon",".webmanifest":"application/manifest+json"};
    const root=path.resolve(__dirname,"..");
    const srv=http.createServer((q,s)=>{
      const f=path.join(root,decodeURIComponent(q.url.split("?")[0]).replace(/\/$/,"/index.html"));
      if(!f.startsWith(root)||!fs.existsSync(f)){ s.writeHead(404); s.end(); return; }
      s.writeHead(200,{"Content-Type":TYPES[path.extname(f)]||"application/octet-stream"}); fs.createReadStream(f).pipe(s);
    });
    await new Promise(r=>srv.listen(0,"127.0.0.1",r));
    const URL0=`http://127.0.0.1:${srv.address().port}/`;
    const ctx=await b.newContext({viewport:{width:1280,height:900}});
    const writes=[];
    await ctx.route(/fonts\.(googleapis|gstatic)\.com|open-meteo|bigdatacloud/,r=>r.abort());
    await ctx.route("https://api.jsonbin.io/**",async r=>{
      if(r.request().method()==="PUT"){ writes.push(JSON.parse(r.request().postData())); return r.fulfill({status:200,body:"{}",contentType:"application/json"}); }
      return r.fulfill({status:200,contentType:"application/json",body:JSON.stringify({record:writes.length?writes[writes.length-1]:{hechas:[]}})});
    });
    await ctx.addInitScript(k=>localStorage.setItem("nolan-device",k),DEVICE);
    await ctx.addInitScript(FAKE_CONFIG);
    const p=await ctx.newPage(); p.errors=[]; p.on("pageerror",e=>p.errors.push(e.message));
    await p.goto(URL0+"#tasks",{waitUntil:"load"});
    await p.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
    await p.waitForTimeout(2500);                        /* the copy is being kept */
    const kept=await p.evaluate(async()=>{ const c=await caches.open("nolan"); return (await c.keys()).length; });
    await ctx.setOffline(true);
    await p.reload({waitUntil:"load"}); await p.waitForTimeout(800);
    const off=await p.evaluate(()=>({ok:typeof Universe!=="undefined"&&typeof Cloud!=="undefined"&&typeof Router!=="undefined",
      version:document.querySelector("footer .version").textContent,tasks:document.querySelectorAll("#generalTasks input").length}));
    ok(kept>20&&off.ok&&/^v\d/.test(off.version)&&off.tasks>0&&!p.errors.length,`without a connection the site still opens, from the copy on the device (${kept} files kept) ${p.errors.join(" | ")}`);
    /* a task ticked offline survives closing the app, and goes up when the connection is back */
    const id=await p.evaluate(()=>document.querySelector("#generalTasks input").id);
    await p.locator("#generalTasks input").nth(0).check(); await p.waitForTimeout(300);
    await p.reload({waitUntil:"load"}); await p.waitForTimeout(800);
    const still=await p.evaluate(i=>document.getElementById(i).checked,id);
    await ctx.setOffline(false); await p.evaluate(()=>window.dispatchEvent(new Event("online")));
    /* (the page reloads itself when the connection comes back: wait for the save, not on the page) */
    for(let k=0;k<40&&!writes.some(w=>(w.hechas||[]).includes(id));k++) await new Promise(r=>setTimeout(r,200));
    ok(still&&writes.some(w=>(w.hechas||[]).includes(id)),`a task ticked offline is still ticked after reopening, and is saved once online (${still}, ${writes.length} writes)`);
    await ctx.close(); srv.close();
  }

  await b.close();
  console.log(failures?`\n${failures} checks failed.`:"\nAll good.");
  process.exit(failures?1:0);
})();
