
// scripts/build-anti.mjs
import fs from 'fs/promises';
function genANTI(draws){
  const nums=new Array(46).fill(0); const pairs=new Map(); const triples=new Map(); const sets=new Set();
  for(const d of draws.slice(-200)){
    d.nums.forEach(n=>nums[n]++);
    for(let i=0;i<6;i++) for(let j=i+1;j<6;j++){ const key=d.nums[i]+'-'+d.nums[j]; pairs.set(key,(pairs.get(key)||0)+1); }
    for(let i=0;i<6;i++) for(let j=i+1;j<6;j++) for(let k=j+1;k<6;k++){ const key=d.nums[i]+'-'+d.nums[j]+'-'+d.nums[k]; triples.set(key,(triples.get(key)||0)+1); }
    sets.add(d.nums.join('-'));
  }
  const hot=[...Array(45)].map((_,i)=>({n:i+1,f:nums[i+1]})).sort((a,b)=>b.f-a.f).slice(0,10).map(x=>x.n);
  const topPairs=[...pairs.entries()].sort((a,b)=>b[1]-a[1]).slice(0,50).map(x=>x[0].split('-').map(Number));
  const topTriples=[...triples.entries()].sort((a,b)=>b[1]-a[1]).slice(0,50).map(x=>x[0].split('-').map(Number));
  return {nums:hot, pairs:topPairs, triples:topTriples, sets:Array.from(sets).map(s=>s.split('-').map(Number))};
}
async function run(){
  const raw=await fs.readFile('data/draws.json','utf-8').catch(()=>null);
  if(!raw){ await fs.writeFile('data/anti.hex.json', JSON.stringify({nums:[],pairs:[],triples:[],sets:[]},null,2)); return; }
  const draws=JSON.parse(raw); const anti=genANTI(draws); await fs.writeFile('data/anti.hex.json', JSON.stringify(anti,null,2)); console.log('ANTI generated');
}
run();

