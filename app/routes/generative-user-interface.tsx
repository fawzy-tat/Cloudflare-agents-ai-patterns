import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { WeatherOutput, StockOutput, EventOutput } from "~/schemas";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import {
  ArrowLeft,
  Send,
  Sparkles,
  Cloud,
  TrendingUp,
  TrendingDown,
  Calendar,
  MessageSquare,
  Loader2,
  Sun,
  CloudRain,
  Wind,
  Droplets,
  Clock,
  CheckCircle2,
  Bot,
  User,
} from "lucide-react";
import { cn } from "~/lib/utils";

export function meta() {
  return [
    { title: "Vercel AI SDK: Generative User Interfaces Demo" },
    {
      name: "description",
      content:
        "Learn how to use Generative UI to render dynamic components from LLM tool calls",
    },
  ];
}

// ============================================================================
// Main Component
// ============================================================================

export default function GenerativeUIPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="border-b-2 border-stone-800 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
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
                <span className="w-8 h-8 bg-rose-500 border-2 border-stone-800 rounded-lg flex items-center justify-center shadow-[2px_2px_0_#2D2A26]">
                  <Sparkles className="w-4 h-4 text-white" />
                </span>
                Generative User Interfaces
              </h1>
              <p className="font-body text-stone-500 text-sm">
                Dynamic UI components rendered from LLM tool calls
              </p>
            </div>
          </div>
          <span className="inline-flex items-center bg-rose-100 border border-rose-300 text-rose-700 rounded-full px-3 py-1 font-body text-xs shadow-[1px_1px_0_#A09A92]">
            useChat + Tools
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-12">
        {/* Intro Section */}
        <section className="max-w-3xl space-y-4">
          <h2 className="font-display text-3xl text-stone-800">
            Understanding{" "}
            <code className="text-rose-600 bg-rose-100 px-2 py-1 rounded-lg border border-rose-300">
              Generative UI
            </code>
          </h2>
          <p className="font-body text-stone-600 leading-relaxed">
            Generative User Interfaces allow an LLM to go beyond text and{" "}
            <strong>generate UI components</strong>. The model decides when to
            use tools, and the results are rendered as React components. This
            creates a more engaging, AI-native experience.
          </p>
          <ul className="grid md:grid-cols-3 gap-3 text-sm">
            <li className="flex items-center gap-2 p-4 rounded-xl bg-white border-2 border-stone-800 shadow-[3px_3px_0_#2D2A26]">
              <Cloud className="w-4 h-4 text-amber-500" />
              <span className="font-body text-stone-700">Weather cards</span>
            </li>
            <li className="flex items-center gap-2 p-4 rounded-xl bg-white border-2 border-stone-800 shadow-[3px_3px_0_#2D2A26]">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span className="font-body text-stone-700">Stock tickers</span>
            </li>
            <li className="flex items-center gap-2 p-4 rounded-xl bg-white border-2 border-stone-800 shadow-[3px_3px_0_#2D2A26]">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span className="font-body text-stone-700">
                Event confirmations
              </span>
            </li>
          </ul>
        </section>

        <Separator className="bg-stone-300" />

        {/* Live Chat Demo */}
        <GenerativeUIChatDemo />

        <Separator className="bg-stone-300" />

        {/* How It Works */}
        <HowItWorksSection />
      </div>

      <footer className="border-t-2 border-stone-800 bg-white py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="font-body text-stone-600">
            Part of the Cloudflare Agents + Vercel AI SDK educational project.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// Live Chat Demo - AI SDK 5.x Implementation
// ============================================================================

function GenerativeUIChatDemo() {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // AI SDK 5.x: Manage input state manually
  const [inputValue, setInputValue] = useState("");

  // AI SDK 5.x: useChat with DefaultChatTransport for custom API endpoint
  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/generative-ui/chat",
    }),
  });

  // Determine loading state from status
  const isLoading = status === "streaming" || status === "submitted";

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Only scroll the chat container, not the entire page
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const messageText = inputValue;
    setInputValue(""); // Clear input immediately

    // AI SDK 5.x: Use sendMessage with text property
    await sendMessage({ text: messageText });
  };

  const suggestedPrompts = [
    "What's the weather like in Tokyo?",
    "Show me the stock price for AAPL",
    "Schedule a meeting tomorrow at 2pm called 'Team Sync'",
    "What's the weather in Paris and the price of GOOGL?",
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl text-stone-800 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-rose-500" />
            Live Demo: Generative UI Chat
          </h3>
          <p className="font-body text-sm text-stone-500 mt-1">
            Chat with the AI and watch as it renders weather cards, stock
            tickers, and event confirmations based on your requests.
          </p>
        </div>
        <span className="inline-flex items-center bg-rose-100 border border-rose-300 text-rose-700 rounded-full px-3 py-1 font-body text-xs shadow-[1px_1px_0_#A09A92]">
          useChat + Tools
        </span>
      </div>

      <Card className="bg-white border-2 border-stone-800 rounded-2xl shadow-[4px_4px_0_#2D2A26]">
        <CardHeader>
          <CardTitle className="font-display text-xl text-stone-800">
            AI Assistant
          </CardTitle>
          <CardDescription className="font-body text-stone-500">
            Ask about weather, stocks, or schedule events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Suggested Prompts */}
          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map((prompt, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="font-body text-xs h-7 border border-stone-300 rounded-lg hover:bg-stone-100"
                onClick={() => setInputValue(prompt)}
                disabled={isLoading}
              >
                {prompt}
              </Button>
            ))}
          </div>

          {/* Chat Messages */}
          <div
            ref={messagesContainerRef}
            className="h-[400px] overflow-y-auto border-2 border-stone-300 rounded-xl p-4 space-y-4 bg-stone-50"
          >
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-stone-400">
                <Bot className="w-12 h-12 mb-2 opacity-30" />
                <p className="font-body text-sm">
                  Start a conversation to see Generative UI in action
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-rose-100 border-2 border-rose-300 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-rose-600" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[80%] space-y-2",
                    message.role === "user" && "order-first"
                  )}
                >
                  {/* AI SDK 5.x: Render message parts */}
                  {message.parts?.map((part, index) => {
                    // Text content
                    if (part.type === "text") {
                      return (
                        <div
                          key={index}
                          className={cn(
                            "rounded-xl px-4 py-2 border-2",
                            message.role === "user"
                              ? "bg-rose-500 text-white border-rose-600"
                              : "bg-white border-stone-300"
                          )}
                        >
                          <p className="font-body text-sm whitespace-pre-wrap">
                            {part.text}
                          </p>
                        </div>
                      );
                    }

                    // AI SDK 5.x: Tool parts have type "tool-{toolName}"
                    if (part.type.startsWith("tool-")) {
                      const toolPart = part as {
                        type: string;
                        state: string;
                        output?: unknown;
                        errorText?: string;
                      };

                      // Extract tool name from type
                      const toolName = toolPart.type.replace("tool-", "");

                      // Weather tool
                      if (toolName === "displayWeather") {
                        if (toolPart.state === "output-available") {
                          return (
                            <WeatherCard
                              key={index}
                              weather={toolPart.output as WeatherOutput}
                            />
                          );
                        }
                        if (toolPart.state === "output-error") {
                          return (
                            <ErrorCard
                              key={index}
                              message={toolPart.errorText || "Weather error"}
                            />
                          );
                        }
                        return (
                          <LoadingCard
                            key={index}
                            message="Loading weather..."
                          />
                        );
                      }

                      // Stock tool
                      if (toolName === "getStockPrice") {
                        if (toolPart.state === "output-available") {
                          return (
                            <StockCard
                              key={index}
                              stock={toolPart.output as StockOutput}
                            />
                          );
                        }
                        if (toolPart.state === "output-error") {
                          return (
                            <ErrorCard
                              key={index}
                              message={toolPart.errorText || "Stock error"}
                            />
                          );
                        }
                        return (
                          <LoadingCard
                            key={index}
                            message="Loading stock price..."
                          />
                        );
                      }

                      // Event tool
                      if (toolName === "createEvent") {
                        if (toolPart.state === "output-available") {
                          return (
                            <EventCard
                              key={index}
                              event={toolPart.output as EventOutput}
                            />
                          );
                        }
                        if (toolPart.state === "output-error") {
                          return (
                            <ErrorCard
                              key={index}
                              message={toolPart.errorText || "Event error"}
                            />
                          );
                        }
                        return (
                          <LoadingCard
                            key={index}
                            message="Creating event..."
                          />
                        );
                      }

                      // Generic loading for unknown tools
                      return (
                        <LoadingCard
                          key={index}
                          message={`Processing ${toolName}...`}
                        />
                      );
                    }

                    return null;
                  })}
                </div>

                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-stone-200 border-2 border-stone-400 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-stone-600" />
                  </div>
                )}
              </div>
            ))}

            {/* Show loading indicator when streaming */}
            {isLoading && messages.length > 0 && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 border-2 border-rose-300 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-rose-600" />
                </div>
                <div className="rounded-xl px-4 py-2 bg-white border-2 border-stone-300">
                  <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border-2 border-dashed border-rose-300 rounded-xl text-rose-700 font-body text-sm">
              Error: {error.message}
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleFormSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about weather, stocks, or schedule an event..."
              className="flex-1 px-4 py-2 font-body rounded-xl border-2 border-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/50 shadow-[2px_2px_0_#2D2A26]"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-rose-500 hover:bg-rose-600 text-white font-body font-semibold border-2 border-stone-800 rounded-xl shadow-[3px_3px_0_#2D2A26] hover:shadow-[2px_2px_0_#2D2A26] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

// ============================================================================
// UI Components for Tool Results
// ============================================================================

function LoadingCard({ message }: { message: string }) {
  return (
    <div className="rounded-xl p-4 bg-white border-2 border-stone-300 animate-pulse">
      <div className="flex items-center gap-2 text-sm text-stone-500 font-body">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>{message}</span>
      </div>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-xl p-4 bg-rose-50 border-2 border-dashed border-rose-300">
      <div className="flex items-center gap-2 text-sm text-rose-700 font-body">
        <span>Error: {message}</span>
      </div>
    </div>
  );
}

function WeatherCard({ weather }: { weather: WeatherOutput }) {
  const getWeatherIcon = (condition: string) => {
    const lower = condition.toLowerCase();
    if (lower.includes("sun") || lower.includes("clear"))
      return <Sun className="w-8 h-8 text-amber-500" />;
    if (lower.includes("rain"))
      return <CloudRain className="w-8 h-8 text-blue-500" />;
    if (lower.includes("wind"))
      return <Wind className="w-8 h-8 text-stone-500" />;
    return <Cloud className="w-8 h-8 text-stone-400" />;
  };

  return (
    <div className="rounded-xl p-4 bg-gradient-to-br from-sky-50 to-blue-50 border-2 border-sky-300 min-w-[280px] shadow-[3px_3px_0_#0EA5E9]">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-body text-xs text-stone-500 uppercase tracking-wider">
            Weather
          </p>
          <h4 className="font-display text-lg text-stone-800">
            {weather.location}
          </h4>
          <p className="font-body text-sm text-stone-500">
            {weather.condition}
          </p>
        </div>
        {getWeatherIcon(weather.condition)}
      </div>
      <div className="mt-4 flex items-end gap-1">
        <span className="font-display text-4xl text-stone-800">
          {weather.temperature}
        </span>
        <span className="font-body text-xl text-stone-500 mb-1">
          °{weather.unit === "celsius" ? "C" : "F"}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-body">
        <div className="flex items-center gap-1 text-stone-500">
          <Droplets className="w-3 h-3" />
          <span>Humidity: {weather.humidity}%</span>
        </div>
        <div className="flex items-center gap-1 text-stone-500">
          <Wind className="w-3 h-3" />
          <span>Wind: {weather.windSpeed} km/h</span>
        </div>
      </div>
    </div>
  );
}

function StockCard({ stock }: { stock: StockOutput }) {
  const isUp = stock.changeDirection === "up";

  return (
    <div
      className={cn(
        "rounded-xl p-4 border-2 min-w-[280px]",
        isUp
          ? "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300 shadow-[3px_3px_0_#10B981]"
          : "bg-gradient-to-br from-rose-50 to-red-50 border-rose-300 shadow-[3px_3px_0_#F43F5E]"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-body text-xs text-stone-500 uppercase tracking-wider">
            Stock
          </p>
          <h4 className="font-display text-lg text-stone-800">
            {stock.symbol}
          </h4>
          <p className="font-body text-sm text-stone-500">
            {stock.companyName}
          </p>
        </div>
        {isUp ? (
          <TrendingUp className="w-8 h-8 text-emerald-500" />
        ) : (
          <TrendingDown className="w-8 h-8 text-rose-500" />
        )}
      </div>
      <div className="mt-4 flex items-end gap-2">
        <span className="font-display text-3xl text-stone-800">
          ${stock.price.toFixed(2)}
        </span>
        <span
          className={cn(
            "font-body text-sm font-medium mb-1",
            isUp ? "text-emerald-600" : "text-rose-600"
          )}
        >
          {isUp ? "+" : ""}
          {stock.change.toFixed(2)}%
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-stone-500 font-body">
        <div>Vol: {(stock.volume / 1000000).toFixed(1)}M</div>
        <div>Cap: ${stock.marketCap}</div>
      </div>
    </div>
  );
}

function EventCard({ event }: { event: EventOutput }) {
  return (
    <div className="rounded-xl p-4 bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-300 min-w-[280px] shadow-[3px_3px_0_#8B5CF6]">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-body text-xs text-stone-500 uppercase tracking-wider">
            Event Created
          </p>
          <h4 className="font-display text-lg text-stone-800 mt-1">
            {event.title}
          </h4>
        </div>
        <div className="w-8 h-8 rounded-full bg-violet-100 border-2 border-violet-300 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-violet-600" />
        </div>
      </div>
      <div className="mt-3 space-y-2 text-sm font-body">
        <div className="flex items-center gap-2 text-stone-500">
          <Calendar className="w-4 h-4" />
          <span>{event.date}</span>
        </div>
        <div className="flex items-center gap-2 text-stone-500">
          <Clock className="w-4 h-4" />
          <span>
            {event.time} ({event.duration})
          </span>
        </div>
      </div>
      {event.description && (
        <p className="mt-3 text-sm text-stone-500 font-body">
          {event.description}
        </p>
      )}
      <span className="mt-3 inline-flex items-center bg-violet-100 border border-violet-300 text-violet-700 rounded-full px-2 py-0.5 text-xs font-body">
        {event.status}
      </span>
    </div>
  );
}

// ============================================================================
// How It Works Section
// ============================================================================

function HowItWorksSection() {
  return (
    <section className="space-y-6">
      <h3 className="font-display text-2xl text-stone-800">
        How Generative UI Works
      </h3>
      <div className="grid md:grid-cols-4 gap-4">
        {[
          {
            step: 1,
            title: "User Message",
            description: "User sends a message like 'What's the weather?'",
            icon: <User className="w-5 h-5" />,
          },
          {
            step: 2,
            title: "LLM Decides",
            description: "Model analyzes context and decides to call a tool",
            icon: <Bot className="w-5 h-5" />,
          },
          {
            step: 3,
            title: "Tool Executes",
            description: "Tool runs and returns structured data",
            icon: <Sparkles className="w-5 h-5" />,
          },
          {
            step: 4,
            title: "UI Renders",
            description: "Data is passed to React components for display",
            icon: <MessageSquare className="w-5 h-5" />,
          },
        ].map((item) => (
          <Card
            key={item.step}
            className="relative bg-white border-2 border-stone-800 rounded-2xl shadow-[3px_3px_0_#2D2A26]"
          >
            <CardContent className="pt-8 pb-4 px-4">
              <div className="absolute -top-3 left-4 w-7 h-7 rounded-full bg-rose-500 border-2 border-stone-800 text-white flex items-center justify-center text-xs font-bold font-body shadow-[2px_2px_0_#2D2A26]">
                {item.step}
              </div>
              <div className="flex items-center gap-2 text-rose-500 mb-2">
                {item.icon}
                <h4 className="font-body font-semibold text-stone-800">
                  {item.title}
                </h4>
              </div>
              <p className="font-body text-sm text-stone-500">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
