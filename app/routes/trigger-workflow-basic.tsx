import { useState } from "react";
import { useNavigate, isRouteErrorResponse } from "react-router";
import { useAgent } from "agents/react";
import type { Route } from "./+types/trigger-workflow-basic";
import { generateSessionId } from "~/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  ArrowLeft,
  Play,
  Info,
  Workflow,
  MessageCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { cn } from "~/lib/utils";

// Type for the agent state (matches WorkflowAgent's GreetingState)
type GreetingState = {
  status: "idle" | "running" | "complete" | "error";
  currentGreeting: string | null;
  greetings: string[];
  workflowInstanceId: string | null;
  name: string | null;
  error: string | null;
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Workflow Trigger Demo" },
    { name: "description", content: "Trigger Cloudflare Workflows via WebSocket" },
  ];
}

export function loader() {
  return { sessionId: generateSessionId() };
}

export default function TriggerWorkflowPage({
  loaderData,
}: Route.ComponentProps) {
  const navigate = useNavigate();
  const { sessionId } = loaderData;

  const [name, setName] = useState("World");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Agent state received via WebSocket
  const [agentState, setAgentState] = useState<GreetingState>({
    status: "idle",
    currentGreeting: null,
    greetings: [],
    workflowInstanceId: null,
    name: null,
    error: null,
  });

  // Use the Cloudflare useAgent hook to connect to WorkflowAgent
  const agent = useAgent({
    agent: "workflow-agent",
    name: sessionId,
    onStateUpdate: (state: GreetingState) => {
      // This callback is called whenever the agent's state changes
      setAgentState(state);
    },
    onMessage: (message) => {
      try {
        const data = JSON.parse(message.data);

        // Handle initial connection message
        if (data.type === "connected") {
          if (data.state) {
            setAgentState(data.state);
          }
        }

        // Handle errors
        if (data.type === "error") {
          setError(data.message);
        }
      } catch {
        // Ignore non-JSON messages
      }
    },
    onOpen: () => {
      console.log("Connected to WorkflowAgent:", sessionId);
      setIsConnected(true);
      setError(null);
    },
    onClose: () => {
      console.log("Disconnected from WorkflowAgent");
      setIsConnected(false);
    },
    onError: (err) => {
      console.error("WebSocket error:", err);
      setError("Connection failed");
      setIsConnected(false);
    },
  });

  const handleStartWorkflow = () => {
    if (!agent || !isConnected) return;

    setError(null);

    // Send start message to trigger the workflow
    agent.send(
      JSON.stringify({
        type: "start",
        name: name.trim() || "World",
        greetingCount: 10, // Limit to 5 greetings for demo
      })
    );
  };

  const isRunning = agentState.status === "running";
  const isComplete = agentState.status === "complete";

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="border-b-2 border-stone-800 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="hover:bg-stone-100 border-2 border-transparent hover:border-stone-300 rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display text-2xl text-stone-800 flex items-center gap-2">
                <span className="w-8 h-8 bg-violet-400 border-2 border-stone-800 rounded-lg flex items-center justify-center shadow-[2px_2px_0_#2D2A26]">
                  <Workflow className="w-4 h-4 text-stone-800" />
                </span>
                Workflow Trigger
              </h1>
              <p className="font-body text-stone-500 text-sm">
                Cloudflare Workflows with real-time state updates
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-3 py-1 font-body text-xs shadow-[1px_1px_0_#A09A92]",
                isConnected
                  ? "bg-emerald-100 border border-emerald-300 text-emerald-700"
                  : "bg-stone-100 border border-stone-300 text-stone-600"
              )}
            >
              {isConnected ? "Connected" : "Disconnected"}
            </span>
            <span className="inline-flex items-center bg-stone-100 border border-stone-300 text-stone-600 rounded-full px-3 py-1 font-mono text-xs shadow-[1px_1px_0_#A09A92]">
              ID: {sessionId}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Info Notice */}
        <div className="p-4 rounded-xl bg-violet-50 border-2 border-violet-200 shadow-[2px_2px_0_#C4B5FD]">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
            <div className="font-body text-sm text-stone-700 space-y-1">
              <p className="font-semibold text-violet-800">How it works</p>
              <p>
                This demo triggers a{" "}
                <span className="font-semibold">Cloudflare Workflow</span> that
                emits different greetings every 2 seconds. The workflow updates
                the agent's state via RPC, which automatically broadcasts to all
                connected WebSocket clients.
              </p>
            </div>
          </div>
        </div>

        {/* Control Card */}
        <Card className="bg-white border-2 border-stone-800 rounded-2xl shadow-[4px_4px_0_#2D2A26]">
          <CardHeader>
            <CardTitle className="font-display text-xl text-stone-800 flex items-center gap-2">
              <Play className="w-5 h-5 text-violet-500" />
              Start Greeting Workflow
            </CardTitle>
            <CardDescription className="font-body text-stone-500">
              Enter your name and click the button to start the workflow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="font-body text-sm font-medium text-stone-700"
              >
                Your Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isRunning}
                placeholder="Enter your name..."
                className="w-full px-4 py-2 border-2 border-stone-300 rounded-xl font-body text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:bg-stone-100 disabled:cursor-not-allowed"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border-2 border-dashed border-rose-300 rounded-xl text-rose-700 font-body text-sm">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <p className="font-body text-xs text-stone-500">
                {isConnected
                  ? "Ready to start workflow"
                  : "Connecting to agent..."}
              </p>
              <Button
                onClick={handleStartWorkflow}
                disabled={!isConnected || isRunning}
                className="bg-violet-400 hover:bg-violet-500 text-stone-800 font-body font-semibold border-2 border-stone-800 rounded-xl shadow-[3px_3px_0_#2D2A26] hover:shadow-[2px_2px_0_#2D2A26] hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Workflow
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Greetings Display */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-display text-lg text-stone-800">
              Greetings from Workflow
            </h2>
            {agentState.workflowInstanceId && (
              <span className="font-mono text-xs text-stone-500">
                Workflow: {agentState.workflowInstanceId.slice(0, 8)}...
              </span>
            )}
          </div>

          <Card
            className={cn(
              "min-h-[200px] bg-white border-2 rounded-2xl transition-all",
              isRunning
                ? "border-violet-400 shadow-[4px_4px_0_#A78BFA]"
                : isComplete
                  ? "border-emerald-400 shadow-[4px_4px_0_#34D399]"
                  : "border-stone-800 shadow-[4px_4px_0_#2D2A26]"
            )}
          >
            <CardContent className="p-6">
              {agentState.greetings.length > 0 ? (
                <div className="space-y-3">
                  {agentState.greetings.map((greeting, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                        index === agentState.greetings.length - 1 && isRunning
                          ? "bg-violet-50 border-violet-300 animate-pulse"
                          : "bg-stone-50 border-stone-200"
                      )}
                    >
                      <span
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2",
                          index === agentState.greetings.length - 1 && isRunning
                            ? "bg-violet-200 border-violet-400 text-violet-700"
                            : "bg-stone-200 border-stone-400 text-stone-600"
                        )}
                      >
                        {index + 1}
                      </span>
                      <MessageCircle
                        className={cn(
                          "w-5 h-5",
                          index === agentState.greetings.length - 1 && isRunning
                            ? "text-violet-500"
                            : "text-stone-400"
                        )}
                      />
                      <span className="font-body text-stone-700 flex-1">
                        {greeting}
                      </span>
                      {!isRunning && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                  ))}

                  {isComplete && (
                    <div className="mt-4 p-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
                      <p className="font-body text-sm text-emerald-700 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Workflow completed successfully!
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-stone-400 py-12">
                  <Workflow className="w-12 h-12 mb-4 opacity-30" />
                  <p className="font-body text-sm">
                    {isConnected
                      ? "Click 'Start Workflow' to see greetings appear"
                      : "Connecting to agent..."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Technical Details */}
        <Card className="bg-stone-100 border-2 border-dashed border-stone-400 rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="font-body text-sm font-semibold uppercase tracking-wider text-stone-600 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Under the hood
            </CardTitle>
          </CardHeader>
          <CardContent className="font-body text-sm text-stone-600 space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-stone-300">
              <span className="inline-flex items-center bg-violet-100 border border-violet-300 text-violet-700 rounded-full px-2 py-0.5 text-xs font-semibold">
                1
              </span>
              <p>
                Client connects via{" "}
                <code className="text-xs bg-stone-200 px-1.5 py-0.5 rounded border border-stone-300">
                  useAgent()
                </code>{" "}
                to{" "}
                <code className="text-xs bg-stone-200 px-1.5 py-0.5 rounded border border-stone-300">
                  WorkflowAgent
                </code>
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-stone-300">
              <span className="inline-flex items-center bg-violet-100 border border-violet-300 text-violet-700 rounded-full px-2 py-0.5 text-xs font-semibold">
                2
              </span>
              <p>
                Agent triggers{" "}
                <code className="text-xs bg-stone-200 px-1.5 py-0.5 rounded border border-stone-300">
                  GreatingWorkflow
                </code>{" "}
                via{" "}
                <code className="text-xs bg-stone-200 px-1.5 py-0.5 rounded border border-stone-300">
                  env.GREATING_WORKFLOW.create()
                </code>
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-stone-300">
              <span className="inline-flex items-center bg-violet-100 border border-violet-300 text-violet-700 rounded-full px-2 py-0.5 text-xs font-semibold">
                3
              </span>
              <p>
                Workflow calls agent's RPC method{" "}
                <code className="text-xs bg-stone-200 px-1.5 py-0.5 rounded border border-stone-300">
                  agent.addGreeting()
                </code>{" "}
                after each step
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-stone-300">
              <span className="inline-flex items-center bg-violet-100 border border-violet-300 text-violet-700 rounded-full px-2 py-0.5 text-xs font-semibold">
                4
              </span>
              <p>
                Agent calls{" "}
                <code className="text-xs bg-stone-200 px-1.5 py-0.5 rounded border border-stone-300">
                  this.setState()
                </code>{" "}
                which broadcasts to all connected clients
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <Card className="max-w-md bg-white border-2 border-stone-800 rounded-2xl shadow-[4px_4px_0_#2D2A26]">
        <CardHeader>
          <CardTitle className="font-display text-xl text-stone-800">
            Something went wrong
          </CardTitle>
          <CardDescription className="font-body text-stone-500">
            {isRouteErrorResponse(error)
              ? `${error.status}: ${error.statusText}`
              : error instanceof Error
                ? error.message
                : "An unexpected error occurred"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button
            onClick={() => window.location.reload()}
            className="bg-violet-400 hover:bg-violet-500 text-stone-800 font-body font-semibold border-2 border-stone-800 rounded-xl shadow-[3px_3px_0_#2D2A26]"
          >
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="border-2 border-stone-800 rounded-xl"
          >
            Go Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
