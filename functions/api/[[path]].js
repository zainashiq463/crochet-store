const J=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json'}});
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
async function tok(env){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.ADMIN_PASSWORD),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',k,new TextEncoder().encode('admin')))}
const DEF={settings:{name:'Knotty Loops',tagline:'Crochet, banaya aap ke liye.',wa:'923001234567',insta:'',logo:''},products:[]};
export async function onRequest({request,env,params}){
 const p=(params.path||[]).join('/'),m=request.method,KV=env.STORE;
 if(!KV||!env.ADMIN_PASSWORD)return J({error:'Setup incomplete: KV binding STORE aur ADMIN_PASSWORD set karein'},500);
 if(p==='data'&&m==='GET'){const r=J(JSON.parse(await KV.get('data')||'null')||DEF);r.headers.set('cache-control','public,max-age=20');return r}
 if(p.startsWith('img/')&&m==='GET'){const v=await KV.get('img:'+p.slice(4));if(!v)return new Response('',{status:404});const i=v.indexOf(',');
  return new Response(Uint8Array.from(atob(v.slice(i+1)),c=>c.charCodeAt(0)),{headers:{'content-type':v.slice(5,v.indexOf(';')),'cache-control':'public,max-age=31536000,immutable'}})}
 if(p==='track'&&m==='POST'){const b=await request.json().catch(()=>({})),d=new Date().toISOString().slice(0,10),k='stats:'+d;
  const s=JSON.parse(await KV.get(k)||'{"v":0,"src":{},"clk":{}}'),cl=x=>String(x||'?').slice(0,40);
  if(b.t==='visit'){s.v++;const x=cl(b.src);s.src[x]=(s.src[x]||0)+1}
  else if(b.t==='click'){const x=cl(b.name);s.clk[x]=(s.clk[x]||0)+1}else return J({ok:0});
  await KV.put(k,JSON.stringify(s),{expirationTtl:60*60*24*120});return J({ok:1})}
 if(p==='login'&&m==='POST'){const b=await request.json().catch(()=>({}));return b.password===env.ADMIN_PASSWORD?J({token:await tok(env)}):J({error:'Galat password'},401)}
 if(request.headers.get('x-token')!==await tok(env))return J({error:'Unauthorized'},401);
 if(p==='ping')return J({ok:1});
 if(p==='data'&&m==='PUT'){const t=await request.text();JSON.parse(t);await KV.put('data',t);return J({ok:1})}
 if(p==='img'&&m==='POST'){const t=await request.text();if(!t.startsWith('data:image/')||t.length>2e6)return J({error:'Bad image'},400);const id=crypto.randomUUID().slice(0,12);await KV.put('img:'+id,t);return J({id})}
 if(p.startsWith('img/')&&m==='DELETE'){await KV.delete('img:'+p.slice(4));return J({ok:1})}
 if(p==='stats'){const l=(await KV.list({prefix:'stats:'})).keys.map(k=>k.name).sort().slice(-30);
  return J(await Promise.all(l.map(async n=>({d:n.slice(6),...JSON.parse(await KV.get(n))}))))}
 return J({error:'Not found'},404)}
