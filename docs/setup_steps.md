- Upgraded vite to 1.15.2 (latest)
  "devDependencies": {
  "@cloudflare/vite-plugin": "1.15.2",
  "wrangler": "4.50.0"
  }
- To fix the tsconfig file typescript error, I added the missing @cloudflare/workers-types package to devDependencies:
  "@cloudflare/workers-types": "^4.20251114.0"

- Add nodejs_compat to compatibility_flags ( will be needed when using agents)
  "compatibility_flags": ["nodejs_compat"],
  The agents package uses node:async_hooks, which is a Node.js built-in module not available in Cloudflare Workers by default.

  You'll also need to run the following after adding the nodejs_compat.
  cd /Users/fawzytat/projects/solutions/cf-hono-rr7-agents && rm -rf node_modules/.vite

- install the vercel ai sdk + other tools
  pnpm add ai @ai-sdk/anthropic @ai-sdk/openai zod

- after installing shadcn, add the following to the ts config file to avoid the No import alias found in your tsconfig.json file.

"paths": {
"@/_": ["./app/_"]
},
