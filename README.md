# RateGuard

Unified Vite + React + TypeScript dashboard and Vercel Serverless Functions API for testing sliding-window RPM/TPM quotas, inspecting 429 responses, and monitoring gateway telemetry.

## Stack
- Vite, React 18, TypeScript
- Tailwind CSS v4 using @tailwindcss/vite
- Vercel Node serverless functions in /api
- In-memory sliding 60-second request/token windows

## Local development
```bash
npm install
npm run build
npm run dev:vercel
```
Use `npm run dev` for the Vite frontend only. The Vite server proxies /api to localhost:3000; use `vercel dev` to run serverless endpoints locally.

## API
### POST /api/proxy
Send JSON: `{"apiKey":"demo-key","model":"gpt-4o-mini","tokens":1200,"policy":{"rpm":12,"tpm":12000,"fallback":"none"}}`.
Returns 200 when admitted or 429 when either quota is exceeded. Headers include X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Policy, X-TokenLimit-Remaining and Retry-After when throttled.

### GET /api/telemetry
Returns counters, policy, simulated upstream health, and recent audit events.

### POST /api/telemetry
Send `{"action":"reset"}` to clear this instance's quota window and demo metrics.

## Deploy to Vercel
Import https://github.com/kennedy-blip/rate-guard. Keep the Vite framework preset, build command `npm run build`, and output directory `dist`. Deploy the project as one unit.

## Production limitations
The initial implementation uses process-local memory for a zero-configuration demonstration. Vercel may run multiple concurrent instances and recycle them, so counters are not globally consistent or durable. Do not use this storage mode as a production security boundary. Replace the storage adapter with an atomic shared store such as Redis/Upstash and use trusted authenticated identities for production-wide quotas. Fallback routing is currently simulated; no upstream LLM provider is called. Store provider credentials only in server-side Vercel environment variables, never VITE_ variables.