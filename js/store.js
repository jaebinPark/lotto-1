
export const LS = { SAVED_GROUPS:'lotto.saved.groups.v2', EXCLUDES:'lotto.exclude.v2', ANTI:'lotto.anti.hex.v1' };
export const state = { drawList:[], draw50:[], latest:null, excludes:new Set(), anti:{nums:[],pairs:[],triples:[],sets:[]} };
export function loadJSON(url){ return fetch(url).then(r=>r.ok?r.json():null).catch(_=>null); }
function saveLS(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
function readLS(k, d){ try{ return JSON.parse(localStorage.getItem(k)||''); }catch(e){ return d; } }
export function initLocal(){ const ex=readLS(LS.EXCLUDES,[]); state.excludes=new Set(ex); const a=readLS(LS.ANTI,null); if(a) state.anti=a; }
export function setExcludes(a){ state.excludes=new Set(a); saveLS(LS.EXCLUDES, Array.from(state.excludes)); }
export function getSavedGroups(){ return readLS(LS.SAVED_GROUPS, []); }
export function pushSavedGroup(g){ const all=getSavedGroups(); all.unshift(g);
  const keep=[]; const seen=new Set(); for(const x of all){ const key=x.drawNo||x.label||'NA'; if(!seen.has(key)){ keep.push(x); seen.add(key); if(seen.size>=5) break; } }
  saveLS(LS.SAVED_GROUPS, keep);
}
export function deleteSavedGroup(id){ const all=getSavedGroups().filter(g=>g.id!==id); saveLS(LS.SAVED_GROUPS, all); }
export async function bootstrapData(){
  let d50=await loadJSON('./data/draws50.json?v={{BUILD}}'); let all=await loadJSON('./data/draws.json?v={{BUILD}}'); if(!Array.isArray(all)) all=[];
  if(!Array.isArray(d50)||d50.length===0) d50=all.slice(-50);
  state.drawList=all; state.draw50=d50; state.latest=d50[d50.length-1]||all[all.length-1]||null;
  const anti=await loadJSON('./data/anti.hex.json?v={{BUILD}}'); if(anti){ state.anti=anti; saveLS(LS.ANTI, anti); }
  return {all,d50};
}
export function rankForSet(draw,set){ if(!draw) return {rank:null,hit:0,bonus:false};
  const s=new Set(draw.nums); let hit=set.filter(n=>s.has(n)).length; const bonusHit=set.includes(draw.bonus); let rank=null;
  if(hit===6) rank=1; else if(hit===5&&bonusHit) rank=2; else if(hit===5) rank=3; else if(hit===4) rank=4; else if(hit===3) rank=5;
  return {rank,hit,bonus:bonusHit};
}
export function formatMoney(n){ if(n==null) return '-'; return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,','); }
