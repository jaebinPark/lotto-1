
// scripts/build-draws.mjs
import fs from 'fs/promises';
import fetch from 'node-fetch';
import cheerio from 'cheerio';
const baseJson = 'https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=';
const byWin = 'https://www.dhlottery.co.kr/gameResult.do?method=byWin&drwNo=';
async function getLatestNo(){
  let lo=1, hi=3000;
  while(lo<hi){
    const mid=Math.floor((lo+hi+1)/2);
    const r=await fetch(baseJson+mid).then(r=>r.json()).catch(()=>({returnValue:'fail'}));
    if(r && r.returnValue==='success') lo=mid; else hi=mid-1;
  } return lo;
}
function toDraw(js){
  const nums=[js.drwtNo1,js.drwtNo2,js.drwtNo3,js.drwtNo4,js.drwtNo5,js.drwtNo6].map(Number).sort((a,b)=>a-b);
  return {drawNo:js.drwNo,date:js.drwNoDate,nums,bonus:js.bnusNo,first:{amount:js.firstWinamnt,people:js.firstPrzwnerCo},second:{amount:0,people:0},third:{amount:0,people:0},total:js.totSellamnt||0};
}
async function parseRankPage(no){
  try{
    const html=await fetch(byWin+no).then(r=>r.text());
    const $=cheerio.load(html);
    const rows=$('table.tbl_data tbody tr');
    const getRow=(i)=>{const t=$(rows[i]).find('td'); const ppl=Number($(t[2]).text().replace(/[^\d]/g,'')); const amt=Number($(t[3]).text().replace(/[^\d]/g,'')); return {people:ppl||0, amount:amt||0};};
    return {first:getRow(0), second:getRow(1), third:getRow(2)};
  }catch(e){ return null; }
}
async function run(){
  const latest=await getLatestNo(); const all=[];
  for(let i=1;i<=latest;i++){
    const js=await fetch(baseJson+i).then(r=>r.json()); if(!js || js.returnValue!=='success') break;
    const d=toDraw(js); const rk=await parseRankPage(i); if(rk){ d.first=rk.first; d.second=rk.second; d.third=rk.third; }
    all.push(d);
  }
  await fs.mkdir('data',{recursive:true});
  await fs.writeFile('data/draws.json', JSON.stringify(all,null,2));
  await fs.writeFile('data/draws50.json', JSON.stringify(all.slice(-50),null,2));
  console.log('Saved', all.length, 'draws');
}
run();
