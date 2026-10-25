import {writeFile,appendFile} from 'node:fs/promises';
const base='https://orion.directemar.cl/sitport/back/users/';
const sources=[
['bahias','POST',base+'consultaBahias'],['restricciones','POST',base+'consultaRestricciones'],
['capitanias','POST',base+'consultaCapuertoRestriccion'],
['pronosticos','GET','https://sitport.directemar.cl/api/meteo/pronosticos/'],
['avisos','GET',base+'avisos'],['en_puerto','POST',base+'consultaNavePuerto'],
['recalando','POST',base+'consultaNaveRecalando'],['zarpes','POST',base+'consultaNavezarpe']
];
const results=await Promise.all(sources.map(async([source,method,url])=>{
 let last;
 for(let attempt=1;attempt<=2;attempt++){
  const start=performance.now();
  try{
   const res=await fetch(url,{method,headers:{Accept:'application/json','User-Agent':'Mozilla/5.0',Origin:'https://sitport.directemar.cl',Referer:'https://sitport.directemar.cl/',...(method==='POST'?{'Content-Type':'application/json'}:{})},...(method==='POST'?{body:'{}'}:{}),signal:AbortSignal.timeout(14000)});
   const body=await res.text();
   if(!res.ok)throw Error('HTTP '+res.status);
   const parsed=JSON.parse(body);
   const rows=['pronosticos','avisos'].includes(source)?parsed:parsed.recordset;
   if(!Array.isArray(rows))throw Error('Unexpected response structure');
   last={source,ok:true,http_status:res.status,rows:rows.length,bytes:Buffer.byteLength(body),attempt,duration_ms:Math.round(performance.now()-start)};
   break;
  }catch(e){last={source,ok:false,attempt,duration_ms:Math.round(performance.now()-start),error:e.name+': '+e.message,code:e.cause?.code??null};}
 }
 return last;
}));
const result={at:new Date().toISOString(),runner:process.platform,node:process.version,successful:results.filter(r=>r.ok).length,sources:results};
console.log(JSON.stringify(result,null,2));
await writeFile('probe-result.json',JSON.stringify(result,null,2));
if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,'## SITPORT connectivity\n\n'+result.successful+'/8 sources responded correctly.\n\n| Source | OK | HTTP/error |\n|---|---|---|\n'+results.map(r=>'| '+r.source+' | '+r.ok+' | '+(r.http_status??r.code??r.error)+' |').join('\n')+'\n');
if(result.successful!==8)process.exitCode=1;
