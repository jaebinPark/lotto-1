/* exclude enhancer — keypad/selected chips color by value; keep existing persistence */
(function(){
  if (window.__EXCLUDE_ENH__) return; window.__EXCLUDE_ENH__=true;
  const U = window.__CHIP_UTIL__;
  const LSKEY = 'lotto.exclude.v2';
  function readLS(){ try{ return new Set(JSON.parse(localStorage.getItem(LSKEY)||'[]')); }catch(_){ return new Set(); } }
  function colorizeSelChips(box){
    if (!box) return;
    box.querySelectorAll('.chip').forEach(ch=>{
      const n = parseInt(ch.textContent,10);
      if (!isFinite(n)) return;
      U.applyColor(ch, n, true);
    });
  }
  function colorizeKeypad(box){
    if (!box) return;
    const sel = readLS();
    box.querySelectorAll('[data-n]').forEach(btn=>{
      const n = parseInt(btn.dataset.n,10);
      if (!isFinite(n)) return;
      const on = sel.has(n) || btn.getAttribute('aria-pressed')==='true' || btn.dataset.on==='1';
      U.applyColor(btn, n, on);
    });
  }
  const observer = new MutationObserver(()=>{
    const selBox = document.querySelector('#sel-chips');
    const keypad = document.querySelector('#keypad');
    if (selBox) colorizeSelChips(selBox);
    if (keypad) colorizeKeypad(keypad);
  });
  window.addEventListener('DOMContentLoaded', ()=>{
    observer.observe(document.body, {childList:true, subtree:true});
    document.addEventListener('click', (e)=>{
      const tgt = e.target.closest && e.target.closest('#keypad [data-n]');
      if (!tgt) return;
      setTimeout(()=>{
        const keypad = document.querySelector('#keypad');
        const selBox = document.querySelector('#sel-chips');
        colorizeKeypad(keypad); colorizeSelChips(selBox);
      }, 0);
    }, true);
  });
})();