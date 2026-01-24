import { Agent } from "agents";
import type { Connection, ConnectionContext, WSMessage } from "agents";
import { WorkflowEntrypoint, WorkflowStep } from "cloudflare:workers";
import type { WorkflowEvent } from "cloudflare:workers";

// Array of greetings to cycle through
const GREETINGS = [
    "Hi",
    "Hello",
    "Hola",
    "Bonjour",
    "Ciao",
    "Konnichiwa",
    "Guten Tag",
    "Olá",
    "Namaste",
    "Salaam"
];

type WorkflowParams = {
    name: string;
    greetingCount?: number;
    agentId: string; // The agent instance ID to call back to
};

type WorkflowMessage = {
    type: "start" | "status";
    instanceId?: string;
    name?: string;
    greetingCount?: number;
};

// Agent state that will be synced to all connected clients
type GreetingState = {
    status: "idle" | "running" | "complete" | "error";
    currentGreeting: string | null;
    greetings: string[];
    workflowInstanceId: string | null;
    name: string | null;
    error: string | null;
};

export class WorkflowAgent extends Agent<Env, GreetingState> {
    // Initial state
    initialState: GreetingState = {
        status: "idle",
        currentGreeting: null,
        greetings: [],
        workflowInstanceId: null,
        name: null,
        error: null
    };

    async onConnect(connection: Connection, _ctx: ConnectionContext) {
        // Send current state on connect - clients will also receive state via onStateUpdate
        connection.send(JSON.stringify({
            type: "connected",
            message: "Connected to WorkflowAgent. Send {type: 'start', name: 'YourName'} to start the greeting workflow.",
            state: this.state
        }));
    }

    async onMessage(connection: Connection, message: WSMessage) {
        try {
            const data = JSON.parse(message as string) as WorkflowMessage;

            if (data.type === "start") {
                // Reset state for new workflow
                this.setState({
                    ...this.initialState,
                    status: "running",
                    name: data.name || "World"
                });

                // Create a new workflow instance
                const instanceId = crypto.randomUUID();
                const instance = await this.env.GREATING_WORKFLOW.create({
                    id: instanceId,
                    params: {
                        name: data.name || "World",
                        greetingCount: data.greetingCount,
                        agentId: this.name // Pass the agent's ID so workflow can call back
                    }
                });

                // Update state with workflow instance ID
                this.setState({
                    ...this.state,
                    workflowInstanceId: instance.id
                });

                connection.send(JSON.stringify({
                    type: "workflow_started",
                    instanceId: instance.id
                }));

            } else if (data.type === "status" && data.instanceId) {
                const instance = await this.env.GREATING_WORKFLOW.get(data.instanceId);
                const status = await instance.status();

                connection.send(JSON.stringify({
                    type: "workflow_status",
                    instanceId: data.instanceId,
                    status: status.status,
                    output: status.output,
                    agentState: this.state
                }));
            }
        } catch (error) {
            connection.send(JSON.stringify({
                type: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            }));
        }
    }

    // RPC methods called directly by the workflow to update agent state
    // These are called via: agent.addGreeting("Hello, World!")

    async addGreeting(greeting: string) {
        this.setState({
            ...this.state,
            currentGreeting: greeting,
            greetings: [...this.state.greetings, greeting]
        });
    }

    async completeWorkflow() {
        this.setState({
            ...this.state,
            status: "complete",
            currentGreeting: null
        });
    }

    async setWorkflowError(error: string) {
        this.setState({
            ...this.state,
            status: "error",
            error
        });
    }
}

export class GreatingWorkflow extends WorkflowEntrypoint<Env, WorkflowParams> {
    async run(event: WorkflowEvent<WorkflowParams>, step: WorkflowStep) {
        const { name, greetingCount, agentId } = event.payload;
        const count = greetingCount ?? GREETINGS.length;
        const greetingsToUse = GREETINGS.slice(0, Math.min(count, GREETINGS.length));

        const results: string[] = [];

        // Get the agent stub once - we'll use it to call RPC methods
        const agent = this.env.WorkflowAgent.get(
            this.env.WorkflowAgent.idFromName(agentId)
        );

        for (let i = 0; i < greetingsToUse.length; i++) {
            const greeting = greetingsToUse[i];

            // Each greeting is a durable step
            const greetingMessage = await step.do(`greeting-${i + 1}`, async () => {
                const message = `${greeting}, ${name}!`;

                // Call the agent's RPC method directly to update state
                // This triggers setState() which broadcasts to all connected clients
                await agent.addGreeting(message);

                return message;
            });

            results.push(greetingMessage);

            // Sleep for 2 seconds between greetings (except after the last one)
            if (i < greetingsToUse.length - 1) {
                await step.sleep(`pause-after-greeting-${i + 1}`, "2 seconds");
            }
        }

        // Notify agent that workflow is complete via RPC
        await step.do("notify-complete", async () => {
            await agent.completeWorkflow();
        });

        return {
            name,
            greetings: results,
            completedAt: new Date().toISOString()
        };
    }
}