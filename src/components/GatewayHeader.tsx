import {ArrowUpRight,RotateCcw,ShieldCheck,Zap} from 'lucide-react';
import type {Policy} from '../lib/types';
interface Props{policy:Policy;online:boolean;busy:boolean;onBurst:()=>void;onReset:()=>void}
export function GatewayHeader({policy,online,busy,onBurst,onReset}:Props){return <header className="topbar">
 <div className="brand"><div className="brand-mark"><ShieldCheck size={21}/></div><div><div className="brand-name">rateguard<span>.</span></div><div className="brand-sub">AI GATEWAY CONTROL PLANE</div></div></div>
 <div className="topbar-right"><div className="health"><span className={'pulse '+(online?'live':'offline')}/><span>Edge Gateway: <b>{online?'Active':'Offline'}</b><small> /api/proxy {online?'Online':'Unreachable'}</small></span></div>
 <div className="policy-chip"><span className="chip-dot"/>{policy.rpm} RPM <i>·</i> {policy.tpm.toLocaleString()} TPM</div>
 <button className="btn btn-quiet" onClick={onReset} disabled={busy}><RotateCcw size={15}/> Reset window</button>
 <button className="btn btn-primary" onClick={onBurst} disabled={busy}><Zap size={15}/> Fire 10-request burst <ArrowUpRight size={14}/></button></div></header>}