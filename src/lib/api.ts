import type {Policy,Telemetry,ProxyResult} from './types';
export async function sendTestRequest(tokens:number,policy:Policy,apiKey='demo-key'):Promise<ProxyResult>{
 const response=await fetch('/api/proxy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tokens,policy,apiKey,model:'gpt-4o-mini'})});
 const body=await response.json() as Record<string,unknown>,headers:Record<string,string>={};
 ['x-ratelimit-limit','x-ratelimit-remaining','x-tokenlimit-remaining','retry-after'].forEach(k=>{const v=response.headers.get(k);if(v)headers[k]=v;});
 return {status:response.status,body,headers};
}
export async function fetchTelemetry():Promise<Telemetry>{const r=await fetch('/api/telemetry',{cache:'no-store'});if(!r.ok)throw new Error('Telemetry returned '+r.status);return r.json() as Promise<Telemetry>;}
export async function resetTelemetry():Promise<void>{const r=await fetch('/api/telemetry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'reset'})});if(!r.ok)throw new Error('Could not reset quota window');}