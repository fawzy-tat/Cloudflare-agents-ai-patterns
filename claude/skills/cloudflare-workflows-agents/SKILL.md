---
name: cloudflare-workflows-agents
description: Comprehensive guide to integrating Cloudflare Workflows with Agents for durable, multi-step background tasks with real-time state updates. Use when implementing workflows that need to communicate progress back to users, setting up agent-workflow RPC patterns, or building long-running tasks with WebSocket state synchronization.
---

# Cloudflare Workflows with Agents

This skill covers how to integrate Cloudflare Workflows with Cloudflare Agents to build durable, multi-step background tasks that broadcast real-time state updates to connected clients.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Client (React)                                                             │
│  - useAgent() hook for WebSocket (real-time state updates)                  │
│  - fetch() for HTTP (start/stop/status)                                     │
│  - onStateUpdate callback receives agent state changes                      │
└─────────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  WorkflowAgent (Durable Object)                                             │
│  - Manages state (synced to all connected WebSocket clients)                │
│  - Handles WebSocket connections (onConnect, onMessage)                     │
│  - Handles HTTP requests (onRequest)                                        │
│  - Exposes RPC methods for Workflow to call                                 │
│  - Triggers Workflow via env.MY_WORKFLOW.create()                           │
│  - NEVER exposes Workflow directly to clients                               │
└─────────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  MyWorkflow (WorkflowEntrypoint)                                            │
│  - Runs durable, multi-step background tasks                                │
│  - Each step.do() is independently retriable                                │
│  - Calls Agent RPC methods to update state                                  │
│  - Agent broadcasts state changes to all WebSocket clients                  │
│  - Never called directly by client (Agent is the gateway)                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Concepts

### Agents vs Workflows

| Feature | Agent (Durable Object) | Workflow |
|---------|------------------------|----------|
| Execution | Can run forever, loop, branch | Runs to completion |
| State | In-memory + SQLite | Persisted between steps |
| Communication | WebSocket + HTTP | Via Agent RPC only |
| Retries | Manual | Automatic per step |
| Use Case | User interaction layer | Background processing |

### Why Combine Them?

- **Agent**: Communication gateway, state management, WebSocket broadcast
- **Workflow**: Durable execution, automatic retries, step persistence
- **Together**: Real-time UI updates for long-running, reliable background tasks

---

## Complete Implementation

### 1. Type Definitions

```typescript
// Workflow Parameters - passed when creating workflow instance
export type WorkflowParams = {
    taskId: string;
    agentId: string; // Required: Agent ID to call back to
    // Add your custom parameters
    input?: string;
    options?: Record<string, unknown>;
};

// Agent State - synced to all connected WebSocket clients
export type WorkflowState = {
    status: "idle" | "running" | "paused" | "complete" | "error";
    currentStep: string | null;
    progress: number; // 0-100
    results: unknown[];
    workflowInstanceId: string | null;
    error: string | null;
    lastUpdated: string | null;
};

// WebSocket Messages from Client
export type ClientMessage =
    | { type: "start"; taskId?: string; params?: Record<string, unknown> }
    | { type: "status"; instanceId: string }
    | { type: "pause"; instanceId: string }
    | { type: "resume"; instanceId: string }
    | { type: "cancel"; instanceId: string };

// WebSocket Responses from Agent
export type AgentResponse =
    | { type: "connected"; message: string; state: WorkflowState }
    | { type: "workflow_started"; instanceId: string }
    | { type: "workflow_status"; instanceId: string; status: string; output?: unknown }
    | { type: "state_update"; state: WorkflowState }
    | { type: "error"; message: string };
```

### 2. Agent Implementation

```typescript
import { Agent } from "agents";
import type { Connection, ConnectionContext, WSMessage } from "agents";

export class WorkflowAgent extends Agent<Env, WorkflowState> {
    // Initial state for new agent instances
    initialState: WorkflowState = {
        status: "idle",
        currentStep: null,
        progress: 0,
        results: [],
        workflowInstanceId: null,
        error: null,
        lastUpdated: null,
    };

    // =========================================================================
    // WEBSOCKET HANDLERS
    // =========================================================================

    async onConnect(connection: Connection, _ctx: ConnectionContext) {
        // Send current state when client connects
        connection.send(JSON.stringify({
            type: "connected",
            message: "Connected to WorkflowAgent",
            state: this.state,
        }));
    }

    async onMessage(connection: Connection, message: WSMessage) {
        try {
            const data = JSON.parse(message as string) as ClientMessage;

            switch (data.type) {
                case "start":
                    await this.startWorkflow(connection, data);
                    break;
                case "pause":
                    await this.pauseWorkflow(data.instanceId);
                    break;
                case "resume":
                    await this.resumeWorkflow(data.instanceId);
                    break;
                case "cancel":
                    await this.cancelWorkflow(data.instanceId);
                    break;
                case "status":
                    await this.sendStatus(connection, data.instanceId);
                    break;
            }
        } catch (error) {
            connection.send(JSON.stringify({
                type: "error",
                message: error instanceof Error ? error.message : "Unknown error",
            }));
        }
    }

    // =========================================================================
    // HTTP HANDLERS (for non-WebSocket clients)
    // =========================================================================

    async onRequest(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const method = request.method;

        if (method === "POST" && url.pathname.endsWith("/start")) {
            const body = await request.json<{ params?: Record<string, unknown> }>();
            const instanceId = await this.createWorkflow(body.params);
            return Response.json({ success: true, instanceId, state: this.state });
        }

        if (method === "GET" && url.pathname.endsWith("/state")) {
            return Response.json({ state: this.state });
        }

        return Response.json({ state: this.state, message: "WorkflowAgent ready" });
    }

    // =========================================================================
    // RPC METHODS - Called by Workflow to update Agent state
    // These trigger automatic WebSocket broadcasts to all clients
    // =========================================================================

    async updateStep(stepName: string, progress?: number) {
        this.setState({
            ...this.state,
            currentStep: stepName,
            progress: progress ?? this.state.progress,
            lastUpdated: new Date().toISOString(),
        });
    }

    async addResult(result: unknown) {
        this.setState({
            ...this.state,
            results: [...this.state.results, result],
            lastUpdated: new Date().toISOString(),
        });
    }

    async completeWorkflow(finalResult?: unknown) {
        this.setState({
            ...this.state,
            status: "complete",
            currentStep: null,
            progress: 100,
            results: finalResult ? [...this.state.results, finalResult] : this.state.results,
            lastUpdated: new Date().toISOString(),
        });
    }

    async setWorkflowError(error: string) {
        this.setState({
            ...this.state,
            status: "error",
            error,
            lastUpdated: new Date().toISOString(),
        });
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    private async startWorkflow(connection: Connection, data: ClientMessage) {
        const instanceId = await this.createWorkflow((data as any).params);
        connection.send(JSON.stringify({
            type: "workflow_started",
            instanceId,
        }));
    }

    private async createWorkflow(params?: Record<string, unknown>): Promise<string> {
        // Reset state
        this.setState({
            ...this.initialState,
            status: "running",
            lastUpdated: new Date().toISOString(),
        });

        const instanceId = crypto.randomUUID();

        // Create workflow instance
        const instance = await this.env.MY_WORKFLOW.create({
            id: instanceId,
            params: {
                taskId: instanceId,
                agentId: this.name, // Pass agent ID for callback
                ...params,
            } as WorkflowParams,
        });

        this.setState({
            ...this.state,
            workflowInstanceId: instance.id,
        });

        return instance.id;
    }

    private async pauseWorkflow(instanceId: string) {
        const instance = await this.env.MY_WORKFLOW.get(instanceId);
        await instance.pause();
        this.setState({
            ...this.state,
            status: "paused",
            lastUpdated: new Date().toISOString(),
        });
    }

    private async resumeWorkflow(instanceId: string) {
        const instance = await this.env.MY_WORKFLOW.get(instanceId);
        await instance.resume();
        this.setState({
            ...this.state,
            status: "running",
            lastUpdated: new Date().toISOString(),
        });
    }

    private async cancelWorkflow(instanceId: string) {
        const instance = await this.env.MY_WORKFLOW.get(instanceId);
        await instance.terminate();
        this.setState({
            ...this.state,
            status: "idle",
            workflowInstanceId: null,
            lastUpdated: new Date().toISOString(),
        });
    }

    private async sendStatus(connection: Connection, instanceId: string) {
        const instance = await this.env.MY_WORKFLOW.get(instanceId);
        const status = await instance.status();
        connection.send(JSON.stringify({
            type: "workflow_status",
            instanceId,
            status: status.status,
            output: status.output,
        }));
    }
}
```

### 3. Workflow Implementation

```typescript
import { WorkflowEntrypoint, WorkflowStep } from "cloudflare:workers";
import type { WorkflowEvent } from "cloudflare:workers";

export class MyWorkflow extends WorkflowEntrypoint<Env, WorkflowParams> {
    async run(event: WorkflowEvent<WorkflowParams>, step: WorkflowStep) {
        const { taskId, agentId } = event.payload;

        // Get agent stub to call RPC methods
        const agent = this.env.WorkflowAgent.get(
            this.env.WorkflowAgent.idFromName(agentId)
        );

        try {
            // Step 1: Initialize
            await step.do("initialize", async () => {
                await agent.updateStep("Initializing...", 0);
                return { initialized: true };
            });

            // Step 2: Process items (example)
            const items = ["item-1", "item-2", "item-3"];

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const progress = Math.round(((i + 1) / items.length) * 80) + 10;

                await step.do(`process-${item}`, async () => {
                    // Update progress (broadcasts to all clients)
                    await agent.updateStep(`Processing ${item}...`, progress);

                    // Your processing logic here
                    const result = `Processed: ${item}`;

                    // Add to results
                    await agent.addResult({
                        item,
                        result,
                        timestamp: new Date().toISOString(),
                    });

                    return result;
                });

                // Sleep between steps (durable - survives restarts)
                if (i < items.length - 1) {
                    await step.sleep(`pause-${i}`, "2 seconds");
                }
            }

            // Step 3: Finalize
            const finalResult = await step.do("finalize", async () => {
                await agent.updateStep("Finalizing...", 95);
                return {
                    taskId,
                    completedAt: new Date().toISOString(),
                };
            });

            // Notify completion
            await step.do("notify-complete", async () => {
                await agent.completeWorkflow(finalResult);
            });

            return finalResult;

        } catch (error) {
            // Handle errors
            await step.do("handle-error", async () => {
                await agent.setWorkflowError(
                    error instanceof Error ? error.message : "Unknown error"
                );
            });
            throw error;
        }
    }
}
```

### 4. Frontend Implementation

```typescript
import { useAgent } from "agents/react";
import { useState } from "react";

type WorkflowState = {
    status: "idle" | "running" | "paused" | "complete" | "error";
    currentStep: string | null;
    progress: number;
    results: unknown[];
    workflowInstanceId: string | null;
    error: string | null;
};

export function WorkflowDemo() {
    const [sessionId] = useState(() => crypto.randomUUID());
    const [state, setState] = useState<WorkflowState>({
        status: "idle",
        currentStep: null,
        progress: 0,
        results: [],
        workflowInstanceId: null,
        error: null,
    });

    const agent = useAgent({
        agent: "workflow-agent", // kebab-case of class name
        name: sessionId,

        // Called whenever agent.setState() is called
        // This is the magic - workflow updates flow here automatically
        onStateUpdate: (newState: WorkflowState) => {
            setState(newState);
        },

        // Handle other message types
        onMessage: (message) => {
            const data = JSON.parse(message.data);
            if (data.type === "connected" && data.state) {
                setState(data.state);
            }
            if (data.type === "workflow_started") {
                console.log("Workflow started:", data.instanceId);
            }
            if (data.type === "error") {
                console.error("Error:", data.message);
            }
        },

        onOpen: () => console.log("Connected"),
        onClose: () => console.log("Disconnected"),
    });

    const startWorkflow = () => {
        agent.send(JSON.stringify({
            type: "start",
            params: { customData: "value" },
        }));
    };

    const pauseWorkflow = () => {
        if (state.workflowInstanceId) {
            agent.send(JSON.stringify({
                type: "pause",
                instanceId: state.workflowInstanceId,
            }));
        }
    };

    const resumeWorkflow = () => {
        if (state.workflowInstanceId) {
            agent.send(JSON.stringify({
                type: "resume",
                instanceId: state.workflowInstanceId,
            }));
        }
    };

    const cancelWorkflow = () => {
        if (state.workflowInstanceId) {
            agent.send(JSON.stringify({
                type: "cancel",
                instanceId: state.workflowInstanceId,
            }));
        }
    };

    return (
        <div>
            <div>Status: {state.status}</div>
            <div>Step: {state.currentStep}</div>
            <div>Progress: {state.progress}%</div>
            <progress value={state.progress} max={100} />

            <div>
                <button onClick={startWorkflow} disabled={state.status === "running"}>
                    Start
                </button>
                <button onClick={pauseWorkflow} disabled={state.status !== "running"}>
                    Pause
                </button>
                <button onClick={resumeWorkflow} disabled={state.status !== "paused"}>
                    Resume
                </button>
                <button onClick={cancelWorkflow} disabled={state.status === "idle"}>
                    Cancel
                </button>
            </div>

            <h3>Results ({state.results.length})</h3>
            <ul>
                {state.results.map((result, i) => (
                    <li key={i}>{JSON.stringify(result)}</li>
                ))}
            </ul>

            {state.error && <div className="error">{state.error}</div>}
        </div>
    );
}
```

---

## Configuration

### wrangler.jsonc

```jsonc
{
    "$schema": "node_modules/wrangler/config-schema.json",
    "name": "my-workflow-app",
    "compatibility_date": "2025-01-08",
    "compatibility_flags": ["nodejs_compat"],
    "main": "./workers/app.ts",

    // Durable Object bindings
    "durable_objects": {
        "bindings": [
            {
                "name": "WorkflowAgent",
                "class_name": "WorkflowAgent"
            }
        ]
    },

    // SQLite migrations for agents
    "migrations": [
        {
            "tag": "v1",
            "new_sqlite_classes": ["WorkflowAgent"]
        }
    ],

    // Workflow bindings
    "workflows": [
        {
            "name": "my-workflow",
            "binding": "MY_WORKFLOW",
            "class_name": "MyWorkflow"
        }
    ]
}
```

### workers/app.ts

```typescript
import { Hono } from "hono";
import { routeAgentRequest } from "agents";
import { WorkflowAgent, MyWorkflow } from "./agents/WorkflowAgent";

const app = new Hono<{ Bindings: Env }>();

// Agent WebSocket routing (must be before catch-all)
app.all("/agents/*", async (c) => {
    return (
        (await routeAgentRequest(c.req.raw, c.env)) ||
        c.json({ error: "Agent not found" }, 404)
    );
});

// Export classes (required for Cloudflare)
export { WorkflowAgent, MyWorkflow };

export default app;
```

### Env Types (after running `pnpm wrangler types`)

```typescript
interface Env {
    WorkflowAgent: DurableObjectNamespace<WorkflowAgent>;
    MY_WORKFLOW: Workflow<WorkflowParams>;
}
```

---

## Workflow Instance Methods

The WorkflowInstance returned from `env.MY_WORKFLOW.get(id)` provides these methods:

| Method | Description |
|--------|-------------|
| `status()` | Get current status: queued, running, paused, errored, complete, waiting, terminated |
| `pause()` | Halt a running workflow |
| `resume()` | Resume a paused workflow |
| `terminate()` | Stop and terminate workflow |
| `restart()` | Restart from beginning |
| `sendEvent(options)` | Send event to workflow (for `waitForEvent`) |

```typescript
const instance = await this.env.MY_WORKFLOW.get(instanceId);

// Check status
const { status, output, error } = await instance.status();

// Control workflow
await instance.pause();
await instance.resume();
await instance.terminate();
await instance.restart();

// Send event (workflow must call step.waitForEvent)
await instance.sendEvent({
    type: "user-approval",
    payload: { approved: true },
});
```

---

## Step Methods

Inside the workflow's `run()` method:

| Method | Description |
|--------|-------------|
| `step.do(name, fn)` | Execute a durable step (retriable) |
| `step.sleep(name, duration)` | Sleep for duration (durable) |
| `step.sleepUntil(name, timestamp)` | Sleep until timestamp |
| `step.waitForEvent(name, options)` | Wait for external event |

```typescript
async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    // Durable step - automatically retried on failure
    const result = await step.do("process", async () => {
        return await someOperation();
    });

    // Durable sleep - survives worker restarts
    await step.sleep("delay", "30 seconds");

    // Wait for external event
    const approval = await step.waitForEvent("wait-approval", {
        type: "user-approval",
        timeout: "24 hours",
    });

    if (approval.payload.approved) {
        // Continue...
    }
}
```

---

## Error Handling Patterns

### Retry Configuration

```typescript
await step.do("risky-operation", {
    retries: {
        limit: 3,
        delay: "5 seconds",
        backoff: "exponential",
    },
}, async () => {
    return await riskyOperation();
});
```

### Graceful Error Handling

```typescript
async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const agent = this.env.WorkflowAgent.get(/* ... */);

    try {
        // Workflow steps...
    } catch (error) {
        // Always notify agent of errors
        await step.do("notify-error", async () => {
            await agent.setWorkflowError(
                error instanceof Error ? error.message : "Unknown error"
            );
        });
        throw error; // Re-throw to mark workflow as failed
    }
}
```

---

## Common Patterns

### Pattern: Progress Updates

```typescript
// In Workflow
for (let i = 0; i < items.length; i++) {
    const progress = Math.round(((i + 1) / items.length) * 100);

    await step.do(`item-${i}`, async () => {
        await agent.updateStep(`Processing ${i + 1}/${items.length}`, progress);
        // Process item...
    });
}
```

### Pattern: User Approval

```typescript
// In Workflow
await step.do("request-approval", async () => {
    await agent.updateStep("Waiting for approval...");
    // Send notification to user
});

const approval = await step.waitForEvent("wait-approval", {
    type: "approval",
    timeout: "7 days",
});

// In Agent (when user approves)
async approveWorkflow(instanceId: string) {
    const instance = await this.env.MY_WORKFLOW.get(instanceId);
    await instance.sendEvent({
        type: "approval",
        payload: { approved: true },
    });
}
```

### Pattern: Scheduled Workflow Check

```typescript
// In Agent - check workflow status periodically
async checkWorkflowStatus(instanceId: string) {
    const instance = await this.env.MY_WORKFLOW.get(instanceId);
    const status = await instance.status();

    if (status.status === "complete") {
        this.setState({
            ...this.state,
            status: "complete",
            results: [status.output],
        });
    }
}
```

---

## Best Practices

1. **Always Pass agentId to Workflow**
   ```typescript
   await this.env.MY_WORKFLOW.create({
       params: {
           agentId: this.name, // Required for callback
           // ...other params
       },
   });
   ```

2. **Agent is the Only Gateway**
   - Never expose workflow directly to clients
   - All communication flows through the agent

3. **Keep Steps Idempotent**
   - Steps may be retried; design accordingly
   - Use unique IDs for operations

4. **Handle Workflow Completion**
   - Always notify agent when workflow completes or fails
   - Use `step.do("notify-complete", ...)` as final step

5. **Use Meaningful Step Names**
   - Step names appear in Cloudflare dashboard
   - Makes debugging easier

6. **Limit State Size**
   - Agent state is broadcast to all clients
   - Keep results array bounded if processing many items

---

## Troubleshooting

### Error: "Property 'MY_WORKFLOW' does not exist on type 'Env'"

**Solution:** Run `pnpm wrangler types` after adding workflow to wrangler.jsonc.

### Error: WebSocket not receiving updates

**Cause:** Workflow not calling agent RPC methods.

**Solution:** Ensure workflow gets agent stub and calls `agent.updateStep()`, etc.

### Error: Workflow starts but never updates

**Cause:** Wrong agentId passed to workflow.

**Solution:** Use `this.name` (agent's name) as agentId:
```typescript
params: { agentId: this.name }
```

### Error: "Workflow instance not found"

**Cause:** Instance terminated or never created.

**Solution:** Store instanceId in agent state and check before operations.

---

## Boilerplate Template

Use the boilerplate at `workers/agents/DurableWorkflow.ts` as a starting point:

1. Copy the file to a new location
2. Rename classes and types
3. Add bindings to wrangler.jsonc
4. Export classes from workers/app.ts
5. Run `pnpm wrangler types`

---

## Dependencies

```json
{
    "dependencies": {
        "agents": "^0.2.23",
        "hono": "4.8.2"
    }
}
```

---

## References

- [Cloudflare Workflows Documentation](https://developers.cloudflare.com/workflows/)
- [Run Workflows from Agents](https://developers.cloudflare.com/agents/api-reference/run-workflows/)
- [Workflows Workers API](https://developers.cloudflare.com/workflows/build/workers-api/)
- [Cloudflare Agents Documentation](https://developers.cloudflare.com/agents/)
