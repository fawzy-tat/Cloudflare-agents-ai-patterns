import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useCompletion } from "@ai-sdk/react";
import type { Route } from "./+types/http-streaming";
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
  Plane,
  Sparkles,
  Terminal,
  Info,
  Lock,
  MapPin,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { Combobox, type ComboboxItem } from "~/components/ui/combobox";
import { cities } from "~/constants/cities";

// Transform cities array into combobox items
const cityItems: ComboboxItem[] = cities.map((city) => ({
  value: `${city.name}, ${city.country}`,
  label: city.name,
  sublabel: city.country,
}));

export function meta({}: Route.MetaArgs) {
  return [
    { title: "HTTP Streaming Agent" },
    { name: "description", content: "HTTP-based agent streaming" },
  ];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 8);
}

export default function HttpStreamingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const agent = searchParams.get("agent") || "research";
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate ID once on page load
  const [sessionId] = useState<string>(() => generateId());
  const [selectedCity, setSelectedCity] = useState("");

  // Use Vercel AI SDK's useCompletion hook
  const { completion, complete, isLoading, error } = useCompletion({
    api: "/api/research",
    streamProtocol: "text",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCity.trim() || isLoading) return;

    // Send city to backend (prompt constructed server-side)
    await complete("", {
      body: {
        city: selectedCity,
        userId: sessionId,
      },
    });
  };

  // Auto-scroll to bottom of response
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [completion]);

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
                <span className="w-8 h-8 bg-amber-400 border-2 border-stone-800 rounded-lg flex items-center justify-center shadow-[2px_2px_0_#2D2A26]">
                  <Lock className="w-4 h-4 text-stone-800" />
                </span>
                HTTP with Middleware
              </h1>
              <p className="font-body text-stone-500 text-sm">
                Pattern 2: HTTP streaming through Hono middleware
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center bg-amber-100 border border-amber-300 text-stone-700 rounded-full px-3 py-1 font-body text-xs shadow-[1px_1px_0_#A09A92]">
              {agent === "research" ? "Research Agent" : "Support Agent"}
            </span>
            <span className="inline-flex items-center bg-stone-100 border border-stone-300 text-stone-600 rounded-full px-3 py-1 font-mono text-xs shadow-[1px_1px_0_#A09A92]">
              ID: {sessionId}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Input Area */}
        <Card className="bg-white border-2 border-stone-800 rounded-2xl shadow-[4px_4px_0_#2D2A26]">
          <CardHeader>
            <CardTitle className="font-display text-xl text-stone-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Plan Your Trip
            </CardTitle>
            <CardDescription className="font-body text-stone-500">
              Select a destination and we'll help you plan the perfect trip
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Combobox
                items={cityItems}
                value={selectedCity}
                onValueChange={setSelectedCity}
                disabled={isLoading}
                accentColor="orange"
                placeholder="Select a city..."
                searchPlaceholder="Search cities..."
                emptyText="No city found."
                label="Destination"
                icon={
                  <MapPin
                    className={cn(
                      "h-5 w-5",
                      selectedCity ? "text-stone-800" : "text-stone-400"
                    )}
                  />
                }
              />

              {selectedCity && (
                <div className="p-4 rounded-xl bg-amber-50 border-2 border-dashed border-amber-300">
                  <p className="font-body text-sm text-stone-700">
                    <span className="font-semibold">Trip plan:</span> We'll
                    research weather, news, and travel advisories for{" "}
                    <span className="font-semibold text-amber-700">
                      {selectedCity}
                    </span>
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="font-body text-xs text-stone-500">
                  Reload page for a new session ID
                </p>
                <Button
                  type="submit"
                  disabled={!selectedCity.trim() || isLoading}
                  className="bg-amber-400 hover:bg-amber-500 text-stone-800 font-body font-semibold border-2 border-stone-800 rounded-xl shadow-[3px_3px_0_#2D2A26] hover:shadow-[2px_2px_0_#2D2A26] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-stone-800/30 border-t-stone-800 rounded-full animate-spin mr-2" />
                      Planning...
                    </>
                  ) : (
                    <>
                      <Plane className="w-4 h-4 mr-2" />
                      Start Planning
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Response Area */}
        <div className="space-y-3">
          <h2 className="font-display text-lg text-stone-800 px-1">
            Agent Response
          </h2>
          <Card
            className={cn(
              "min-h-[300px] bg-white border-2 rounded-2xl transition-all",
              isLoading
                ? "border-amber-400 shadow-[4px_4px_0_#F5A623]"
                : "border-stone-800 shadow-[4px_4px_0_#2D2A26]"
            )}
          >
            <CardContent className="p-6">
              {error && (
                <div className="p-4 bg-rose-50 border-2 border-dashed border-rose-300 rounded-xl text-rose-700 mb-4 font-body text-sm">
                  {error.message}
                </div>
              )}

              {completion ? (
                <div className="prose prose-sm max-w-none font-body">
                  <div className="whitespace-pre-wrap leading-relaxed text-stone-700">
                    {completion}
                  </div>
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-stone-400 py-12">
                  <Terminal className="w-12 h-12 mb-4 opacity-30" />
                  <p className="font-body text-sm">
                    Response will stream here via HTTP
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
              <span className="inline-flex items-center bg-amber-100 border border-amber-300 text-amber-700 rounded-full px-2 py-0.5 text-xs font-semibold">
                Client
              </span>
              <p>
                Using{" "}
                <code className="text-xs bg-stone-200 px-1.5 py-0.5 rounded border border-stone-300">
                  useCompletion()
                </code>{" "}
                from{" "}
                <code className="text-xs bg-stone-200 px-1.5 py-0.5 rounded border border-stone-300">
                  @ai-sdk/react
                </code>{" "}
                to POST to{" "}
                <code className="text-xs bg-stone-200 px-1.5 py-0.5 rounded border border-stone-300">
                  /api/research
                </code>
                .
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-stone-300">
              <span className="inline-flex items-center bg-amber-100 border border-amber-300 text-amber-700 rounded-full px-2 py-0.5 text-xs font-semibold">
                Server
              </span>
              <p>
                The endpoint constructs the prompt from{" "}
                <code className="text-xs bg-stone-200 px-1.5 py-0.5 rounded border border-stone-300">
                  city
                </code>{" "}
                and calls{" "}
                <code className="text-xs bg-stone-200 px-1.5 py-0.5 rounded border border-stone-300">
                  getAgentByName()
                </code>
                . The agent's{" "}
                <code className="text-xs bg-stone-200 px-1.5 py-0.5 rounded border border-stone-300">
                  onRequest()
                </code>{" "}
                returns a streaming response.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
