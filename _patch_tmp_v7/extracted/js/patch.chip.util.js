/* chip util — class mapping only (keeps existing CSS sizes) */
(function(){
  if (window.__CHIP_UTIL__) return;
  function classFor(n){
    n = +n;
    if (n>=1 && n<=9)  return 'yellow';
    if (n>=10 && n<=19) return 'blue';
    if (n>=20 && n<=29) return 'red';
    if (n>=30 && n<=39) return 'gray';
    if (n>=40 && n<=45) return 'green';
    return '';
  }
  function applyColor(el, n, colored){
    if (!el) return;
    el.classList.remove('yellow','blue','red','gray','green');
    if (colored){
      const c = classFor(n);
      if (c) el.classList.add(c);
    }
  }
  window.__CHIP_UTIL__ = { classFor, applyColor };
})();