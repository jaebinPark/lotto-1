
const CACHE_VERSION='{{BUILD}}';
const CORE=[
  './index.html?v='+CACHE_VERSION,
  './styles.css?v='+CACHE_VERSION,
  './js/main.js?v='+CACHE_VERSION,
  './js/recommend.js?v='+CACHE_VERSION,
  './js/store.js?v='+CACHE_VERSION,
  './data/draws50.json?v='+CACHE_VERSION,
  './data/draws.json?v='+CACHE_VERSION
];
self.addEventListener('install', e=>{
  self.skipWaiting();
  e.waitUntil(caches.open('core-'+CACHE_VERSION).then(c=>c.addAll(CORE).catch(()=>{})));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>!k.includes(CACHE_VERSION)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  const url=new URL(e.request.url);
  if(url.origin===location.origin){
    e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request).then(res=>{const copy=res.clone();caches.open('core-'+CACHE_VERSION).then(c=>c.put(e.request,copy)).catch(()=>{});return res;}).catch(()=>caches.match('./index.html'))));
  }else e.respondWith(fetch(e.request));
});
