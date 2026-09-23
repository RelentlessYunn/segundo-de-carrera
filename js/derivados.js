/* ==========================================================
   derivados.js — datos que se calculan solos a partir de data.js.
   · CHOQUES: clases que coinciden de verdad en una fecha concreta.
     Se añaden a CAL como tipo "cf" (salvo que ya haya uno escrito a mano
     ese día para esa asignatura, que suele traer el aula exacta).
   · Colocación en la rejilla: qué clases comparten franja y van a media anchura.
   Así, al añadir una clase a CLASSES no hay que marcar nada a mano.
   ========================================================== */
const CHOQUES=[];
(function(){
  const solapan=(x,y)=>x.a<y.b&&y.a<x.b;
  const nombreClase=c=>(c.t.charAt(0).toUpperCase()+c.t.slice(1))+" de "+SUBJ[c.id].n;

  /* 1 · choques en fechas concretas: se recorre cada día de clase de cada cuatrimestre */
  CUATRIS.forEach(cu=>{
    for(let k=cu.ini; k<=cu.fin; k=sumaDias(k,1)){
      const cs=clasesDe(k);
      for(let i=0;i<cs.length;i++) for(let j=i+1;j<cs.length;j++)
        if(cs[i].id!==cs[j].id&&solapan(cs[i],cs[j])) CHOQUES.push({date:k,x:cs[i],y:cs[j]});
    }
  });
  /* se apunta en la asignatura "excepcional" (la de fechas sueltas), que es la que se mueve */
  CHOQUES.forEach(ch=>{
    const [p,q]=ch.y.dates&&!ch.x.dates?[ch.y,ch.x]:[ch.x,ch.y];
    const aMano=CAL.some(e=>e.type==="cf"&&e.date===ch.date&&(e.id===p.id||e.id===q.id));
    if(aMano) return;
    CAL.push({id:p.id, date:ch.date, type:"cf", w:"conflicto", generado:true,
      hora:`${hhmm(Math.max(p.a,q.a))}–${hhmm(Math.min(p.b,q.b))}`,
      what:`${nombreClase(p)} (${p.au}) choca con ${nombreClase(q).charAt(0).toLowerCase()+nombreClase(q).slice(1)}`});
  });

  /* 2 · colocación en la rejilla: columnas dentro de cada franja que se solapa */
  for(let d=0; d<5; d++){
    const dia=CLASSES.filter(c=>c.d===d).sort((x,y)=>x.a-y.a||x.b-y.b);
    let grupo=[], finGrupo=-1;
    const cerrar=()=>{
      const cols=[];                               /* fin de la última clase de cada columna */
      grupo.forEach(c=>{
        let i=cols.findIndex(fin=>fin<=c.a);
        if(i<0){ i=cols.length; cols.push(0); }
        cols[i]=c.b; c.col=i;
      });
      grupo.forEach(c=>c.ncol=cols.length);
    };
    dia.forEach(c=>{
      if(c.a>=finGrupo&&grupo.length){ cerrar(); grupo=[]; }
      grupo.push(c); finGrupo=Math.max(finGrupo,c.b);
    });
    if(grupo.length) cerrar();
  }
  /* una clase "choca" en la rejilla si alguna de sus fechas coincide con otra */
  CHOQUES.forEach(ch=>{ ch.x.choca=true; ch.y.choca=true; });
})();
