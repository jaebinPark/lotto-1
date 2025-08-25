/* Anti Engine v3 — "anti-5th" risk guard (sets/pairs/triples + Monte Carlo) */
(function(){
  if (window.__ANTI_V3__) return; window.__ANTI_V3__=true;

  const CFG = {
    setsWindow: 800,          // 과거 세트 금지 범위(최근 N회)
    pairWindow: 400,          // 페어 빈도 집계 윈도
    tripleWindow: 600,        // 트리플 빈도 집계 윈도
    banPairTopN: 100,         // 상위 N개 페어 금지
    banPairMinFreq: 5,        // 또는 freq >= X
    banTripleTopN: 35,        // 상위 N개 트리플 금지
    banTripleMinFreq: 2,      // 또는 freq >= X
    sampleCount: 2500,        // 몬테카를로 샘플 수
    pairBoost: 0.15,          // 샘플링 시 페어 동시출현 가중치
    maxRisk3p: 0.001,         // 3개 이상 일치 위험률 허용 상한 (0.1%)
    hotTop: 12,               // 상위 핫넘버 집합 크기
    maxFromHot: 2,            // 핫넘버 집합에서 최대 허용 포함 수
    strictNo3OverlapHistory: true // 과거 전 회차와 3개 이상 일치 금지
  };

  // --- helpers ---
  function key2(a,b){ return a<b ? a+'-'+b : b+'-'+a; }
  function key3(a,b,c){ const s=[a,b,c].sort((x,y)=>x-y); return s.join('-'); }
  function maskOf(arr){ let m=0n; for(const n of arr){ if (n>=1 && n<=45) m |= (1n << BigInt(n-1)); } return m; }
  function popcount(m){ let c=0; while(m){ c += Number(m & 1n); m >>= 1n; } return c; }

  let ready=false, all=[], freq={}, pairFreq={}, tripleFreq={};
  let setBan=null, pairBan=null, tripleBan=null, hotSet=null;
  let samplesMasks=[];

  async function loadDraws(){
    let j=null;
    try{
      const r = await fetch('./data/draws.json?v='+(Date.now()%99999), {cache:'no-store'});
      j = await r.json();
    }catch(_){}
    if (!Array.isArray(j)||!j.length) return;
    all = j;
  }

  function buildStats(){
    freq={}; pairFreq={}; tripleFreq={};
    const lastPair = all.slice(-CFG.pairWindow);
    const lastTriple = all.slice(-CFG.tripleWindow);
    for (const d of all){ const ns = (d.nums||[d.drwtNo1,d.drwtNo2,d.drwtNo3,d.drwtNo4,d.drwtNo5,d.drwtNo6]).map(Number).sort((a,b)=>a-b);
      for (const n of ns) freq[n]=(freq[n]||0)+1;
    }
    for (const d of lastPair){ const ns = (d.nums||[d.drwtNo1,d.drwtNo2,d.drwtNo3,d.drwtNo4,d.drwtNo5,d.drwtNo6]).map(Number).sort((a,b)=>a-b);
      for (let i=0;i<6;i++) for (let j=i+1;j<6;j++){ const k=key2(ns[i],ns[j]); pairFreq[k]=(pairFreq[k]||0)+1; }
    }
    for (const d of lastTriple){ const ns = (d.nums||[d.drwtNo1,d.drwtNo2,d.drwtNo3,d.drwtNo4,d.drwtNo5,d.drwtNo6]).map(Number).sort((a,b)=>a-b);
      for (let i=0;i<6;i++) for (let j=i+1;j<6;j++) for (let k=j+1;k<6;k++){ const kk=key3(ns[i],ns[j],ns[k]); tripleFreq[kk]=(tripleFreq[kk]||0)+1; }
    }
  }

  function buildBans(){
    const lastSets = all.slice(-CFG.setsWindow);
    setBan = new Set(lastSets.map(d=>{
      const ns = (d.nums||[d.drwtNo1,d.drwtNo2,d.drwtNo3,d.drwtNo4,d.drwtNo5,d.drwtNo6]).map(Number).sort((a,b)=>a-b);
      return ns.join('-');
    }));
    pairBan = new Set(Object.entries(pairFreq).sort((a,b)=>b[1]-a[1]).slice(0, CFG.banPairTopN).filter(([,v])=>v>=CFG.banPairMinFreq).map(([k])=>k));
    tripleBan = new Set(Object.entries(tripleFreq).sort((a,b)=>b[1]-a[1]).slice(0, CFG.banTripleTopN).filter(([,v])=>v>=CFG.banTripleMinFreq).map(([k])=>k));

    hotSet = new Set(Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0, CFG.hotTop).map(([n])=>+n));
  }

  function sampleDraws(){
    // Precompute weights
    const weights = []; let sum=0;
    for (let n=1;n<=45;n++){ const w = (freq[n]||1); weights[n]=w; sum+=w; }
    // normalize
    for (let n=1;n<=45;n++){ weights[n] /= sum; }
    function pickOne(exclude){
      // compute effective weight with pair boost
      let bestN=1, bestScore=-1;
      for (let n=1;n<=45;n++){
        if (exclude.has(n)) continue;
        let s = weights[n];
        if (exclude.size){
          let boost=0;
          exclude.forEach(m=>{ const k=key2(n,m); const pf=(pairFreq[k]||0); boost += pf; });
          if (boost>0) s *= (1 + CFG.pairBoost * (boost / Math.max(1, exclude.size)));
        }
        if (s>bestScore){ bestScore=s; bestN=n; }
      }
      return bestN;
    }
    samplesMasks = [];
    for (let t=0;t<CFG.sampleCount;t++){
      const chosen = new Set();
      while (chosen.size<6){
        const n = pickOne(chosen);
        chosen.add(n);
      }
      const arr = Array.from(chosen).sort((a,b)=>a-b);
      samplesMasks.push(maskOf(arr));
    }
  }

  function risk3plus(arr){
    const m = maskOf(arr);
    let hit=0;
    for (let i=0;i<samplesMasks.length;i++){
      if (popcount(m & samplesMasks[i]) >= 3) hit++;
    }
    return hit / Math.max(1, samplesMasks.length);
  }

  function rejectSet(arr){
    const s = arr.slice().sort((a,b)=>a-b);
    // 1) deterministic bans
    if (CFG.strictNo3OverlapHistory){
      for (const d of all){
        const ns = (d.nums||[d.drwtNo1,d.drwtNo2,d.drwtNo3,d.drwtNo4,d.drwtNo5,d.drwtNo6]).map(Number).sort((a,b)=>a-b);
        let inter=0, i=0, j=0;
        while(i<6 && j<6){
          if (s[i]===ns[j]){ inter++; if (inter>=3) return true; i++; j++; }
          else if (s[i]<ns[j]) i++; else j++;
        }
      }
    }
    if (setBan.has(s.join('-'))) return true;
    for (let i=0;i<6;i++) for (let j=i+1;j<6;j++){ if (pairBan.has(key2(s[i],s[j]))) return true; }
    for (let i=0;i<6;i++) for (let j=i+1;j<6;j++) for (let k=j+1;k<6;k++){ if (tripleBan.has(key3(s[i],s[j],s[k]))) return true; }
    // 2) hot numbers cap
    let hotCnt=0; for (const n of s){ if (hotSet.has(n)) hotCnt++; } if (hotCnt>CFG.maxFromHot) return true;
    // 3) empirical risk via Monte Carlo
    const r = risk3plus(s);
    if (r > CFG.maxRisk3p) return true;
    return false;
  }

  async function init(){
    await loadDraws();
    if (!all.length) return;
    buildStats(); buildBans(); sampleDraws();
    ready=true;
  }

  // Hook okFilters
  const _ok = window.okFilters;
  if (typeof _ok === 'function'){
    window.okFilters = function(arr){
      const base = _ok.apply(this, arguments);
      if (!base) return false;
      if (!ready) return true; // if not ready, don't block
      return !rejectSet(arr);
    };
  }
  // Fallback prune after render
  const mo = new MutationObserver(()=>{
    if (!ready) return;
    document.querySelectorAll('.recommend .game, .recommend .set, .recommend .row, [data-game]').forEach(box=>{
      const nums = Array.from(box.querySelectorAll('.chip')).map(el=>+el.textContent.trim()).filter(n=>n>0);
      if (nums.length===6 && rejectSet(nums)) box.remove();
    });
  });
  mo.observe(document.documentElement, {childList:true, subtree:true});

  init();
  window.__ANTI_V3__ = { cfg: CFG, risk3plus, rejectSet };
})();