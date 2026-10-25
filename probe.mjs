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

if(result.successful!==8){
 const {lookup}=await import('node:dns/promises');
 const {request}=await import('node:https');
 const diagnostics=await Promise.all(['https://github.com/','https://orion.directemar.cl/sitport/back/users/avisos','https://sitport.directemar.cl/api/meteo/pronosticos/'].map(async url=>{
  const host=new URL(url).hostname;
  const dns=await lookup(host,{all:true}).catch(e=>({error:e.code}));
  const transport=await new Promise(resolve=>{
   const start=performance.now();
   const req=request(url,{family:4,headers:{Accept:'application/json','User-Agent':'Mozilla/5.0',Origin:'https://sitport.directemar.cl',Referer:'https://sitport.directemar.cl/'}},res=>{res.resume();resolve({http_status:res.statusCode,duration_ms:Math.round(performance.now()-start)});});
   const timeout=setTimeout(()=>req.destroy(Object.assign(Error('HTTPS IPv4 timeout'),{code:'TIMEOUT'})),15000);
   req.on('error',e=>resolve({error:e.code??e.message,duration_ms:Math.round(performance.now()-start)}));
   req.on('close',()=>clearTimeout(timeout));req.end();
  });
  return {host,dns,ipv4_https:transport};
 }));
 console.log('NETWORK_DIAGNOSTICS '+JSON.stringify(diagnostics));
 if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,'\nIPv4 HTTPS diagnostics:\n\n'+diagnostics.map(d=>'- '+d.host+': '+JSON.stringify(d.ipv4_https)).join('\n')+'\n');
}
