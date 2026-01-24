import { useState } from "react";
import { useNavigate, isRouteErrorResponse } from "react-router";
import type { Route } from "./+types/home";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  ArrowRight,
  Zap,
  Code,
  Sparkles,
  Bot,
  Monitor,
  Lock,
  MousePointer2,
  Rocket,
  Cloud,
  Database,
} from "lucide-react";
import { cn } from "~/lib/utils";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "AI Agents Integration Patterns" },
    { name: "description", content: "Cloudflare Agents + Vercel AI SDK Demo" },
  ];
}

type AgentType = "research" | "support";

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
    <div className="min-h-screen bg-stone-50">
      {/* Hero Header */}
      <header className="border-b-2 border-stone-800 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl md:text-5xl text-stone-800 tracking-tight transform -rotate-1">
                Agent Routing Patterns
              </h1>
              <p className="font-body text-stone-600 mt-2 text-base max-w-2xl">
                Four Ways to Connect Your Frontend to AI Agents on Cloudflare
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="inline-flex items-center bg-amber-100 border-2 border-amber-400 text-stone-800 rounded-full px-4 py-2 font-body text-sm shadow-[2px_2px_0_#2D2A26]">
                <Cloud className="w-4 h-4 mr-2" />
                Cloudflare + Vercel AI + Hono
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-16">
        {/* Intro Section */}
        <section className="max-w-3xl">
          <div className="bg-white border-2 border-stone-800 rounded-2xl p-6 shadow-[4px_4px_0_#2D2A26] transform rotate-[0.3deg]">
            <p className="font-body text-stone-600 leading-relaxed text-lg">
              This educational guide demonstrates different trade-offs for
              control, simplicity, and real-time capabilities when building AI
              agents. Select a pattern below to see it in action.
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            HTTP PATTERNS SECTION
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-400 border-2 border-stone-800 rounded-xl flex items-center justify-center shadow-[3px_3px_0_#2D2A26]">
              <ArrowRight className="w-6 h-6 text-stone-800" />
            </div>
            <div>
              <h2 className="font-display text-3xl text-stone-800 transform -rotate-[0.5deg]">
                HTTP Patterns
              </h2>
              <p className="font-body text-stone-600">
                Request-response streaming, ordered from simplest to most
                flexible
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Pattern 1: Zero-Config HTTP */}
            <PatternCard
              number={1}
              title="Zero-Config HTTP"
              subtitle="Simplest path — no custom routes needed"
              icon={<Rocket className="w-5 h-5" />}
              selectedAgent={selectedAgents.autoRouted}
              onAgentChange={(agent) => handleAgentChange("autoRouted", agent)}
              onStart={() => handleStart("autoRouted")}
              frontendHook="useCompletion"
              backendHandler="onRequest()"
              endpoint="/agents/:agent/:id"
              description="The simplest integration pattern where the frontend communicates directly with the agent using the built-in routing. No custom Hono routes are required."
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
                  step: "Stream",
                  desc: "Response streams directly to frontend",
                },
              ]}
              useCase="Best for prototypes and simple use cases without authentication requirements."
              tags={["Zero-Config", "Auto-Routed", "Quick Start"]}
              accentColor="golden"
            />

            {/* Pattern 2: HTTP with Middleware */}
            <PatternCard
              number={2}
              title="HTTP with Middleware"
              subtitle="Full control via custom Hono routes"
              icon={<Lock className="w-5 h-5" />}
              selectedAgent={selectedAgents.apiRoute}
              onAgentChange={(agent) => handleAgentChange("apiRoute", agent)}
              onStart={() => handleStart("apiRoute")}
              frontendHook="useCompletion"
              backendHandler="onRequest()"
              endpoint="/api/research"
              description="The production-ready approach where a custom Hono route acts as an intermediary with full control over authentication, rate limiting, and validation."
              lifecycle={[
                {
                  step: "Request",
                  desc: "useCompletion() POSTs to custom /api/research",
                },
                {
                  step: "Middleware",
                  desc: "Hono route processes (auth, validation)",
                },
                { step: "Invoke", desc: "getAgentByName() retrieves agent" },
                { step: "Stream", desc: "Response streams through Hono" },
              ]}
              useCase="Best when you need authentication middleware, request validation, or rate limiting."
              tags={["Middleware", "Auth Ready", "Production"]}
              accentColor="golden"
            />

            {/* Pattern 3: Custom Agent Methods */}
            <PatternCard
              number={3}
              title="Custom Agent Methods"
              subtitle="Named RPC methods for complex agents"
              icon={<MousePointer2 className="w-5 h-5" />}
              selectedAgent={selectedAgents.rpcMethod}
              onAgentChange={(agent) => handleAgentChange("rpcMethod", agent)}
              onStart={() => handleStart("rpcMethod")}
              frontendHook="useCompletion"
              backendHandler="initiateAgent()"
              endpoint="/api/research/initiate"
              description="Call custom-named methods on the agent directly via RPC. This allows multiple entry points like searchFlights(), bookHotel(), getItinerary()."
              lifecycle={[
                {
                  step: "Request",
                  desc: "useCompletion() POSTs to /api/research/initiate",
                },
                {
                  step: "RPC Call",
                  desc: "agent.initiateAgent(prompt) called directly",
                },
                { step: "Execute", desc: "Custom method creates VercelAgent" },
                { step: "Return", desc: "Method returns streaming Response" },
              ]}
              useCase="Best when you need multiple distinct operations on one agent."
              tags={["RPC Methods", "Multi-Operation", "Advanced"]}
              accentColor="crimson"
            />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            WEBSOCKET PATTERNS SECTION
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-400 border-2 border-stone-800 rounded-xl flex items-center justify-center shadow-[3px_3px_0_#2D2A26]">
              <Zap className="w-6 h-6 text-stone-800" />
            </div>
            <div>
              <h2 className="font-display text-3xl text-stone-800 transform -rotate-[0.5deg]">
                WebSocket Patterns
              </h2>
              <p className="font-body text-stone-600">
                Persistent bidirectional connections for real-time communication
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Pattern 4: WebSocket Streaming */}
            <PatternCard
              number={4}
              title="WebSocket Streaming"
              subtitle="Bidirectional real-time connection"
              icon={<Zap className="w-5 h-5" />}
              selectedAgent={selectedAgents.websocket}
              onAgentChange={(agent) => handleAgentChange("websocket", agent)}
              onStart={() => handleStart("websocket")}
              frontendHook="useAgent"
              backendHandler="onMessage()"
              endpoint="/agents/:agent/:id"
              description="Establishes a persistent WebSocket connection enabling real-time updates and state synchronization with automatic reconnection."
              lifecycle={[
                { step: "Connect", desc: "useAgent() establishes WebSocket" },
                {
                  step: "Route",
                  desc: "routeAgentRequest() upgrades connection",
                },
                {
                  step: "Message",
                  desc: "Frontend sends via connection.send()",
                },
                { step: "Stream", desc: "Agent streams chunks back" },
              ]}
              useCase="Best for chat interfaces, collaborative features, or real-time state sync."
              tags={["WebSocket", "Real-time", "Stateful"]}
              accentColor="golden"
            />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            EXPLORE VERCEL AI FEATURES
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-500 border-2 border-stone-800 rounded-xl flex items-center justify-center shadow-[3px_3px_0_#2D2A26]">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-display text-3xl text-stone-800 transform -rotate-[0.5deg]">
                Explore Vercel AI Features
              </h2>
              <p className="font-body text-stone-600">
                Powerful AI SDK features that work seamlessly with Cloudflare
                Workers
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* streamObject Card */}
            <FeatureCard
              icon={<Code className="w-6 h-6 text-charcoal" />}
              title="streamObject()"
              badge="Structured Data"
              description="Stream structured JSON objects, arrays, and enums directly from LLM responses — no agents required."
              buttonText="Explore streamObject()"
              onClick={() => navigate("/object-streaming")}
              accentColor="golden"
            />

            {/* Generative UI Card */}
            <FeatureCard
              icon={<Sparkles className="w-6 h-6 text-charcoal" />}
              title="Generative UI"
              badge="Tool Rendering"
              description="Render dynamic React components from LLM tool calls — weather cards, stock tickers, and more."
              buttonText="Explore Generative UI"
              onClick={() => navigate("/generative-ui")}
              accentColor="crimson"
            />

            {/* TanStack Query Card */}
            <FeatureCard
              icon={<Database className="w-6 h-6 text-charcoal" />}
              title="TanStack Query"
              badge="Data Fetching"
              description="Powerful data synchronization with caching, optimistic updates, and WebSocket integration."
              buttonText="Explore TanStack Query"
              onClick={() => navigate("/tanstack-demo")}
              accentColor="crimson"
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-stone-800 bg-white py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="font-body text-stone-600">
            Built with{" "}
            <span className="font-semibold text-stone-800">
              Cloudflare Workers
            </span>
            , <span className="font-semibold text-stone-800">Hono</span>,{" "}
            <span className="font-semibold text-stone-800">React Router 7</span>
            , and{" "}
            <span className="font-semibold text-stone-800">Vercel AI SDK</span>.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PATTERN CARD COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

interface PatternCardProps {
  number: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  selectedAgent: AgentType;
  onAgentChange: (agent: AgentType) => void;
  onStart: () => void;
  frontendHook: string;
  backendHandler: string;
  endpoint: string;
  description: string;
  lifecycle: { step: string; desc: string }[];
  useCase: string;
  tags: string[];
  accentColor: "golden" | "crimson";
}

function PatternCard({
  number,
  title,
  subtitle,
  icon,
  selectedAgent,
  onAgentChange,
  onStart,
  frontendHook,
  backendHandler,
  endpoint,
  description,
  lifecycle,
  useCase,
  tags,
  accentColor,
}: PatternCardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "lifecycle">(
    "overview"
  );

  const accentStyles = {
    golden: {
      badge: "bg-amber-400 text-stone-900 border-stone-800",
      tagBg: "bg-amber-50 border-amber-300",
      flowBg: "bg-amber-100/60 border-amber-300",
    },
    crimson: {
      badge: "bg-rose-500 text-white border-stone-800",
      tagBg: "bg-rose-50 border-rose-300",
      flowBg: "bg-rose-100/60 border-rose-300",
    },
  };

  const styles = accentStyles[accentColor];

  return (
    <div className="bg-white border-2 border-stone-800 rounded-2xl shadow-[4px_4px_0_#2D2A26] hover:shadow-[6px_6px_0_#2D2A26] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start gap-3 mb-3">
          {/* Number + Icon combo */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "w-7 h-7 border-2 rounded-full flex items-center justify-center font-display font-bold text-sm shrink-0",
                styles.badge
              )}
            >
              {number}
            </span>
            <div className="w-9 h-9 bg-stone-100 border-2 border-stone-800 rounded-lg flex items-center justify-center shrink-0">
              {icon}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-2xl text-stone-800 leading-tight">
              {title}
            </h3>
            <p className="font-body text-stone-500 text-sm">{subtitle}</p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          {tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "inline-flex items-center rounded-full px-3 py-1 font-body text-xs text-stone-700 border shadow-[1px_1px_0_#A09A92]",
                styles.tagBg
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Flow Diagram - Inline */}
      <div className="px-6">
        <div
          className={cn(
            "rounded-xl px-3 py-2.5 border-2 flex items-center justify-between gap-1.5",
            styles.flowBg
          )}
        >
          <FlowBadge>{frontendHook}</FlowBadge>
          <ArrowRight className="w-3 h-3 text-stone-400 shrink-0" />
          <FlowBadge>{endpoint}</FlowBadge>
          <ArrowRight className="w-3 h-3 text-stone-400 shrink-0" />
          <FlowBadge>{backendHandler}</FlowBadge>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 py-4 flex-1">
        {/* Tab Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "px-4 py-2 rounded-lg font-body text-sm border-2 transition-all",
              activeTab === "overview"
                ? "bg-stone-800 text-white border-stone-800"
                : "bg-transparent text-stone-700 border-stone-300 hover:border-stone-800"
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("lifecycle")}
            className={cn(
              "px-4 py-2 rounded-lg font-body text-sm border-2 transition-all",
              activeTab === "lifecycle"
                ? "bg-stone-800 text-white border-stone-800"
                : "bg-transparent text-stone-700 border-stone-300 hover:border-stone-800"
            )}
          >
            Lifecycle
          </button>
        </div>

        {activeTab === "overview" ? (
          <div className="space-y-4">
            <p className="font-body text-stone-600 text-sm leading-relaxed">
              {description}
            </p>
            <div className="bg-stone-100 border-2 border-dashed border-stone-400 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-body font-semibold text-stone-800 text-xs uppercase tracking-wide mb-1">
                    When to Use
                  </p>
                  <p className="font-body text-stone-600 text-sm">{useCase}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative border-l-2 border-stone-300 pl-4 space-y-4">
            {lifecycle.map((item, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full bg-amber-400 border-2 border-stone-800" />
                <div>
                  <p className="font-body font-semibold text-stone-800 text-sm">
                    {item.step}
                  </p>
                  <p className="font-body text-stone-500 text-xs">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-6 pt-4 border-t-2 border-stone-200 bg-stone-50/50 flex items-center gap-3">
        <Select
          value={selectedAgent}
          onValueChange={(val) => onAgentChange(val as AgentType)}
        >
          <SelectTrigger className="w-[160px] bg-white border-2 border-stone-800 rounded-xl h-11 font-body text-sm shadow-[2px_2px_0_#2D2A26]">
            <SelectValue placeholder="Select Agent" />
          </SelectTrigger>
          <SelectContent className="border-2 border-stone-800 rounded-xl">
            <SelectItem value="research">Research Agent</SelectItem>
            <SelectItem value="support" disabled>
              Support Agent (Soon)
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={onStart}
          disabled={selectedAgent === "support"}
          className={cn(
            "flex-1 h-11 font-body font-semibold text-sm rounded-xl border-2 border-stone-800 shadow-[3px_3px_0_#2D2A26] hover:shadow-[2px_2px_0_#2D2A26] hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-[1px_1px_0_#2D2A26] active:translate-x-1 active:translate-y-1 transition-all",
            accentColor === "crimson"
              ? "bg-rose-500 text-white hover:bg-rose-600"
              : "bg-amber-400 text-stone-900 hover:bg-amber-500"
          )}
        >
          Try Pattern
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FLOW BADGE COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

function FlowBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-white border border-stone-700 rounded-md px-2 py-1 font-mono text-[10px] text-stone-800 whitespace-nowrap shadow-[1px_1px_0_#2D2A26]">
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FEATURE CARD COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  badge: string;
  description: string;
  buttonText: string;
  onClick: () => void;
  accentColor: "golden" | "crimson";
}

function FeatureCard({
  icon,
  title,
  badge,
  description,
  buttonText,
  onClick,
  accentColor,
}: FeatureCardProps) {
  const bgColor = accentColor === "golden" ? "bg-amber-100" : "bg-rose-100";
  const buttonColor =
    accentColor === "golden"
      ? "bg-amber-400 hover:bg-amber-500 text-stone-900"
      : "bg-rose-500 hover:bg-rose-600 text-white";

  return (
    <div
      className={cn(
        "bg-white border-2 border-stone-800 rounded-2xl shadow-[4px_4px_0_#2D2A26] hover:shadow-[6px_6px_0_#2D2A26] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
      )}
    >
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "w-12 h-12 rounded-xl border-2 border-stone-800 flex items-center justify-center shrink-0 shadow-[2px_2px_0_#2D2A26]",
              bgColor
            )}
          >
            {icon}
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-2xl text-stone-800 flex items-center gap-2">
              {title}
            </h3>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-3 py-0.5 font-body text-xs border shadow-[1px_1px_0_#A09A92]",
                bgColor,
                "text-stone-700 border-stone-300"
              )}
            >
              {badge}
            </span>
          </div>
        </div>

        <p className="font-body text-stone-600 text-sm leading-relaxed">
          {description}
        </p>

        <Button
          onClick={onClick}
          className={cn(
            "w-full h-11 font-body font-semibold text-sm rounded-xl border-2 border-stone-800 shadow-[3px_3px_0_#2D2A26] hover:shadow-[2px_2px_0_#2D2A26] hover:translate-x-0.5 hover:translate-y-0.5 transition-all",
            buttonColor
          )}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {buttonText}
          <ArrowRight className="ml-auto w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ERROR BOUNDARY
   ═══════════════════════════════════════════════════════════════════════════ */

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="max-w-md bg-white border-2 border-stone-800 rounded-2xl shadow-[4px_4px_0_#2D2A26] p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-500 border-2 border-stone-800 rounded-xl flex items-center justify-center shadow-[2px_2px_0_#2D2A26]">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-display text-2xl text-stone-800">
            Something went wrong
          </h1>
        </div>
        <p className="font-body text-stone-500">
          {isRouteErrorResponse(error)
            ? `${error.status}: ${error.statusText}`
            : error instanceof Error
              ? error.message
              : "An unexpected error occurred"}
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => window.location.reload()}
            className="bg-amber-400 hover:bg-amber-500 text-stone-800 font-body font-semibold border-2 border-stone-800 rounded-xl shadow-[3px_3px_0_#2D2A26]"
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
        </div>
      </div>
    </div>
  );
}
