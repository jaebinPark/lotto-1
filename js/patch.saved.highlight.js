/* saved highlight — color only matches to latest results */
(function(){
  if (window.__SAVED_HILITE__) return; window.__SAVED_HILITE__=true;
  const U = window.__CHIP_UTIL__;
  async function fetchLatestNums(){
    try{
      const r = await fetch('./data/draws50.json?v='+(Date.now()%99999), {cache:'no-store'});
      const j = await r.json(); const last = j[j.length-1];
      if (last && (Array.isArray(last.nums) && last.nums.length)) return last.nums.slice();
      if (last && last.drwtNo1) return [last.drwtNo1,last.drwtNo2,last.drwtNo3,last.drwtNo4,last.drwtNo5,last.drwtNo6];
    }catch(_){}
    return [];
  }
  function paint(latestSet){
    const groups = document.querySelectorAll('.group'); if(!groups.length) return;
    groups.forEach(g=>{
      g.querySelectorAll('.five .set-line, .set-line').forEach(line=>{
        line.querySelectorAll('.chip').forEach(ch=>{
          const n = parseInt(ch.textContent,10);
          if (!isFinite(n)) return;
          const hit = latestSet.has(n);
          U.applyColor(ch, n, hit);
        });
      });
    });
  }
  async function run(){
    const nums = await fetchLatestNums(); if (!nums.length) return;
    const latestSet = new Set(nums.map(n=>+n));
    paint(latestSet);
  }
  function routeHook(){ run(); }
  window.addEventListener('DOMContentLoaded', ()=> setTimeout(run, 50));
  window.addEventListener('hashchange', routeHook);
  window.addEventListener('popstate', routeHook);
  const g = window.goto;
  if (typeof g === 'function' && !g.__patched){
    window.goto = function(p){ const r=g.apply(this, arguments); setTimeout(run, 60); return r; }
    window.goto.__patched = true;
  }
})();