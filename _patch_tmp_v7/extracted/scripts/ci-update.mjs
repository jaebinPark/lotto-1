// v7 updater: full backfill once + weekly updates + anti build
import fs from 'node:fs/promises';
import path from 'node:path';
const DATA = path.join(process.cwd(), 'data');
const OUT_FULL = path.join(DATA, 'draws.json');
const OUT_50   = path.join(DATA, 'draws50.json');
const OUT_ANTI = path.join(DATA, 'anti.hex.json');

async function fetchDraw(no){
  const url = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${no}`;
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) return null;
  const j = await r.json().catch(()=>null);
  if (!j || j.returnValue !== 'success') return null;
  return { drwNo: j.drwNo, drwNoDate: j.drwNoDate,
    nums: [j.drwtNo1, j.drwtNo2, j.drwtNo3, j.drwtNo4, j.drwtNo5, j.drwtNo6],
    bonus: j.bnusNo,
    first: { amount: j.firstWinamnt, people: j.firstPrzwnerCo } };
}

async function detectLatest(start=1200){
  let n=start, lastOk=0, miss=0;
  while(miss<3 && n<start+800){
    const d = await fetchDraw(n);
    if(d){ lastOk=n; miss=0; } else { miss++; }
    n++;
  }
  return lastOk;
}

function uniqSort(list){
  const m = new Map();
  for(const d of list){ if(d&&d.drwNo) m.set(d.drwNo, d); }
  return Array.from(m.values()).sort((a,b)=>a.drwNo-b.drwNo);
}

async function readJson(p){ try{ return JSON.parse(await fs.readFile(p,'utf8')); }catch(_){ return null; } }
async function write(all){
  await fs.mkdir(DATA,{recursive:true});
  await fs.writeFile(OUT_FULL, JSON.stringify(all, null, 0), 'utf8');
  await fs.writeFile(OUT_50,   JSON.stringify(all.slice(-50), null, 0), 'utf8');
}

function key2(a,b){ return a<b ? a+'-'+b : b+'-'+a; }
function key3(a,b,c){ const s=[a,b,c].sort((x,y)=>x-y); return s.join('-'); }

function buildAnti(all){
  const setsWindow=800, pairWindow=400, tripleWindow=600;
  const pairs={}, triples={};
  const sets = all.slice(-setsWindow).map(d=> d.nums.slice().sort((a,b)=>a-b));
  const lastP = all.slice(-pairWindow);
  const lastT = all.slice(-tripleWindow);
  for(const d of lastP){
    const ns = d.nums.slice().sort((a,b)=>a-b);
    for(let i=0;i<6;i++) for(let j=i+1;j<6;j++){
      const k=key2(ns[i],ns[j]); pairs[k]=(pairs[k]||0)+1;
    }
  }
  for(const d of lastT){
    const ns = d.nums.slice().sort((a,b)=>a-b);
    for(let i=0;i<6;i++) for(let j=i+1;j<6;j++) for(let k=j+1;k<6;k++){
      const kk=key3(ns[i],ns[j],ns[k]); triples[kk]=(triples[kk]||0)+1;
    }
  }
  function topN(obj, n){
    return Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k,v])=>({k,v}));
  }
  return {
    updatedAt: new Date().toISOString(),
    range: { count: all.length, from: all[0]?.drwNo, to: all[all.length-1]?.drwNo },
    sets,
    pairTop: topN(pairs, 100),
    tripleTop: topN(triples, 35),
    pairFreq: pairs,
    tripleFreq: triples
  };
}

async function run(){
  const existing = await readJson(OUT_FULL) || [];
  let all = Array.isArray(existing) ? existing : [];
  const haveMin = all.length ? all[0].drwNo : Infinity;
  const haveMax = all.length ? all[all.length-1].drwNo : 0;

  const latest = await detectLatest(Math.max(1200, haveMax||1200));
  if(!latest){ console.log('No latest'); return; }

  for(let r=haveMin-1; r>=1; r--){
    const d=await fetchDraw(r); if(d) all.unshift(d); else break;
  }
  for(let r=haveMax+1; r<=latest; r++){
    const d=await fetchDraw(r); if(d) all.push(d);
  }

  all = uniqSort(all);
  await write(all);

  const anti = buildAnti(all);
  await fs.writeFile(OUT_ANTI, JSON.stringify(anti, null, 0), 'utf8');

  console.log(`✅ updated draws ${all[0]?.drwNo}~${all[all.length-1]?.drwNo} (${all.length}) + anti.hex.json (v3)`);
}
await run();
