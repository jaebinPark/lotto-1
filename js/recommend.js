
import { state } from './store.js';
function zscore(a){const n=a.length;if(!n) return {mean:0,std:1};const m=a.reduce((x,y)=>x+y,0)/n;const s=Math.sqrt(a.reduce((x,y)=>x+(y-m)*(y-m),0)/n)||1;return {mean:m,std:s};}
export function analyze50(){
  const d=state.draw50, freq=Array(46).fill(0), seenAt=Array(46).fill(null);
  d.forEach((dr,i)=>{ dr.nums.forEach(n=>{freq[n]++; seenAt[n]=i;}); });
  const {mean,std}=zscore(freq.slice(1)); const hot=[], cold=[], neutral=[]; const last=d[d.length-1]||null; const g1= last? new Set(last.nums): new Set();
  for(let n=1;n<=45;n++){ if(g1.has(n)) continue; const z=(freq[n]-mean)/std; const overdue= seenAt[n]==null? 999 : (d.length-1-seenAt[n]);
    if(z>=1.0) hot.push(n); else if(overdue>=Math.floor(d.length*0.75) && freq[n]<=mean) cold.push(n); else neutral.push(n); }
  return {g1:Array.from(g1), hot, cold, neutral, freq, seenAt};
}
function pickWeighted(pool,W){const sum=pool.reduce((a,n)=>a+(W[n]||1),0);let r=Math.random()*sum;for(const n of pool){r-= (W[n]||1); if(r<=0) return n;} return pool[0];}
function scoreWeights(meta){ const {freq,seenAt}=meta; const weights={}; for(let n=1;n<=45;n++){ const f=freq[n]; const over= seenAt[n]==null? 45 : (meta.freq.length-1-seenAt[n]); const w=1 + 0.8*(f/10) + 0.6*(over/10); weights[n]=w; } return weights;}
function sum(a){return a.reduce((x,y)=>x+y,0)}
function okFilters(a){ const s=sum(a); if(s<80||s>170) return false; const odds=a.filter(n=>n%2===1).length; if(odds<2||odds>4) return false;
  let run=1,maxrun=1; for(let i=1;i<a.length;i++){ if(a[i]===a[i-1]+1){run++;maxrun=Math.max(maxrun,run);} else run=1; } if(maxrun>2) return false; return true;}
function tooClose(a,b){ const s=new Set(a); let c=0; for(const x of b){ if(s.has(x)) c++; } return c>3; }
export function recommend30(excludes=[]){
  const meta=analyze50(); const W=scoreWeights(meta); const G1=new Set(meta.g1);
  let gp={g1:0.40, hot:0.30, cold:0.15, neutral:0.15};
  const pool={ g1:meta.g1.filter(n=>!excludes.includes(n)), hot:meta.hot.filter(n=>!excludes.includes(n)), cold:meta.cold.filter(n=>!excludes.includes(n)), neutral:meta.neutral.filter(n=>!excludes.includes(n))};
  const sets=[]; const anti=state.anti||{nums:[],pairs:[],triples:[],sets:[]}; const antiSet=new Set((anti.sets||[]).map(s=>s.join('-')));
  function pickGroup(){ const r=Math.random(); if(r<gp.g1) return 'g1'; if(r<gp.g1+gp.hot) return 'hot'; if(r<gp.g1+gp.hot+gp.cold) return 'cold'; return 'neutral'; }
  while(sets.length<30){
    let cur=[], g1count=0, loop=0;
    while(cur.length<6 && loop<200){ loop++; let g=pickGroup(); if(g==='g1'&&g1count>=2) g='hot'; const cand=pool[g]; if(!cand||cand.length===0) continue;
      const n=pickWeighted(cand,W); if(cur.includes(n)) continue; if(G1.has(n)) g1count++; cur.push(n); cur.sort((a,b)=>a-b); }
    if(cur.length<6) continue; if(antiSet.has(cur.join('-'))) continue; if(!okFilters(cur)) continue; if(sets.some(s=>tooClose(s,cur))) continue; sets.push(cur);
  }
  const avgW=sets.map(s=> s.reduce((a,b)=>a+(W[b]||1),0)/6 ); const mx=Math.max(...avgW), mn=Math.min(...avgW);
  const scores=avgW.map(v=> (v-mn)/(mx-mn+1e-6)*0.04+0.01); return sets.map((s,i)=>({nums:s, score:Number((scores[i]*100).toFixed(2))}));
}
