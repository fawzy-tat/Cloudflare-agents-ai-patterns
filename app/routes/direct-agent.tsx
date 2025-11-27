import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useAgent } from "agents/react";
import type { Route } from "./+types/direct-agent";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { ArrowLeft, Send, Sparkles, Terminal, Info } from "lucide-react";
import { cn } from "~/lib/utils";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "WebSocket Real-time Agent" },
    { name: "description", content: "Bidirectional WebSocket communication" },
  ];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 8);
}

export default function DirectAgentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const agent = searchParams.get("agent") || "research";
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate ID once on page load
  const [sessionId] = useState<string>(() => generateId());
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert agent type to kebab-case class name
  const agentName = agent === "research" ? "research-agent" : "support-agent";

  // Use the Cloudflare useAgent hook
  const connection = useAgent({
    agent: agentName,
    name: sessionId,
    onMessage: (message) => {
      try {
        const data = JSON.parse(message.data);
        if (data.type === "chunk") {
          setResponse((prev) => prev + data.content);
        } else if (data.type === "complete") {
          setIsStreaming(false);
        } else if (data.type === "error") {
          setError(data.message);
          setIsStreaming(false);
        }
      } catch {
        // Handle non-JSON messages (raw text)
        setResponse((prev) => prev + message.data);
      }
    },
    onOpen: () => {
      console.log("WebSocket connected to agent:", agentName, sessionId);
    },
    onClose: () => {
      console.log("WebSocket closed");
      setIsStreaming(false);
    },
    onError: (err) => {
      console.error("WebSocket error:", err);
      setError("WebSocket connection failed");
      setIsStreaming(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !connection) return;

    setResponse("");
    setError(null);
    setIsStreaming(true);

    // Send prompt to agent via WebSocket
    connection.send(JSON.stringify({ prompt: prompt.trim() }));
  };

  // Auto-scroll to bottom of response
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [response]);

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
                <span className="text-blue-500">⚡</span>
                WebSocket Real-time
              </h1>
              <p className="text-muted-foreground text-xs">
                Pattern 1: Persistent Connection
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="border-blue-500/20 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20"
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
        <Card className="border-blue-500/20 bg-blue-50/10 dark:bg-blue-900/5 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              Prompt the Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Plan a trip to Tokyo - I need weather, flights, and hotels"
                className="w-full min-h-[120px] p-4 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-sm"
                disabled={isStreaming}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Reload page for a new session ID
                </p>
                <Button
                  type="submit"
                  disabled={!prompt.trim() || isStreaming}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isStreaming ? (
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
              isStreaming
                ? "border-blue-500/40 shadow-[0_0_15px_-3px_rgba(59,130,246,0.15)]"
                : "border-border"
            )}
          >
            <CardContent className="p-6">
              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive mb-4 text-sm">
                  {error}
                </div>
              )}

              {response ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {response}
                  </div>
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 py-12">
                  <Terminal className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm">
                    Response will stream here via WebSocket
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Technical Details */}
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
                className="mt-0.5 bg-blue-50/50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
              >
                Client
              </Badge>
              <p>
                Using{" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded border">
                  useAgent()
                </code>{" "}
                from{" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded border">
                  agents/react
                </code>{" "}
                to connect via WebSocket.
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-md bg-background/50 border">
              <Badge
                variant="outline"
                className="mt-0.5 bg-blue-50/50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
              >
                Route
              </Badge>
              <p>
                Connects to{" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded border">
                  /agents/{agentName}/{sessionId}
                </code>
                . No custom API route needed.
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-md bg-background/50 border">
              <Badge
                variant="outline"
                className="mt-0.5 bg-blue-50/50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
              >
                Server
              </Badge>
              <p>
                Agent's{" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded border">
                  onMessage()
                </code>{" "}
                handler processes prompt and streams chunks back.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
