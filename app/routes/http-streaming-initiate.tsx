import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useCompletion } from "@ai-sdk/react";
import type { Route } from "./+types/http-streaming-initiate";
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
    { title: "HTTP Streaming (Initiate) - REST API" },
    {
      name: "description",
      content: "HTTP-based agent streaming via initiateAgent",
    },
  ];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 8);
}

export default function HttpStreamingInitiatePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const agent = searchParams.get("agent") || "research";
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate ID once on page load
  const [sessionId] = useState<string>(() => generateId());
  const [prompt, setPrompt] = useState("");

  // Use Vercel AI SDK's useCompletion hook
  const { completion, complete, isLoading, error } = useCompletion({
    api: "/api/research/initiate",
    streamProtocol: "text",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    await complete(prompt.trim(), {
      body: {
        prompt: prompt.trim(),
        userId: sessionId,
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
                <span className="text-purple-500">
                  <Zap className="w-5 h-5 fill-current" />
                </span>
                Direct RPC Method
              </h1>
              <p className="text-muted-foreground text-xs">
                Pattern 3: Custom Method Invocation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="border-purple-500/20 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/20"
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
        <Card className="border-purple-500/20 bg-purple-50/10 dark:bg-purple-900/5 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              Prompt the Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Plan a trip to Tokyo - I need weather, flights, and hotels"
                className="w-full min-h-[120px] p-4 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all text-sm"
                disabled={isLoading}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Reload page for a new session ID
                </p>
                <Button
                  type="submit"
                  disabled={!prompt.trim() || isLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
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
                ? "border-purple-500/40 shadow-[0_0_15px_-3px_rgba(168,85,247,0.15)]"
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
                  <p className="text-sm">
                    Response will stream here via RPC Method
                  </p>
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
                  className="mt-0.5 bg-purple-50/50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800"
                >
                  Client
                </Badge>
                <p>
                  Using{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded border">
                    useCompletion()
                  </code>{" "}
                  to POST to{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded border">
                    /api/research/initiate
                  </code>
                  .
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-md bg-background/50 border">
                <Badge
                  variant="outline"
                  className="mt-0.5 bg-purple-50/50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800"
                >
                  Server
                </Badge>
                <p>
                  Endpoint calls{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded border">
                    agent.initiateAgent(prompt)
                  </code>{" "}
                  directly as an RPC method.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50/10 dark:bg-purple-900/5 border-purple-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Key Difference
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <p className="text-muted-foreground">
                Instead of relying on the default{" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded border">
                  onRequest()
                </code>{" "}
                handler, this pattern invokes a specific method on the agent
                class.
              </p>
              <div className="p-3 rounded-md bg-purple-50/50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <span className="font-semibold text-xs text-purple-600 dark:text-purple-400 block mb-1">
                  RPC Call
                </span>
                <code className="text-xs">agent.customMethod()</code>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
