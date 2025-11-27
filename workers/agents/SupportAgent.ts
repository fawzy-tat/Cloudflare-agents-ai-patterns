import { Agent } from "agents";

export class SupportAgent extends Agent {
    async onRequest(request: Request) {
        // Transform intention into response
        return new Response("Ready to assist.");
    }
}