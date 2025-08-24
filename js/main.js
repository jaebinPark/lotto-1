
import {bootstrapData, state, initLocal, setExcludes, getSavedGroups, pushSavedGroup, deleteSavedGroup, rankForSet, formatMoney} from './store.js';
import {recommend30} from './recommend.js';
const el = s=>document.querySelector(s);
function chip(n){let c=''; if(n<=10)c='yellow'; else if(n<=20)c='blue'; else if(n<=30)c='red'; else if(n<=40)c='gray'; else c='green'; return `<span class="chip ${c}">${n}</span>`;}
function topbar(t){return `<div class="topbar"><button class="icon-btn" onclick="goto('home')">🏠</button><div class="title">${t}</div><button class="icon-btn" onclick="history.back()">←</button></div>`;}
function latestKpi(){const d=state.latest; if(!d) return `<div class="notice">불러오는 중…</div>`; const nums=d.nums.map(chip).join('');
  return `<div class="card"><div class="row space"><div class="badge">최신 회차 ${d.drawNo} (${d.date})</div><div class="badge">1등 ${formatMoney(d.first.amount)}원 / ${d.first.people}명</div></div>
  <div class="chips" style="margin-top:6px">${nums}<span class="chip">+</span>${chip(d.bonus)}</div></div>`;}
function home(){const notice=latestKpi(); const btns=`<div class="grid-1">
  <button onclick="goto('winning')">당첨번호</button>
  <button onclick="goto('saved')">저장번호 / 당첨확인</button>
  <button onclick="goto('recommend')">추천</button>
  <button onclick="goto('analyze')">분석</button></div>`;
  el('#app').innerHTML=`<div class="container">${topbar('홈')}${notice}${btns}</div>`;}
function winning(){const list=(state.drawList.length? state.drawList.slice(-50): state.draw50).slice().reverse();
  const items=list.map(d=>{const nums=d.nums.map(chip).join(''); return `<div class="card">
    <div class="row space"><div class="badge">제 ${d.drawNo}회 (${d.date})</div><div class="badge">1등 ${formatMoney(d.first.amount)}원 / ${d.first.people}명</div></div>
    <div class="chips" style="margin-top:8px">${nums}<span class="chip">+</span>${chip(d.bonus)}</div>
    <div class="kpi"><div class="card"><div class="h">2등</div><div class="v">${formatMoney(d.second.amount)} / ${d.second.people}명</div></div>
    <div class="card"><div class="h">3등</div><div class="v">${formatMoney(d.third.amount)} / ${d.third.people}명</div></div>
    <div class="card"><div class="h">총판매</div><div class="v">${formatMoney(d.total||0)}</div></div></div></div>`;}).join('');
  el('#app').innerHTML=`<div class="container">${topbar('당첨번호')}${items}</div>`;}
function saved(){const groups=getSavedGroups(); const latest=state.latest;
  let html=groups.map(g=>{const head=`<div class="row space"><h4>회차 ${g.drawNo||'-'} · 저장 ${new Date(g.ts).toLocaleString()}</h4><button class="badge" onclick="delGroup('${g.id}')">리셋(30셋트 삭제)</button></div>`;
    const blocks=[]; for(let i=0;i<6;i++){ const five=g.sets.slice(i*5,(i+1)*5).map(s=>{ const rk=rankForSet(latest && latest.drawNo===(g.drawNo)? latest:null, s);
      const right=rk.rank? `<span class="rank">당첨 ${rk.rank}등</span>`:`<span class="note">-</span>`; return `<div class="set-line"><div class="nums">${s.map(chip).join('')}</div>${right}</div>`;}).join(''); blocks.push(`<div class="five">${five}</div>`);} 
    return `<div class="group">${head}${blocks.join('')}<div class="foot note">총 ${g.sets.length} 게임</div></div>`;}).join('');
  if(!html) html=`<div class="notice">저장된 번호가 없습니다.</div>`; el('#app').innerHTML=`<div class="container">${topbar('저장번호')}${html}</div>`; window.delGroup=(id)=>{deleteSavedGroup(id); saved();};}
let excludeSelections=new Set();
function excludeModal(){ excludeSelections=new Set(state.excludes);
  const chips=()=> Array.from(excludeSelections).sort((a,b)=>a-b).map(n=>`<span class="chip">${n}</span>`).join('');
  const grid=()=>{let h=''; for(let n=1;n<=45;n++){ const on=excludeSelections.has(n)? 'style="border-color:#7c4dff;background:#efe8ff;font-weight:900"':''; h+=`<button class="chip" data-n="${n}" ${on}>${n}</button>`;} return h;};
  const modal=document.createElement('div'); modal.className='modal-backdrop'; modal.style.display='flex';
  modal.innerHTML=`<div class="modal"><h3>제외수 선택</h3><div class="chips-area" id="sel-chips">${chips()}</div><div class="keypad" id="keypad">${grid()}</div><div class="actions"><button id="reset">리셋</button><button id="ok">확인</button></div></div>`;
  document.body.appendChild(modal); modal.addEventListener('click',(e)=>{if(e.target===modal) modal.remove();});
  modal.querySelector('#keypad').addEventListener('click',(e)=>{ if(!(e.target instanceof HTMLElement)) return; const n=+e.target.dataset.n; if(!n) return;
    if(excludeSelections.has(n)) excludeSelections.delete(n); else excludeSelections.add(n); modal.querySelector('#sel-chips').innerHTML=chips();
    const btn=e.target; if(excludeSelections.has(n)) btn.style.cssText="border-color:#7c4dff;background:#efe8ff;font-weight:900"; else btn.style.cssText=""; });
  modal.querySelector('#reset').onclick=()=>{ excludeSelections.clear(); modal.querySelector('#sel-chips').innerHTML=''; modal.querySelectorAll('#keypad .chip').forEach(b=>b.style.cssText=""); };
  modal.querySelector('#ok').onclick=()=>{ setExcludes(Array.from(excludeSelections)); modal.remove(); recommend(); };
}
function recommend(){ const header=`<div class="row space"><button onclick="excludeModal()">제외수</button><button onclick="doRecommend()">추천</button></div>`;
  const selectedTop=`<div class="chips" id="ex-top">${Array.from(state.excludes).sort((a,b)=>a-b).map(n=>`<span class="chip">${n}</span>`).join('')}</div>`;
  el('#app').innerHTML=`<div class="container">${topbar('추천')}<div class="card">${header}${selectedTop}</div><div id="rec-area"></div></div>`;}
function showLoading(){ const m=document.createElement('div'); m.className='modal-backdrop'; m.style.display='flex';
  m.innerHTML=`<div class="modal center"><div class="spinner"></div><div class="note">AI가 추천을 계산중…</div></div>`; document.body.appendChild(m); return ()=>m.remove();}
function doRecommend(){ const close=showLoading(); setTimeout(()=>{ const sets=recommend30(Array.from(state.excludes)); close();
  const group={ id:'G'+Date.now(), ts:Date.now(), drawNo:(state.latest? state.latest.drawNo+1:null), sets: sets.map(s=>s.nums)}; pushSavedGroup(group);
  const html=sets.map(s=> `<div class="set-line"><div class="nums">${s.nums.map(chip).join('')}</div><span class="badge">당첨확률 ${s.score}%</span></div>`).join('');
  el('#rec-area').innerHTML=`<div class="card"><div class="row space"><div>총 ${sets.length} 게임</div><div class="badge">추천 완료</div></div>${html}</div>`; },1000);}
function analyze(){ const fifty=state.draw50; const count=Array(46).fill(0); fifty.forEach(d=>d.nums.forEach(n=>count[n]++));
  const freq=[...Array(45)].map((_,i)=>({n:i+1,f:count[i+1]})).sort((a,b)=>b.f-a.f).slice(0,10);
  const cold=[...Array(45)].map((_,i)=>({n:i+1,f:count[i+1]})).sort((a,b)=>a.f-b.f).slice(0,10);
  const list=(arr,t)=> `<div class="card"><div class="row space"><strong>${t}</strong></div><div class="chips">${arr.map(x=> `<span class='chip'>${x.n}</span>`).join('')}</div></div>`;
  el('#app').innerHTML=`<div class="container">${topbar('분석')}${list(freq,'최근 50회 빈도 TOP10')}${list(cold,'최근 50회 저빈도 TOP10')}</div>`;}
window.goto=(p)=>{ if(p==='home') home(); if(p==='winning') winning(); if(p==='saved') saved(); if(p==='recommend') recommend(); if(p==='analyze') analyze(); }
async function boot(){ initLocal(); await bootstrapData(); home(); } boot();
