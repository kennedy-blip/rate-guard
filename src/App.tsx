import {useCallback,useEffect,useState} from 'react';
import {Activity,BookOpen,Github,Shield,Wifi,WifiOff} from 'lucide-react';
import {GatewayHeader} from './components/GatewayHeader';
import {BurstTester} from './components/BurstTester';
import {QuotaRulesPanel} from './components/QuotaRulesPanel';
import {TrafficAnalytics} from './components/TrafficAnalytics';
import {fetchTelemetry,resetTelemetry} from './lib/api';
import type {Policy,Telemetry} from './lib/types';
const DEFAULT_POLICY:Policy={rpm:12,tpm:12000,fallback:'none'};
export default function App(){
 const [policy,setPolicy]=useState<Policy>(DEFAULT_POLICY),[telemetry,setTelemetry]=useState<Telemetry|null>(null),[online,setOnline]=useState(false),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const refresh=useCallback(async()=>{try{const d=await fetchTelemetry();setTelemetry(d);setOnline(true);}catch{setOnline(false);}finally{setLoading(false);}},[]);
 useEffect(()=>{void refresh();const timer=window.setInterval(()=>void refresh(),2500);return()=>window.clearInterval(timer);},[refresh]);
 const onActivity=useCallback(()=>{void refresh();},[refresh]);
 const reset=async()=>{setBusy(true);try{await resetTelemetry();await refresh();}catch{setOnline(false);}finally{setBusy(false);}};
 const burst=()=>window.dispatchEvent(new CustomEvent('rateguard:burst'));
 return <div className="app-shell"><GatewayHeader policy={policy} online={online} busy={busy} onBurst={burst} onReset={()=>void reset()}/><main className="main-content">
 <div className="page-intro"><div><div className="breadcrumb"><span>WORKSPACE</span><b>/</b><span className="current">GATEWAY OVERVIEW</span></div><h1>Gateway <em>overview</em></h1><p>Monitor traffic, enforce intelligent quotas, and keep your AI workloads under control.</p></div><div className="intro-meta"><span className="environment"><i/> PRODUCTION ENVIRONMENT</span><span className="refresh-meta"><Activity size={13}/> Auto-refresh · 2.5s</span></div></div>
 <div className="overview-strip"><div className="overview-icon"><Shield size={17}/></div><div><b>RateGuard protection is {online?'active':'connecting'}</b><span>{online?'Your gateway is enforcing the current sliding-window quota policy.':'Waiting for the serverless telemetry endpoint to respond.'}</span></div><div className="overview-status">{online?<><Wifi size={14}/> OPERATIONAL</>:<><WifiOff size={14}/> CONNECTING</>}</div></div>
 <div className="workspace-grid"><div className="left-column"><QuotaRulesPanel policy={policy} onChange={setPolicy}/><BurstTester policy={policy} onActivity={onActivity}/></div><TrafficAnalytics data={telemetry} loading={loading}/></div>
 <footer className="footer"><div className="footer-brand"><span className="footer-mark"><Shield size={13}/></span> RateGuard <span className="footer-version">v1.0.0</span></div><span>Built for resilient AI infrastructure</span><div className="footer-links"><a href="https://vercel.com/docs/functions" target="_blank" rel="noreferrer"><BookOpen size={13}/> API docs</a><a href="https://github.com/kennedy-blip/rate-guard" target="_blank" rel="noreferrer"><Github size={13}/> GitHub</a></div></footer>
 </main></div>;
}