import type { VercelRequest,VercelResponse } from '@vercel/node';
import { getTelemetry,resetQuota } from './_lib/limiter';
export default function handler(req:VercelRequest,res:VercelResponse){
 res.setHeader('Cache-Control','no-store');
 if(req.method==='GET')return res.status(200).json(getTelemetry());
 if(req.method==='POST'&&req.body?.action==='reset'){resetQuota();return res.status(200).json({ok:true,message:'Quota window reset.',...getTelemetry()});}
 res.setHeader('Allow','GET, POST');return res.status(405).json({error:'Use GET for telemetry or POST with {"action":"reset"}.'});
}