- routeAgentRequest is important!
- Vercel AI SDK works hand to hand with Cloudflare Agent SDK
- Both of the examples in the code are calling only 1 method to direclty invoke the agent. which I think is the right way to do it. That's just my code style. each agent should be just an agent which already gives us a lot of features. don't treat it as a durable object and create so many methods in there.
- I noticed the the cloudflare agent wesocket connection setup isn't stable all the time. but still works.

References:
https://www.npmjs.com/package/agents
https://claude.ai/chat/e412a1d1-2186-4ec5-9cbf-26fd2e3cce0f
https://developers.cloudflare.com/workers/get-started/quickstarts/#react-router-hono-fullstack-template
https://www.youtube.com/watch?v=SujrIrj-aZ8&list=PLzfTyn6__SjiTDJ8uNwUCPDopXNHzC-BV
