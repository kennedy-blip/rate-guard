import type { VercelRequest,VercelResponse } from '@vercel/node';
import { checkRequest,normalizePolicy } from './_lib/limiter';
export default async function handler(req:VercelRequest,res:VercelResponse){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed. Use POST /api/proxy.'});}
 const body=typeof req.body==='string'?(()=>{try{return JSON.parse(req.body);}catch{return null;}})():req.body;
 if(!body||typeof body!=='object'||Array.isArray(body))return res.status(400).json({error:'A JSON request body is required.'});
 const tokens=Number(body.tokens??1);
 if(!Number.isInteger(tokens)||tokens<1||tokens>1000000)return res.status(400).json({error:'tokens must be an integer between 1 and 1,000,000.'});
 const policy=normalizePolicy(body.policy),forwarded=req.headers['x-forwarded-for'];
 const ip=(Array.isArray(forwarded)?forwarded[0]:forwarded?.split(',')[0])?.trim();
 const apiKey=typeof body.apiKey==='string'&&body.apiKey.trim()?body.apiKey.trim().slice(0,128):'';
 const result=checkRequest(apiKey||'ip:'+(ip||'unknown'),tokens,policy);
 res.setHeader('Cache-Control','no-store');res.setHeader('X-RateLimit-Limit',String(policy.rpm));res.setHeader('X-RateLimit-Remaining',String(result.remainingRequests));
 res.setHeader('X-RateLimit-Policy',policy.rpm+';w=60, '+policy.tpm+';unit=tokens;w=60');res.setHeader('X-TokenLimit-Remaining',String(result.remainingTokens));
 if(!result.allowed){res.setHeader('Retry-After',String(result.retryAfter));return res.status(429).json({ok:false,error:result.event.message,retryAfter:result.retryAfter,limits:{rpm:policy.rpm,tpm:policy.tpm},remaining:{requests:result.remainingRequests,tokens:result.remainingTokens}});}
 return res.status(200).json({ok:true,message:'Request admitted by RateGuard.',request:{model:typeof body.model==='string'?body.model.slice(0,80):'gateway-test',tokens},limits:{rpm:policy.rpm,tpm:policy.tpm},remaining:{requests:result.remainingRequests,tokens:result.remainingTokens},routing:{selected:'primary',fallback:policy.fallback}});
}