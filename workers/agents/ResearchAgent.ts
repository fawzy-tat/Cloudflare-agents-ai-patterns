
import { Agent, } from "agents";
import type { Connection } from "agents";
import { stepCountIs, Experimental_Agent as VercelAgent, type ToolSet, type StreamTextResult } from 'ai';
import { openai } from "@ai-sdk/openai";

import { tools } from "workers/tools";
export class ResearchAgent extends Agent<Env> {
    // Vercel Agent instance with travel planning and news research tools
    private createVercelAgent() {
        return new VercelAgent({
            // for some reason gpt 5 wasn't good with the tools, so we're using gpt 4o
            model: openai('gpt-5-nano'),
            system:
                `
            You are a research and travel planning assistant.
            Help users with travel planning (weather, news) about a specific country.
            You MUST use all the available tools to answer questions.
            Based on these recent headlines about the given city or country, assess travel safety focusing on security, health, political stability, and natural disasters.
            Return your assessment in a concise and actionable format 3 lines max, including any recommendations for the user.
            `,
            tools: {
                getWeatherTool: tools.getWeatherTool,
                getNewsTool: tools.getNewsTool(this.env),
            } as ToolSet,
            stopWhen: stepCountIs(5),
            onStepFinish: (step) => {
                console.log('Step finished:');
            }
        });
    }

    /**
     * HTTP Request Handler - Used by Vercel AI SDK endpoints (useChat/useCompletion)
     * Returns a streaming text response
     * 
     * Accepts either:
     * - { prompt } - full prompt (from /api/research route)
     * - { city } - city selection (from /agents/* direct route)
     */
    async onRequest(request: Request) {
        const { prompt, city } = await request.json<{ prompt?: string; city?: string }>();

        // Use prompt if provided and non-empty, otherwise build from city
        const userPrompt = prompt && prompt.trim() ? prompt : `Plan a trip to ${city}`;

        const vercelAgent = this.createVercelAgent();
        const result = vercelAgent.stream({ prompt: userPrompt });

        return result.toTextStreamResponse();
    }

    /**
     * WebSocket Message Handler - Used by useAgent hook
     * Streams responses back through the WebSocket connection
     * 
     * Expects { city } - builds the user prompt from the selected city
     */
    async onMessage(connection: Connection, message: string) {
        try {
            const { city } = JSON.parse(message) as { city: string };

            // Build user prompt from city selection
            const userPrompt = `Plan a trip to ${city}`;

            const vercelAgent = this.createVercelAgent();
            const result = vercelAgent.stream({ prompt: userPrompt });

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
     * 
     * Expects prompt - the user prompt is constructed by the API route in app.ts
     */
    initiateAgent(prompt: string): Response {
        const vercelAgent = this.createVercelAgent();
        const result = vercelAgent.stream({ prompt });

        // Must return Response (serializable) - can't return StreamTextResult across DO boundary
        return result.toTextStreamResponse();
    }
}