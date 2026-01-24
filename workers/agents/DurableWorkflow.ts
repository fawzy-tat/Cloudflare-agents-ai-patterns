/**
 * DurableWorkflow Boilerplate
 *
 * A reusable template for creating Cloudflare Workflows integrated with Agents.
 * The Agent acts as the communication layer (WebSocket + HTTP) while the Workflow
 * handles durable, multi-step background processing.
 *
 * Architecture:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  Client (React)                                                         │
 * │  - useAgent() hook for WebSocket                                        │
 * │  - fetch() for HTTP                                                     │
 * └─────────────────────────────────────────────────────────────────────────┘
 *                              │
 *                              ▼
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  DurableWorkflowAgent (Durable Object)                                  │
 * │  - Manages state (synced to all connected clients)                      │
 * │  - Handles WebSocket connections (onConnect, onMessage)                 │
 * │  - Handles HTTP requests (onRequest)                                    │
 * │  - Exposes RPC methods for Workflow to call                             │
 * │  - Triggers Workflow via env.YOUR_WORKFLOW.create()                     │
 * └─────────────────────────────────────────────────────────────────────────┘
 *                              │
 *                              ▼
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  DurableWorkflowEntrypoint (Workflow)                                   │
 * │  - Runs durable, multi-step background tasks                            │
 * │  - Each step is independently retriable                                 │
 * │  - Calls Agent RPC methods to update state                              │
 * │  - Never called directly by client (Agent is the gateway)               │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Setup Instructions:
 * 1. Copy this file and rename classes/types for your use case
 * 2. Add to wrangler.jsonc:
 *    - durable_objects.bindings: { name: "YourAgent", class_name: "YourAgent" }
 *    - workflows: { name: "your-workflow", binding: "YOUR_WORKFLOW", class_name: "YourWorkflow" }
 *    - migrations: { tag: "vX", new_sqlite_classes: ["YourAgent"] }
 * 3. Add to workers/app.ts:
 *    - import { YourAgent, YourWorkflow } from "./agents/YourFile"
 *    - export { YourAgent, YourWorkflow }
 * 4. Run `pnpm wrangler types` to regenerate Env types
 *
 * @see https://developers.cloudflare.com/agents/api-reference/run-workflows/
 * @see https://developers.cloudflare.com/workflows/
 */

import { Agent } from "agents";
import type { Connection, ConnectionContext, WSMessage } from "agents";
import { WorkflowEntrypoint, WorkflowStep } from "cloudflare:workers";
import type { WorkflowEvent } from "cloudflare:workers";

// ============================================================================
// ENVIRONMENT TYPE EXTENSION
// Define the bindings this workflow needs (added to wrangler.jsonc)
// After configuration, run `pnpm wrangler types` to add to global Env
// ============================================================================

/**
 * Local Env extension for this workflow
 * These bindings must be added to wrangler.jsonc before use
 */
interface WorkflowEnv extends Env {
    /** Durable Object binding for the agent */
    DurableWorkflowAgent: DurableObjectNamespace<DurableWorkflowAgent>;
    /** Workflow binding */
    DURABLE_WORKFLOW: Workflow<WorkflowParams>;
}

// ============================================================================
// TYPE DEFINITIONS
// Customize these for your specific workflow
// ============================================================================

/**
 * Workflow Parameters - passed when creating a workflow instance
 * Customize with the data your workflow needs to run
 */
export type WorkflowParams = {
    /** Unique identifier for the task */
    taskId: string;
    /** The agent instance ID to call back to */
    agentId: string;
    /** Add your custom parameters here */
    // input: string;
    // options?: Record<string, unknown>;
};

/**
 * Agent State - synced to all connected WebSocket clients automatically
 * Customize with the state your UI needs to display
 */
export type WorkflowState = {
    /** Current workflow status */
    status: "idle" | "running" | "paused" | "complete" | "error";
    /** Current step being processed */
    currentStep: string | null;
    /** Progress percentage (0-100) */
    progress: number;
    /** Results accumulated during workflow execution */
    results: unknown[];
    /** Active workflow instance ID */
    workflowInstanceId: string | null;
    /** Error message if status is "error" */
    error: string | null;
    /** Timestamp of last update */
    lastUpdated: string | null;
};

/**
 * WebSocket Message Types - messages sent from client to agent
 */
export type ClientMessage =
    | { type: "start"; taskId?: string; params?: Record<string, unknown> }
    | { type: "status"; instanceId: string }
    | { type: "pause"; instanceId: string }
    | { type: "resume"; instanceId: string }
    | { type: "cancel"; instanceId: string };

/**
 * WebSocket Response Types - messages sent from agent to client
 */
export type AgentResponse =
    | { type: "connected"; message: string; state: WorkflowState }
    | { type: "workflow_started"; instanceId: string }
    | { type: "workflow_status"; instanceId: string; status: string; output?: unknown; agentState: WorkflowState }
    | { type: "state_update"; state: WorkflowState }
    | { type: "error"; message: string };

// ============================================================================
// DURABLE WORKFLOW AGENT
// The Agent is the communication layer - all external interactions go through here
// ============================================================================

/**
 * DurableWorkflowAgent - Manages state and communication for workflow execution
 *
 * Communication Patterns:
 * 1. WebSocket (useAgent hook) - Real-time bidirectional updates
 * 2. HTTP (fetch/useCompletion) - Request/response or streaming
 *
 * The agent:
 * - Maintains state that auto-syncs to all connected clients
 * - Triggers workflows and tracks their progress
 * - Exposes RPC methods that workflows call to update state
 */
export class DurableWorkflowAgent extends Agent<WorkflowEnv, WorkflowState> {

    // ========================================================================
    // STATE INITIALIZATION
    // ========================================================================

    /** Initial state - set when agent is first created */
    initialState: WorkflowState = {
        status: "idle",
        currentStep: null,
        progress: 0,
        results: [],
        workflowInstanceId: null,
        error: null,
        lastUpdated: null,
    };

    // ========================================================================
    // WEBSOCKET HANDLERS
    // Used with useAgent() hook from the frontend
    // ========================================================================

    /**
     * Called when a new WebSocket connection is established
     * Send initial state and any welcome message
     */
    async onConnect(connection: Connection, _ctx: ConnectionContext): Promise<void> {
        const response: AgentResponse = {
            type: "connected",
            message: "Connected to DurableWorkflowAgent. Send {type: 'start'} to begin a workflow.",
            state: this.state,
        };
        connection.send(JSON.stringify(response));
    }

    /**
     * Called when a WebSocket message is received
     * Parse the message and handle different command types
     */
    async onMessage(connection: Connection, message: WSMessage): Promise<void> {
        try {
            const data = JSON.parse(message as string) as ClientMessage;

            switch (data.type) {
                case "start":
                    await this.handleStartWorkflow(connection, data);
                    break;

                case "status":
                    await this.handleStatusRequest(connection, data.instanceId);
                    break;

                case "pause":
                    await this.handlePauseWorkflow(connection, data.instanceId);
                    break;

                case "resume":
                    await this.handleResumeWorkflow(connection, data.instanceId);
                    break;

                case "cancel":
                    await this.handleCancelWorkflow(connection, data.instanceId);
                    break;

                default:
                    this.sendError(connection, `Unknown message type: ${(data as any).type}`);
            }
        } catch (error) {
            this.sendError(connection, error instanceof Error ? error.message : "Failed to parse message");
        }
    }

    // ========================================================================
    // HTTP HANDLERS
    // Used with fetch() or useCompletion() from the frontend
    // ========================================================================

    /**
     * Called when an HTTP request is received
     * Handle REST-style API calls for workflow management
     */
    async onRequest(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const method = request.method;

        try {
            // POST /start - Start a new workflow
            if (method === "POST" && url.pathname.endsWith("/start")) {
                const body = await request.json<{ taskId?: string; params?: Record<string, unknown> }>();
                const instanceId = await this.startWorkflow(body.taskId, body.params);
                return Response.json({ success: true, instanceId, state: this.state });
            }

            // GET /status/:instanceId - Get workflow status
            if (method === "GET" && url.pathname.includes("/status/")) {
                const instanceId = url.pathname.split("/status/")[1];
                const status = await this.getWorkflowStatus(instanceId);
                return Response.json({ ...status, agentState: this.state });
            }

            // POST /pause/:instanceId - Pause a workflow
            if (method === "POST" && url.pathname.includes("/pause/")) {
                const instanceId = url.pathname.split("/pause/")[1];
                await this.pauseWorkflowInstance(instanceId);
                return Response.json({ success: true, state: this.state });
            }

            // POST /resume/:instanceId - Resume a paused workflow
            if (method === "POST" && url.pathname.includes("/resume/")) {
                const instanceId = url.pathname.split("/resume/")[1];
                await this.resumeWorkflowInstance(instanceId);
                return Response.json({ success: true, state: this.state });
            }

            // POST /cancel/:instanceId - Cancel/terminate a workflow
            if (method === "POST" && url.pathname.includes("/cancel/")) {
                const instanceId = url.pathname.split("/cancel/")[1];
                await this.cancelWorkflow(instanceId);
                return Response.json({ success: true, state: this.state });
            }

            // GET /state - Get current agent state
            if (method === "GET" && url.pathname.endsWith("/state")) {
                return Response.json({ state: this.state });
            }

            // Default: Return current state
            return Response.json({
                message: "DurableWorkflowAgent ready",
                state: this.state,
                endpoints: {
                    "POST /start": "Start a new workflow",
                    "GET /status/:id": "Get workflow status",
                    "POST /pause/:id": "Pause a running workflow",
                    "POST /resume/:id": "Resume a paused workflow",
                    "POST /cancel/:id": "Cancel/terminate a workflow",
                    "GET /state": "Get current agent state",
                }
            });

        } catch (error) {
            return Response.json(
                { error: error instanceof Error ? error.message : "Unknown error" },
                { status: 500 }
            );
        }
    }

    // ========================================================================
    // RPC METHODS
    // Called by the Workflow to update agent state
    // These trigger automatic broadcasts to all connected WebSocket clients
    // ========================================================================

    /**
     * Update the current step being processed
     * Called by workflow: await agent.updateStep("Processing item 3 of 10")
     */
    async updateStep(stepName: string, progress?: number): Promise<void> {
        this.setState({
            ...this.state,
            currentStep: stepName,
            progress: progress ?? this.state.progress,
            lastUpdated: new Date().toISOString(),
        });
    }

    /**
     * Add a result to the results array
     * Called by workflow: await agent.addResult({ item: "processed data" })
     */
    async addResult(result: unknown): Promise<void> {
        this.setState({
            ...this.state,
            results: [...this.state.results, result],
            lastUpdated: new Date().toISOString(),
        });
    }

    /**
     * Mark the workflow as complete
     * Called by workflow: await agent.completeWorkflow()
     */
    async completeWorkflow(finalResult?: unknown): Promise<void> {
        this.setState({
            ...this.state,
            status: "complete",
            currentStep: null,
            progress: 100,
            results: finalResult ? [...this.state.results, finalResult] : this.state.results,
            lastUpdated: new Date().toISOString(),
        });
    }

    /**
     * Mark the workflow as failed with an error
     * Called by workflow: await agent.setWorkflowError("Something went wrong")
     */
    async setWorkflowError(error: string): Promise<void> {
        this.setState({
            ...this.state,
            status: "error",
            error,
            lastUpdated: new Date().toISOString(),
        });
    }

    /**
     * Pause the workflow (if supported)
     * Called by workflow: await agent.pauseWorkflow()
     */
    async pauseWorkflow(): Promise<void> {
        this.setState({
            ...this.state,
            status: "paused",
            lastUpdated: new Date().toISOString(),
        });
    }

    // ========================================================================
    // PRIVATE HELPER METHODS
    // ========================================================================

    /**
     * Start a new workflow instance
     */
    private async startWorkflow(taskId?: string, params?: Record<string, unknown>): Promise<string> {
        // Reset state for new workflow
        this.setState({
            ...this.initialState,
            status: "running",
            lastUpdated: new Date().toISOString(),
        });

        // Create unique instance ID
        const instanceId = crypto.randomUUID();

        // Create workflow instance
        // NOTE: Replace DURABLE_WORKFLOW with your actual workflow binding name
        const instance = await this.env.DURABLE_WORKFLOW.create({
            id: instanceId,
            params: {
                taskId: taskId || instanceId,
                agentId: this.name, // Pass agent ID so workflow can call back
                ...params,
            } as WorkflowParams,
        });

        // Update state with workflow instance ID
        this.setState({
            ...this.state,
            workflowInstanceId: instance.id,
        });

        return instance.id;
    }

    /**
     * Get status of a workflow instance
     */
    private async getWorkflowStatus(instanceId: string): Promise<{ instanceId: string; status: string; output?: unknown }> {
        const instance = await this.env.DURABLE_WORKFLOW.get(instanceId);
        const status = await instance.status();
        return {
            instanceId,
            status: status.status,
            output: status.output,
        };
    }

    /**
     * Cancel a workflow instance
     * @see https://developers.cloudflare.com/workflows/build/workers-api/
     */
    private async cancelWorkflow(instanceId: string): Promise<void> {
        const instance = await this.env.DURABLE_WORKFLOW.get(instanceId);
        await instance.terminate();
        this.setState({
            ...this.state,
            status: "idle",
            workflowInstanceId: null,
            lastUpdated: new Date().toISOString(),
        });
    }

    /**
     * Pause a workflow instance
     * @see https://developers.cloudflare.com/workflows/build/workers-api/
     */
    private async pauseWorkflowInstance(instanceId: string): Promise<void> {
        const instance = await this.env.DURABLE_WORKFLOW.get(instanceId);
        await instance.pause();
        this.setState({
            ...this.state,
            status: "paused",
            lastUpdated: new Date().toISOString(),
        });
    }

    /**
     * Resume a paused workflow instance
     * @see https://developers.cloudflare.com/workflows/build/workers-api/
     */
    private async resumeWorkflowInstance(instanceId: string): Promise<void> {
        const instance = await this.env.DURABLE_WORKFLOW.get(instanceId);
        await instance.resume();
        this.setState({
            ...this.state,
            status: "running",
            lastUpdated: new Date().toISOString(),
        });
    }

    /**
     * Handle start workflow command from WebSocket
     */
    private async handleStartWorkflow(
        connection: Connection,
        data: { taskId?: string; params?: Record<string, unknown> }
    ): Promise<void> {
        const instanceId = await this.startWorkflow(data.taskId, data.params);
        const response: AgentResponse = {
            type: "workflow_started",
            instanceId,
        };
        connection.send(JSON.stringify(response));
    }

    /**
     * Handle status request from WebSocket
     */
    private async handleStatusRequest(connection: Connection, instanceId: string): Promise<void> {
        const status = await this.getWorkflowStatus(instanceId);
        const response: AgentResponse = {
            type: "workflow_status",
            ...status,
            agentState: this.state,
        };
        connection.send(JSON.stringify(response));
    }

    /**
     * Handle pause workflow command from WebSocket
     */
    private async handlePauseWorkflow(connection: Connection, instanceId: string): Promise<void> {
        await this.pauseWorkflowInstance(instanceId);
        const response: AgentResponse = {
            type: "state_update",
            state: this.state,
        };
        connection.send(JSON.stringify(response));
    }

    /**
     * Handle resume workflow command from WebSocket
     */
    private async handleResumeWorkflow(connection: Connection, instanceId: string): Promise<void> {
        await this.resumeWorkflowInstance(instanceId);
        const response: AgentResponse = {
            type: "state_update",
            state: this.state,
        };
        connection.send(JSON.stringify(response));
    }

    /**
     * Handle cancel workflow command from WebSocket
     */
    private async handleCancelWorkflow(connection: Connection, instanceId: string): Promise<void> {
        await this.cancelWorkflow(instanceId);
        const response: AgentResponse = {
            type: "state_update",
            state: this.state,
        };
        connection.send(JSON.stringify(response));
    }

    /**
     * Send error message to connection
     */
    private sendError(connection: Connection, message: string): void {
        const response: AgentResponse = {
            type: "error",
            message,
        };
        connection.send(JSON.stringify(response));
    }
}

// ============================================================================
// DURABLE WORKFLOW ENTRYPOINT
// The Workflow runs durable, multi-step background tasks
// ============================================================================

/**
 * DurableWorkflowEntrypoint - Handles the actual workflow logic
 *
 * Key concepts:
 * - Each step.do() is independently retriable
 * - State is automatically persisted between steps
 * - Use step.sleep() for delays
 * - Call agent RPC methods to update UI in real-time
 *
 * The workflow:
 * - Receives params including agentId
 * - Gets agent stub via env.AgentBinding.get()
 * - Calls agent RPC methods to update state (triggers WebSocket broadcasts)
 * - Returns final result when complete
 */
export class DurableWorkflowEntrypoint extends WorkflowEntrypoint<WorkflowEnv, WorkflowParams> {

    async run(event: WorkflowEvent<WorkflowParams>, step: WorkflowStep) {
        const { taskId, agentId } = event.payload;

        // Get the agent stub to call RPC methods
        // NOTE: Replace DurableWorkflowAgent with your actual agent binding name
        const agent = this.env.DurableWorkflowAgent.get(
            this.env.DurableWorkflowAgent.idFromName(agentId)
        );

        try {
            // ================================================================
            // STEP 1: Initialize
            // ================================================================
            await step.do("initialize", async () => {
                await agent.updateStep("Initializing...", 0);
                // Add your initialization logic here
                return { initialized: true };
            });

            // ================================================================
            // STEP 2: Process Items (example loop)
            // ================================================================
            const items = ["item-1", "item-2", "item-3"]; // Replace with your data
            const results: string[] = [];

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const progress = Math.round(((i + 1) / items.length) * 80) + 10; // 10-90%

                const result = await step.do(`process-${item}`, async () => {
                    // Update agent state (broadcasts to all clients)
                    await agent.updateStep(`Processing ${item}...`, progress);

                    // Add your processing logic here
                    const processed = `Processed: ${item}`;

                    // Add result to agent state
                    await agent.addResult({ item, processed, timestamp: new Date().toISOString() });

                    return processed;
                });

                results.push(result);

                // Optional: Sleep between steps
                if (i < items.length - 1) {
                    await step.sleep(`pause-after-${item}`, "1 second");
                }
            }

            // ================================================================
            // STEP 3: Finalize
            // ================================================================
            const finalResult = await step.do("finalize", async () => {
                await agent.updateStep("Finalizing...", 95);

                // Add your finalization logic here
                return {
                    taskId,
                    totalItems: results.length,
                    results,
                    completedAt: new Date().toISOString(),
                };
            });

            // ================================================================
            // STEP 4: Notify Complete
            // ================================================================
            await step.do("notify-complete", async () => {
                await agent.completeWorkflow(finalResult);
            });

            return finalResult;

        } catch (error) {
            // Handle errors - notify agent
            await step.do("handle-error", async () => {
                await agent.setWorkflowError(
                    error instanceof Error ? error.message : "Unknown workflow error"
                );
            });
            throw error;
        }
    }
}

// ============================================================================
// USAGE EXAMPLE - Frontend React Component
// ============================================================================
/*
import { useAgent } from "agents/react";
import { useState } from "react";

type WorkflowState = {
    status: "idle" | "running" | "paused" | "complete" | "error";
    currentStep: string | null;
    progress: number;
    results: unknown[];
    workflowInstanceId: string | null;
    error: string | null;
    lastUpdated: string | null;
};

export function WorkflowDemo() {
    const [state, setState] = useState<WorkflowState>({
        status: "idle",
        currentStep: null,
        progress: 0,
        results: [],
        workflowInstanceId: null,
        error: null,
        lastUpdated: null,
    });

    const agent = useAgent({
        agent: "durable-workflow-agent", // matches route in app.ts
        name: "my-session-id",           // unique per user/session

        // Called whenever agent.setState() is called
        onStateUpdate: (newState: WorkflowState) => {
            setState(newState);
        },

        // Called for all WebSocket messages
        onMessage: (message) => {
            const data = JSON.parse(message.data);
            if (data.type === "connected" && data.state) {
                setState(data.state);
            }
        },
    });

    const startWorkflow = () => {
        agent.send(JSON.stringify({
            type: "start",
            params: { customParam: "value" }
        }));
    };

    return (
        <div>
            <button onClick={startWorkflow} disabled={state.status === "running"}>
                Start Workflow
            </button>
            <div>Status: {state.status}</div>
            <div>Step: {state.currentStep}</div>
            <div>Progress: {state.progress}%</div>
            <div>Results: {state.results.length}</div>
        </div>
    );
}
*/

// ============================================================================
// CONFIGURATION EXAMPLE - wrangler.jsonc additions
// ============================================================================
/*
{
    "migrations": [
        {
            "tag": "vX",
            "new_sqlite_classes": ["DurableWorkflowAgent"]
        }
    ],
    "durable_objects": {
        "bindings": [
            {
                "name": "DurableWorkflowAgent",
                "class_name": "DurableWorkflowAgent"
            }
        ]
    },
    "workflows": [
        {
            "name": "durable-workflow",
            "binding": "DURABLE_WORKFLOW",
            "class_name": "DurableWorkflowEntrypoint"
        }
    ]
}
*/

// ============================================================================
// REGISTRATION EXAMPLE - workers/app.ts additions
// ============================================================================
/*
// Import
import { DurableWorkflowAgent, DurableWorkflowEntrypoint } from "./agents/DurableWorkflow";

// Export (required for Cloudflare to find the classes)
export { DurableWorkflowAgent, DurableWorkflowEntrypoint };

// Optional: Add HTTP route for direct access
app.post("/api/workflow/start", async (c) => {
    const { sessionId, params } = await c.req.json<{ sessionId: string; params?: Record<string, unknown> }>();
    const agent = await getAgentByName<Env, DurableWorkflowAgent>(c.env.DurableWorkflowAgent, sessionId);

    // Use agent.fetch() to call onRequest handler
    const request = new Request(c.req.url + "/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params || {}),
    });

    return agent.fetch(request);
});
*/
