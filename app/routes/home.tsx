import { useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/home";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { ArrowRight, Zap } from "lucide-react";
import { cn } from "~/lib/utils";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "AI Agents Integration Patterns" },
    { name: "description", content: "Cloudflare Agents + Vercel AI SDK Demo" },
  ];
}

type AgentType = "research" | "support";
type ColorTheme = "blue" | "orange" | "purple" | "emerald";

export default function Home() {
  const navigate = useNavigate();
  const [selectedAgents, setSelectedAgents] = useState<
    Record<string, AgentType>
  >({
    websocket: "research",
    apiRoute: "research",
    rpcMethod: "research",
    autoRouted: "research",
  });

  const handleAgentChange = (pattern: string, agent: AgentType) => {
    setSelectedAgents((prev) => ({ ...prev, [pattern]: agent }));
  };

  const handleStart = (pattern: string) => {
    const agent = selectedAgents[pattern];
    const routes: Record<string, string> = {
      websocket: `/direct-agent?agent=${agent}`,
      apiRoute: `/http-streaming?agent=${agent}`,
      rpcMethod: `/http-streaming-initiate?agent=${agent}`,
      autoRouted: `/http-direct?agent=${agent}`,
    };
    navigate(routes[pattern]);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Hero Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Agent Integration Patterns
              </h1>
              <p className="text-muted-foreground mt-1 text-sm max-w-2xl">
                Explore four architectural patterns for integrating Cloudflare
                Agents with the Vercel AI SDK.
              </p>
            </div>
            <div className="hidden md:block">
              <Badge
                variant="secondary"
                className="text-xs px-2.5 py-0.5 font-normal"
              >
                Cloudflare Workers + Hono + React Router
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-12">
        {/* Intro Section */}
        <section className="max-w-3xl">
          <p className="text-sm text-muted-foreground leading-relaxed">
            This educational guide demonstrates different trade-offs for
            control, simplicity, and real-time capabilities when building AI
            agents. Select a pattern below to see it in action.
          </p>
        </section>

        {/* Patterns Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Pattern 1: WebSocket Real-time */}
          <PatternCard
            id="websocket"
            number={1}
            title="WebSocket Real-time"
            subtitle="Bidirectional streaming via persistent connection"
            selectedAgent={selectedAgents.websocket}
            onAgentChange={(agent) => handleAgentChange("websocket", agent)}
            onStart={() => handleStart("websocket")}
            frontendHook="useAgent"
            backendHandler="onMessage()"
            endpoint="/agents/:agent/:id"
            description="Establishes a persistent WebSocket connection between the frontend and agent. Messages flow bidirectionally, enabling real-time updates and state synchronization. The connection automatically handles reconnection on network interruption."
            lifecycle={[
              {
                step: "Connect",
                desc: "useAgent() establishes WebSocket to /agents/:agent/:id",
              },
              {
                step: "Route",
                desc: "routeAgentRequest() upgrades to WebSocket, routes to Agent",
              },
              {
                step: "Message",
                desc: "Frontend sends JSON message via connection.send()",
              },
              {
                step: "Process",
                desc: "Agent.onMessage() receives and processes the message",
              },
              {
                step: "Stream",
                desc: "Agent streams response chunks via connection.send()",
              },
            ]}
            characteristics={[
              { label: "Transport", value: "WebSocket (persistent)" },
              { label: "Direction", value: "Bidirectional" },
              { label: "State Sync", value: "Built-in via setState" },
              { label: "Reconnection", value: "Automatic" },
            ]}
            useCase="Best for chat interfaces, collaborative features, or any UI requiring real-time updates and state synchronization across clients."
            badgeVariant="default"
            techTags={["WebSocket", "Real-time", "Stateful"]}
            color="blue"
          />

          {/* Pattern 2: Custom API Route */}
          <PatternCard
            id="apiRoute"
            number={2}
            title="Custom API Route"
            subtitle="HTTP streaming through Hono middleware"
            selectedAgent={selectedAgents.apiRoute}
            onAgentChange={(agent) => handleAgentChange("apiRoute", agent)}
            onStart={() => handleStart("apiRoute")}
            frontendHook="useCompletion"
            backendHandler="onRequest()"
            endpoint="/api/research"
            description="The traditional REST approach where a custom Hono route acts as an intermediary. This pattern provides full control over request processing, authentication, and response formatting before reaching the agent."
            lifecycle={[
              {
                step: "Request",
                desc: "useCompletion() POSTs to custom /api/research endpoint",
              },
              {
                step: "Middleware",
                desc: "Hono route processes request (auth, validation, etc.)",
              },
              {
                step: "Invoke",
                desc: "getAgentByName() retrieves agent, agent.fetch() called",
              },
              {
                step: "Handler",
                desc: "Agent.onRequest() processes and returns streaming response",
              },
              {
                step: "Stream",
                desc: "Response streams back through Hono to frontend",
              },
            ]}
            characteristics={[
              { label: "Transport", value: "HTTP (request/response)" },
              { label: "Direction", value: "Unidirectional" },
              { label: "Middleware", value: "Full Hono support" },
              { label: "Control", value: "Maximum flexibility" },
            ]}
            useCase="Best when you need authentication middleware, request validation, rate limiting, or custom response formatting before agent processing."
            badgeVariant="secondary"
            techTags={["HTTP", "Hono Middleware", "REST"]}
            color="orange"
          />

          {/* Pattern 3: RPC Method Invocation */}
          <PatternCard
            id="rpcMethod"
            number={3}
            title="Direct RPC Method"
            subtitle="Calling custom agent methods directly"
            selectedAgent={selectedAgents.rpcMethod}
            onAgentChange={(agent) => handleAgentChange("rpcMethod", agent)}
            onStart={() => handleStart("rpcMethod")}
            frontendHook="useCompletion"
            backendHandler="initiateAgent()"
            endpoint="/api/research/initiate"
            description="Demonstrates calling custom-named methods on the agent directly via RPC, rather than using the built-in onRequest handler. This allows defining multiple entry points with different behaviors on a single agent."
            lifecycle={[
              {
                step: "Request",
                desc: "useCompletion() POSTs to /api/research/initiate",
              },
              { step: "Middleware", desc: "Hono route processes request" },
              {
                step: "RPC Call",
                desc: "agent.initiateAgent(prompt) called directly",
              },
              {
                step: "Execute",
                desc: "Custom method creates VercelAgent and streams",
              },
              {
                step: "Return",
                desc: "Method returns Response, streams to frontend",
              },
            ]}
            characteristics={[
              { label: "Transport", value: "HTTP (request/response)" },
              { label: "Method Type", value: "Custom RPC" },
              { label: "Flexibility", value: "Multiple entry points" },
              { label: "Serialization", value: "Must return Response" },
            ]}
            useCase="Best when you need multiple distinct operations on one agent, or want cleaner method signatures without Request object parsing."
            badgeVariant="secondary"
            techTags={["RPC", "Method Call", "Custom Logic"]}
            color="purple"
          />

          {/* Pattern 4: Auto-Routed Direct */}
          <PatternCard
            id="autoRouted"
            number={4}
            title="Auto-Routed Direct"
            subtitle="Simplest path - no custom API route needed"
            selectedAgent={selectedAgents.autoRouted}
            onAgentChange={(agent) => handleAgentChange("autoRouted", agent)}
            onStart={() => handleStart("autoRouted")}
            frontendHook="useCompletion"
            backendHandler="onRequest()"
            endpoint="/agents/:agent/:id"
            description="The simplest integration pattern where the frontend communicates directly with the agent using the built-in routing. No custom Hono routes are required - routeAgentRequest() handles everything automatically."
            lifecycle={[
              {
                step: "Request",
                desc: "useCompletion() POSTs directly to /agents/:agent/:id",
              },
              {
                step: "Auto-Route",
                desc: "routeAgentRequest() matches URL pattern",
              },
              {
                step: "Dispatch",
                desc: "Request forwarded to Agent.onRequest()",
              },
              {
                step: "Process",
                desc: "Agent processes and returns streaming response",
              },
              { step: "Stream", desc: "Response streams directly to frontend" },
            ]}
            characteristics={[
              { label: "Transport", value: "HTTP (request/response)" },
              { label: "Custom Route", value: "Not required" },
              { label: "Complexity", value: "Minimal" },
              { label: "Trade-off", value: "Less middleware control" },
            ]}
            useCase="Best for simple use cases without authentication requirements, or when you want the fastest path to a working agent integration."
            badgeVariant="secondary"
            techTags={["Direct Access", "Zero-Config", "File-System Routing"]}
            color="emerald"
          />
        </div>
      </main>

      <footer className="border-t py-6 text-center text-muted-foreground text-sm">
        <p>
          Built with Cloudflare Workers, Hono, React Router 7, and Vercel AI
          SDK.
        </p>
      </footer>
    </div>
  );
}

interface PatternCardProps {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  selectedAgent: AgentType;
  onAgentChange: (agent: AgentType) => void;
  onStart: () => void;
  frontendHook: string;
  backendHandler: string;
  endpoint: string;
  description: string;
  lifecycle: { step: string; desc: string }[];
  characteristics: { label: string; value: string }[];
  useCase: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  techTags?: string[];
  color: ColorTheme;
}

const colorStyles: Record<
  ColorTheme,
  {
    card: string;
    flow: string;
    alert: string;
    icon: string;
    tag: string;
  }
> = {
  blue: {
    card: "border-blue-500/20 bg-blue-50/10 dark:bg-blue-900/10",
    flow: "bg-blue-100/40 dark:bg-blue-900/30 border-blue-200/60 dark:border-blue-800/60",
    alert:
      "bg-blue-100/50 dark:bg-blue-900/30 border-blue-200/60 dark:border-blue-800/60 text-blue-900 dark:text-blue-100",
    icon: "text-blue-600 dark:text-blue-400",
    tag: "bg-blue-500/10 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700",
  },
  orange: {
    card: "border-orange-500/20 bg-orange-50/10 dark:bg-orange-900/10",
    flow: "bg-orange-100/40 dark:bg-orange-900/30 border-orange-200/60 dark:border-orange-800/60",
    alert:
      "bg-orange-100/50 dark:bg-orange-900/30 border-orange-200/60 dark:border-orange-800/60 text-orange-900 dark:text-orange-100",
    icon: "text-orange-600 dark:text-orange-400",
    tag: "bg-orange-500/10 text-orange-700 border-orange-300 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-700",
  },
  purple: {
    card: "border-purple-500/20 bg-purple-50/10 dark:bg-purple-900/10",
    flow: "bg-purple-100/40 dark:bg-purple-900/30 border-purple-200/60 dark:border-purple-800/60",
    alert:
      "bg-purple-100/50 dark:bg-purple-900/30 border-purple-200/60 dark:border-purple-800/60 text-purple-900 dark:text-purple-100",
    icon: "text-purple-600 dark:text-purple-400",
    tag: "bg-purple-500/10 text-purple-700 border-purple-300 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-700",
  },
  emerald: {
    card: "border-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-900/10",
    flow: "bg-emerald-100/40 dark:bg-emerald-900/30 border-emerald-200/60 dark:border-emerald-800/60",
    alert:
      "bg-emerald-100/50 dark:bg-emerald-900/30 border-emerald-200/60 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-100",
    icon: "text-emerald-600 dark:text-emerald-400",
    tag: "bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700",
  },
};

function PatternCard({
  id,
  number,
  title,
  subtitle,
  selectedAgent,
  onAgentChange,
  onStart,
  frontendHook,
  backendHandler,
  endpoint,
  description,
  lifecycle,
  characteristics,
  useCase,
  badgeVariant = "secondary",
  techTags = [],
  color,
}: PatternCardProps) {
  const styles = colorStyles[color];

  return (
    <Card
      className={cn(
        "flex flex-col h-full border-2 hover:border-primary/20 transition-all shadow-sm",
        styles.card
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge
                variant={badgeVariant}
                className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0 text-xs"
              >
                {number}
              </Badge>
              <CardTitle className="text-xl">{title}</CardTitle>
            </div>
            <CardDescription className="text-sm font-medium">
              {subtitle}
            </CardDescription>
          </div>
        </div>
        {/* Tech Tags */}
        {techTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-2">
            {techTags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className={cn(
                  "text-[10px] px-2 py-0 h-5 rounded-full border",
                  styles.tag
                )}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        {/* Visual Flow */}
        <div
          className={cn(
            "rounded-lg p-3 text-xs font-mono border flex items-center justify-between gap-2 overflow-x-auto",
            styles.flow
          )}
        >
          <Badge
            variant="secondary"
            className="bg-background/80 whitespace-nowrap shadow-sm"
          >
            {frontendHook}
          </Badge>
          <ArrowRight className={cn("w-3 h-3 shrink-0", styles.icon)} />
          <Badge
            variant="secondary"
            className="bg-background/80 whitespace-nowrap shadow-sm"
          >
            {endpoint}
          </Badge>
          <ArrowRight className={cn("w-3 h-3 shrink-0", styles.icon)} />
          <Badge
            variant="secondary"
            className="bg-background/80 whitespace-nowrap shadow-sm"
          >
            {backendHandler}
          </Badge>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-9">
            <TabsTrigger value="overview" className="text-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger value="lifecycle" className="text-xs">
              Lifecycle
            </TabsTrigger>
            <TabsTrigger value="details" className="text-xs">
              Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
            <Alert className={cn(styles.alert)}>
              <Zap className={cn("h-4 w-4", styles.icon)} />
              <AlertTitle className="text-xs font-semibold">
                When to Use
              </AlertTitle>
              <AlertDescription className="text-xs mt-1 opacity-90">
                {useCase}
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="lifecycle" className="mt-4">
            <div className="relative border-l border-muted pl-4 space-y-4 py-1">
              {lifecycle.map((item, i) => (
                <div key={i} className="relative">
                  <div
                    className={cn(
                      "absolute -left-[21px] top-1.5 h-2 w-2 rounded-full ring-4 ring-background",
                      styles.icon
                        .replace("text-", "bg-")
                        .replace("dark:text-", "dark:bg-")
                    )}
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold leading-none">
                      {item.step}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="details" className="mt-4">
            <div className="grid gap-2">
              {characteristics.map((char, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center text-sm p-2 rounded-md bg-background/40 border border-transparent hover:border-border transition-colors"
                >
                  <span className="text-muted-foreground text-xs">
                    {char.label}
                  </span>
                  <span className="font-medium font-mono text-xs">
                    {char.value}
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <Separator className="opacity-50" />

      <CardFooter className="pt-4 gap-3 bg-muted/5">
        <Select
          value={selectedAgent}
          onValueChange={(val) => onAgentChange(val as AgentType)}
        >
          <SelectTrigger className="w-[180px] bg-background h-9 text-xs">
            <SelectValue placeholder="Select Agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="research">Research Agent</SelectItem>
            <SelectItem value="support" disabled>
              Support Agent (Soon)
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={onStart}
          disabled={selectedAgent === "support"}
          className="flex-1 h-9 text-xs"
          size="sm"
        >
          Try Pattern
          <ArrowRight className="ml-2 w-3 h-3" />
        </Button>
      </CardFooter>
    </Card>
  );
}
