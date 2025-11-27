
import { Agent, } from "agents";
import type { Connection } from "agents";
import { stepCountIs, Experimental_Agent as VercelAgent, type ToolSet, type StreamTextResult } from 'ai';
import { openai } from "@ai-sdk/openai";

import { tools } from "workers/tools";
export class ResearchAgent extends Agent<Env> {
    // Vercel Agent instance with travel planning tools
    private createVercelAgent() {
        return new VercelAgent({
            model: openai('gpt-4o-2024-11-20'),
            system: 'You are a travel planning assistant. Help users plan their trips by providing weather information, flight options, and hotel recommendations.',
            tools: tools as ToolSet,
            stopWhen: stepCountIs(5)
        });
    }

    /**
     * HTTP Request Handler - Used by Vercel AI SDK endpoints (useChat/useCompletion)
     * Returns a streaming text response
     */
    async onRequest(request: Request) {
        const { prompt } = await request.json<{ prompt: string }>();
        const userPrompt = prompt || "Plan a trip to Paris - I need weather, flights, and hotels";

        const vercelAgent = this.createVercelAgent();
        const result = vercelAgent.stream({ prompt: userPrompt });

        return result.toTextStreamResponse();
    }

    /**
     * WebSocket Message Handler - Used by useAgent hook
     * Streams responses back through the WebSocket connection
     */
    async onMessage(connection: Connection, message: string) {
        try {
            const { prompt } = JSON.parse(message) as { prompt: string };

            const vercelAgent = this.createVercelAgent();
            const result = vercelAgent.stream({ prompt });

            // Stream chunks back through WebSocket
            for await (const chunk of result.textStream) {
                connection.send(JSON.stringify({ type: "chunk", content: chunk }));
            }

            // Signal completion
            connection.send(JSON.stringify({ type: "complete" }));
        } catch (error) {
            connection.send(JSON.stringify({
                type: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            }));
        }
    }

    /**
     * Initiate Agent - Custom RPC method for direct agent invocation
     * 
     * Key difference from onRequest:
     * - onRequest: Triggered via agent.fetch(request) - built-in HTTP handler
     * - initiateAgent: Called directly as RPC method - custom method pattern
     * 
     * Both return a Response (required for serialization across DO boundary),
     * but this demonstrates that you can create custom named methods on your agent
     * that can be called directly from your API routes.
     */
    initiateAgent(prompt: string): Response {
        const userPrompt = prompt || "Plan a trip to Paris - I need weather, flights, and hotels";

        const vercelAgent = this.createVercelAgent();
        const result = vercelAgent.stream({ prompt: userPrompt });

        // Must return Response (serializable) - can't return StreamTextResult across DO boundary
        return result.toTextStreamResponse();
    }
}