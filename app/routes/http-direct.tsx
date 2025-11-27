import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useCompletion } from "@ai-sdk/react";
import type { Route } from "./+types/http-direct";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { ArrowLeft, Send, Sparkles, Terminal, Info, Zap } from "lucide-react";
import { cn } from "~/lib/utils";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "HTTP Direct Agent" },
    { name: "description", content: "Direct HTTP call to agent" },
  ];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 8);
}

export default function HttpDirectPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const agent = searchParams.get("agent") || "research";
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate ID once on page load
  const [sessionId] = useState<string>(() => generateId());
  const [prompt, setPrompt] = useState("");

  // Convert agent type to kebab-case class name
  const agentName = agent === "research" ? "research-agent" : "support-agent";

  // Use Vercel AI SDK's useCompletion hook
  const { completion, complete, isLoading, error } = useCompletion({
    api: `/agents/${agentName}/${sessionId}`,
    streamProtocol: "text",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    await complete(prompt.trim(), {
      body: {
        prompt: prompt.trim(),
      },
    });
  };

  // Auto-scroll to bottom of response
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [completion]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <span className="text-emerald-500">⚡</span>
                HTTP Direct to Agent
              </h1>
              <p className="text-muted-foreground text-xs">
                Pattern 4: Auto-Routed Access
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20"
            >
              {agent === "research" ? "Research Agent" : "Support Agent"}
            </Badge>
            <Badge variant="secondary" className="font-mono text-xs">
              ID: {sessionId}
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Input Area */}
        <Card className="border-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-900/5 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Prompt the Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Plan a trip to Tokyo - I need weather, flights, and hotels"
                className="w-full min-h-[120px] p-4 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all text-sm"
                disabled={isLoading}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Reload page for a new session ID
                </p>
                <Button
                  type="submit"
                  disabled={!prompt.trim() || isLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Streaming...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Response Area */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground px-1">
            Agent Response
          </h2>
          <Card
            className={cn(
              "min-h-[300px] transition-colors",
              isLoading
                ? "border-emerald-500/40 shadow-[0_0_15px_-3px_rgba(16,185,129,0.15)]"
                : "border-border"
            )}
          >
            <CardContent className="p-6">
              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive mb-4 text-sm">
                  {error.message}
                </div>
              )}

              {completion ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {completion}
                  </div>
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 py-12">
                  <Terminal className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm">Response will stream here via HTTP</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Technical Details */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-muted/30 border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Info className="w-4 h-4" />
                Under the hood
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-md bg-background/50 border">
                <Badge
                  variant="outline"
                  className="mt-0.5 bg-emerald-50/50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800"
                >
                  Client
                </Badge>
                <p>
                  Using{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded border">
                    useCompletion()
                  </code>{" "}
                  to POST directly to{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded border">
                    /agents/{agentName}/{sessionId}
                  </code>
                  .
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-md bg-background/50 border">
                <Badge
                  variant="outline"
                  className="mt-0.5 bg-emerald-50/50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800"
                >
                  Route
                </Badge>
                <p>
                  The{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded border">
                    routeAgentRequest()
                  </code>{" "}
                  middleware automatically routes this to the agent.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-emerald-50/10 dark:bg-emerald-900/5 border-emerald-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                API vs Direct
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="p-3 rounded-md bg-background/50 border border-emerald-100 dark:border-emerald-900/30">
                <span className="font-semibold text-xs text-muted-foreground block mb-1">
                  Standard API Pattern
                </span>
                <code className="text-xs text-muted-foreground">
                  /api/route
                </code>{" "}
                → <span className="text-muted-foreground/60">Hono</span> →{" "}
                <code className="text-xs text-muted-foreground">
                  agent.fetch()
                </code>
              </div>
              <div className="p-3 rounded-md bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <span className="font-semibold text-xs text-emerald-600 dark:text-emerald-400 block mb-1">
                  Direct Pattern
                </span>
                <code className="text-xs">/agents/name/id</code> →{" "}
                <span className="text-emerald-600/60 dark:text-emerald-400/60">
                  Auto Route
                </span>{" "}
                → <code className="text-xs">onRequest()</code>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
