(function(){
  if (window.__RANGE_BADGE__) return; window.__RANGE_BADGE__=true;
  async function run(){
    try{
      const r=await fetch('./data/draws50.json?v='+(Date.now()%99999), {cache:'no-store'});
      const j=await r.json(); if(!Array.isArray(j)||!j.length) return;
      const min=j[0].drwNo||j[0].round||1, max=j[j.length-1].drwNo||j[j.length-1].round||min;
      if (document.getElementById('res-range-badge')) return;
      const host=document.querySelector('.container')||document.body;
      const b=document.createElement('div'); b.id='res-range-badge';
      b.textContent = `업데이트: ${max}회 ~ ${min}회`;
      b.style.cssText='margin:10px 0 8px;color:#7a6a9a;font-weight:700;font-size:12px;';
      host.prepend(b);
    }catch(_){}
  }
  window.addEventListener('DOMContentLoaded', run);
})();