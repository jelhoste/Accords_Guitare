// Mise en cache de l'appli pour un usage hors ligne (modèle : build.mjs remplace les deux constantes VERSION et ASSETS ci-dessous).
// Stratégie : copie en cache servie tout de suite, mise à jour en arrière-plan. Les gros fichiers (sons, vendor) ont leur propre cache.
const VERSION='fe793c4ef2';
const CACHE='accords-'+VERSION;
const SOUNDS='accords-sons-1';   // à changer SEULEMENT quand un fichier de vendor/ ou de sons/ est remplacé
const ASSETS=["./","./index.html","./app.js","./engine.js","./app.css","./theme.css","./manifest.webmanifest","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./apple-touch-icon.png"];
const HEAVY=['./vendor/spessa-lib.js','./vendor/spessasynth_processor.min.js','./sons/note-all.sf3'];
const heavyUrls=HEAVY.map(u=>new URL(u,self.location).href);
self.addEventListener('install',e=>{
  e.waitUntil(Promise.all([
    caches.open(CACHE).then(c=>c.addAll(ASSETS)),
    caches.open(SOUNDS).then(c=>Promise.all(HEAVY.map(u=>c.match(u).then(hit=>hit||c.add(u)).catch(()=>{}))))
  ]).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!==SOUNDS).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin) return;
  if(heavyUrls.includes(r.url)){
    e.respondWith(caches.open(SOUNDS).then(c=>c.match(r).then(hit=>hit||fetch(r).then(res=>{ if(res.ok) c.put(r,res.clone()); return res; }))));
    return;
  }
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>{
    const net=fetch(r).then(res=>{
      if(res.ok){const cp=res.clone(); caches.open(CACHE).then(c=>c.put(r,cp));}
      return res;
    }).catch(()=>null);
    return hit||net.then(res=>res||(r.mode==='navigate'?caches.match('./index.html'):Response.error()));
  }));
});
