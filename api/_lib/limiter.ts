export interface Policy { rpm:number; tpm:number; fallback:'none'|'backup' }
export interface UsageEvent { at:number; tokens:number }
export interface AuditEvent { id:string; at:number; key:string; status:200|429|400; tokens:number; model:string; message:string }
interface RuntimeState { windows:Map<string,UsageEvent[]>; audit:AuditEvent[]; allowed:number; blocked:number; totalTokens:number; policy:Policy; startedAt:number }
const root=globalThis as typeof globalThis & { __rateGuard?:RuntimeState };
const defaults:Policy={rpm:60,tpm:60000,fallback:'none'};
function store():RuntimeState { if(!root.__rateGuard) root.__rateGuard={windows:new Map(),audit:[],allowed:0,blocked:0,totalTokens:0,policy:defaults,startedAt:Date.now()}; return root.__rateGuard; }
export function normalizePolicy(input?:Partial<Policy>):Policy {
 const rpm=Number(input?.rpm??defaults.rpm),tpm=Number(input?.tpm??defaults.tpm);
 return {rpm:Number.isFinite(rpm)?Math.min(10000,Math.max(1,Math.floor(rpm))):defaults.rpm,tpm:Number.isFinite(tpm)?Math.min(10000000,Math.max(1,Math.floor(tpm))):defaults.tpm,fallback:input?.fallback==='backup'?'backup':'none'};
}
function audit(s:RuntimeState,e:AuditEvent){s.audit.unshift(e);if(s.audit.length>100)s.audit.length=100;}
export function checkRequest(key:string,tokens:number,policyInput?:Partial<Policy>){
 const s=store(),policy=normalizePolicy(policyInput),now=Date.now(),cutoff=now-60000;s.policy=policy;
 const events=(s.windows.get(key)??[]).filter(e=>e.at>cutoff),used=events.reduce((n,e)=>n+e.tokens,0);
 const retry=events.length?Math.max(1,Math.ceil((events[0].at+60000-now)/1000)):1;
 const rpmExceeded=events.length>=policy.rpm,tpmExceeded=used+tokens>policy.tpm;
 const remainingRequests=Math.max(0,policy.rpm-events.length-(rpmExceeded||tpmExceeded?0:1));
 const remainingTokens=Math.max(0,policy.tpm-used-(rpmExceeded||tpmExceeded?0:tokens));
 s.windows.set(key,events);
 const event:AuditEvent={id:now+'-'+Math.random().toString(36).slice(2,8),at:now,key:key.slice(0,5)+'…',status:rpmExceeded||tpmExceeded?429:200,tokens,model:'gateway-test',message:rpmExceeded?'Requests per minute exceeded':tpmExceeded?'Tokens per minute exceeded':'Request admitted'};
 if(rpmExceeded||tpmExceeded){s.blocked++;audit(s,event);return {allowed:false,retryAfter:retry,remainingRequests:Math.max(0,policy.rpm-events.length),remainingTokens:Math.max(0,policy.tpm-used),policy,event};}
 events.push({at:now,tokens});s.windows.set(key,events);s.allowed++;s.totalTokens+=tokens;audit(s,event);
 return {allowed:true,retryAfter:0,remainingRequests,remainingTokens,policy,event};
}
export function getTelemetry(){
 const s=store(),now=Date.now(),recent=s.audit.filter(e=>e.at>now-60000),active=[...s.windows.values()].filter(a=>a.some(e=>e.at>now-60000)).length;
 const events=[...s.windows.values()].flat().filter(e=>e.at>now-60000),used=events.reduce((n,e)=>n+e.tokens,0);
 return {status:'ok',generatedAt:new Date(now).toISOString(),uptimeSeconds:Math.floor((now-s.startedAt)/1000),metrics:{allowed:s.allowed,blocked:s.blocked,total:s.allowed+s.blocked,requestsLastMinute:recent.length,activeKeys:active,tokensLastMinute:used,totalTokens:s.totalTokens},policy:s.policy,upstream:{primary:'simulated',healthy:true,backup:'configured-not-connected',fallbackEnabled:s.policy.fallback==='backup'},audit:s.audit.slice(0,30),storage:'instance-memory'};
}
export function resetQuota(){const s=store();s.windows.clear();s.audit=[];s.allowed=0;s.blocked=0;s.totalTokens=0;s.startedAt=Date.now();}