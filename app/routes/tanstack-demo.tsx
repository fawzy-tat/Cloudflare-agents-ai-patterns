import { useState } from "react";
import { useNavigate, isRouteErrorResponse } from "react-router";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useAgent } from "agents/react";
import { generateSessionId } from "~/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Separator } from "~/components/ui/separator";
import {
  ArrowLeft,
  Database,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Zap,
  Activity,
  Users,
  Server,
  Bot,
  Wifi,
  WifiOff,
  RotateCcw,
  Sparkles,
  Info,
  Clock,
  HardDrive,
  Lightbulb,
} from "lucide-react";
import { cn } from "~/lib/utils";

export function meta() {
  return [
    { title: "TanStack Query Demo" },
    {
      name: "description",
      content:
        "Comprehensive demonstration of TanStack Query features with Cloudflare Agents",
    },
  ];
}

export function loader() {
  return { sessionId: generateSessionId() };
}

// Loader data type
type LoaderData = {
  sessionId: string;
};

// ============================================================================
// Types
// ============================================================================

interface HealthData {
  status: string;
  timestamp: string;
  uptime: number;
  region: string;
}

interface StatsData {
  type: string;
  total: number;
  active?: number;
  new?: number;
  today?: number;
  avgLatency?: number;
  conversations?: number;
  fetchedAt: string;
}

interface DemoItem {
  id: string;
  text: string;
  status: string;
  createdAt: string;
}

interface ItemsResponse {
  items: DemoItem[];
  total: number;
}

// ============================================================================
// Main Component
// ============================================================================

export default function TanStackDemoPage({
  loaderData,
}: {
  loaderData: LoaderData;
}) {
  const navigate = useNavigate();
  const { sessionId } = loaderData;

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
                  <Database className="w-4 h-4 text-white" />
                </span>
                TanStack Query Demo
              </h1>
              <p className="font-body text-stone-500 text-sm">
                Data fetching, caching, mutations & optimistic updates
              </p>
            </div>
          </div>
          <span className="inline-flex items-center bg-rose-100 border border-rose-300 text-stone-700 rounded-full px-3 py-1 font-body text-xs shadow-[1px_1px_0_#A09A92]">
            @tanstack/react-query
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-12">
        {/* Intro Section */}
        <section className="max-w-3xl space-y-4">
          <h2 className="font-display text-3xl text-stone-800">
            Why{" "}
            <code className="text-rose-600 bg-rose-100 px-2 py-1 rounded-lg border border-rose-300">
              TanStack Query
            </code>
            ?
          </h2>
          <p className="font-body text-stone-600 leading-relaxed">
            TanStack Query provides powerful data synchronization for React
            apps. It handles <strong>caching</strong>,{" "}
            <strong>background refetching</strong>,{" "}
            <strong>stale-while-revalidate</strong>, and{" "}
            <strong>optimistic updates</strong> out of the box. This page
            demonstrates key features alongside your existing Cloudflare Agents.
          </p>
          <ul className="grid md:grid-cols-3 gap-3 text-sm">
            <li className="flex items-center gap-2 p-4 rounded-xl bg-white border-2 border-stone-800 shadow-[3px_3px_0_#2D2A26]">
              <Database className="w-4 h-4 text-rose-500" />
              <span className="font-body text-stone-700">
                Automatic caching
              </span>
            </li>
            <li className="flex items-center gap-2 p-4 rounded-xl bg-white border-2 border-stone-800 shadow-[3px_3px_0_#2D2A26]">
              <RefreshCw className="w-4 h-4 text-rose-500" />
              <span className="font-body text-stone-700">
                Background sync
              </span>
            </li>
            <li className="flex items-center gap-2 p-4 rounded-xl bg-white border-2 border-stone-800 shadow-[3px_3px_0_#2D2A26]">
              <Zap className="w-4 h-4 text-rose-500" />
              <span className="font-body text-stone-700">
                Optimistic updates
              </span>
            </li>
          </ul>
        </section>

        <Separator className="bg-stone-300" />

        {/* Example 1: Basic useQuery */}
        <BasicQueryExample />

        <Separator className="bg-stone-300" />

        {/* Example 2: Query with Parameters */}
        <ParameterizedQueryExample />

        <Separator className="bg-stone-300" />

        {/* Example 3: Mutations & Optimistic Updates */}
        <MutationExample />

        <Separator className="bg-stone-300" />

        {/* Example 4: Request Deduplication */}
        <DeduplicationExample />

        <Separator className="bg-stone-300" />

        {/* Example 5: WebSocket + Query Integration */}
        <WebSocketQueryExample sessionId={sessionId} />
      </div>

      <footer className="border-t-2 border-stone-800 bg-white py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="font-body text-stone-600">
            TanStack Query integrates seamlessly with your existing Cloudflare
            Agents setup.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// Example 1: Basic useQuery
// ============================================================================

function BasicQueryExample() {
  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    isStale,
    refetch,
    dataUpdatedAt,
  } = useQuery<HealthData>({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await fetch("/api/tanstack-demo/health");
      if (!res.ok) throw new Error("Failed to fetch health");
      return res.json();
    },
    staleTime: 10000, // Consider data stale after 10 seconds
    refetchOnWindowFocus: true,
  });

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl text-stone-800 flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-500" />
            Example 1: Basic useQuery
          </h3>
          <p className="font-body text-sm text-stone-500 mt-1">
            Simple data fetching with automatic caching and loading states
          </p>
        </div>
        <span className="inline-flex items-center bg-emerald-100 border border-emerald-300 text-emerald-700 rounded-full px-3 py-1 font-body text-xs shadow-[1px_1px_0_#A09A92]">
          useQuery()
        </span>
      </div>

      <Tabs defaultValue="demo" className="w-full">
        <TabsList className="bg-stone-200 border border-stone-300 rounded-xl p-1">
          <TabsTrigger
            value="demo"
            className="font-body rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Live Demo
          </TabsTrigger>
          <TabsTrigger
            value="learn"
            className="font-body rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Learn
          </TabsTrigger>
          <TabsTrigger
            value="code"
            className="font-body rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="demo" className="space-y-4 mt-4">
          <Card className="bg-white border-2 border-stone-800 rounded-2xl shadow-[4px_4px_0_#2D2A26]">
            <CardHeader>
              <CardTitle className="font-display text-xl text-stone-800">
                Server Health Check
              </CardTitle>
              <CardDescription className="font-body text-stone-500">
                Watch the loading state, caching, and background refetch
                indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Indicators */}
              <div className="flex flex-wrap gap-2">
                <StatusBadge
                  active={isLoading}
                  label="Loading"
                  color="amber"
                />
                <StatusBadge
                  active={isFetching && !isLoading}
                  label="Background Fetching"
                  color="blue"
                />
                <StatusBadge active={isStale} label="Stale" color="orange" />
                <StatusBadge
                  active={!isStale && !!data}
                  label="Fresh"
                  color="green"
                />
                <StatusBadge active={isError} label="Error" color="red" />
              </div>

              {/* Data Display */}
              {isLoading ? (
                <div className="p-6 rounded-xl bg-stone-100 border-2 border-dashed border-stone-300 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-stone-400 mr-2" />
                  <span className="font-body text-stone-500">
                    Loading health data...
                  </span>
                </div>
              ) : isError ? (
                <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300">
                  <p className="font-body text-rose-700 text-sm">
                    Error: {error instanceof Error ? error.message : "Unknown"}
                  </p>
                </div>
              ) : data ? (
                <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-300 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-body font-semibold text-emerald-800">
                      {data.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm font-body">
                    <div className="p-3 bg-white rounded-lg border border-emerald-200">
                      <p className="text-stone-500 text-xs">Region</p>
                      <p className="font-semibold text-stone-800">
                        {data.region}
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-emerald-200">
                      <p className="text-stone-500 text-xs">Uptime</p>
                      <p className="font-semibold text-stone-800">
                        {data.uptime}s
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-emerald-200">
                      <p className="text-stone-500 text-xs">Last Fetched</p>
                      <p className="font-semibold text-stone-800">
                        {dataUpdatedAt
                          ? new Date(dataUpdatedAt).toLocaleTimeString()
                          : "-"}
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-emerald-200">
                      <p className="text-stone-500 text-xs">Server Time</p>
                      <p className="font-semibold text-stone-800">
                        {new Date(data.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-body font-semibold border-2 border-stone-800 rounded-xl shadow-[3px_3px_0_#2D2A26] hover:shadow-[2px_2px_0_#2D2A26] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                >
                  {isFetching ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Refetch
                </Button>
                <p className="font-body text-xs text-stone-500 flex items-center">
                  <Info className="w-3 h-3 mr-1" />
                  Data becomes stale after 10 seconds
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="learn" className="mt-4 space-y-4">
          {/* What is Stale? */}
          <LearnCard
            icon={<Clock className="w-5 h-5 text-orange-500" />}
            title="What does 'Stale' mean?"
            color="orange"
          >
            <p className="mb-3">
              <strong>"Stale"</strong> means the cached data is older than your configured{" "}
              <code className="bg-stone-200 px-1 rounded">staleTime</code>. It's like milk's expiration date:
            </p>
            <ul className="list-disc list-inside space-y-1 mb-3 text-stone-600">
              <li><strong>Fresh</strong> = Data was fetched recently, safe to use as-is</li>
              <li><strong>Stale</strong> = Data might be outdated, should be refreshed</li>
            </ul>
            <p className="mb-3">
              <strong>Key insight:</strong> Stale data is still <em>shown to the user</em> immediately (better UX!),
              but TanStack Query will fetch fresh data in the background.
            </p>
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="font-semibold text-orange-800 text-sm mb-1">Real-life example:</p>
              <p className="text-sm text-stone-600">
                A dashboard showing user count. If a user navigates away and comes back 30 seconds later,
                they see the cached count <em>instantly</em> while fresh data loads in the background.
                Without caching, they'd see a loading spinner every time.
              </p>
            </div>
          </LearnCard>

          {/* Where is cache stored? */}
          <LearnCard
            icon={<HardDrive className="w-5 h-5 text-blue-500" />}
            title="Where is the cache stored?"
            color="blue"
          >
            <p className="mb-3">
              The cache lives <strong>in-memory in the browser</strong> (JavaScript heap), managed by the{" "}
              <code className="bg-stone-200 px-1 rounded">QueryClient</code> instance.
            </p>
            <ul className="list-disc list-inside space-y-1 mb-3 text-stone-600">
              <li><strong>Not</strong> localStorage or sessionStorage</li>
              <li><strong>Not</strong> IndexedDB (unless you add a persister plugin)</li>
              <li>Cache is <strong>cleared on page refresh</strong> by default</li>
              <li>Shared across all components using the same <code className="bg-stone-200 px-1 rounded">queryKey</code></li>
            </ul>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-semibold text-blue-800 text-sm mb-1">Why in-memory?</p>
              <p className="text-sm text-stone-600">
                It's fast! No serialization overhead. For most apps, you <em>want</em> fresh data on page load anyway.
                If you need persistence, TanStack Query has optional persisters for localStorage/IndexedDB.
              </p>
            </div>
          </LearnCard>

          {/* Retry vs Polling */}
          <LearnCard
            icon={<RefreshCw className="w-5 h-5 text-violet-500" />}
            title="Retries vs Polling - What's the difference?"
            color="violet"
          >
            <div className="grid md:grid-cols-2 gap-4 mb-3">
              <div className="p-3 bg-violet-50 rounded-lg border border-violet-200">
                <p className="font-semibold text-violet-800 text-sm mb-2">Retry (on failure)</p>
                <ul className="text-sm text-stone-600 space-y-1">
                  <li>Only happens when a request <strong>fails</strong></li>
                  <li>Default: 3 retries with exponential backoff</li>
                  <li>Delays: 1s, 2s, 4s (doubles each time)</li>
                  <li>Stops after success or max retries</li>
                </ul>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="font-semibold text-emerald-800 text-sm mb-2">Polling (continuous)</p>
                <ul className="text-sm text-stone-600 space-y-1">
                  <li>Fetches at regular intervals regardless of success</li>
                  <li>Use <code className="bg-stone-200 px-1 rounded">refetchInterval: 5000</code></li>
                  <li>Good for real-time data without WebSockets</li>
                  <li>Keeps sending requests until component unmounts</li>
                </ul>
              </div>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="font-semibold text-amber-800 text-sm mb-1">Does stale = keep sending API calls?</p>
              <p className="text-sm text-stone-600">
                <strong>No!</strong> Stale data just sits there until something triggers a refetch:
                window focus, manual refetch, component remount, or invalidation.
                It does NOT automatically poll. You're in control.
              </p>
            </div>
          </LearnCard>

          {/* When to use */}
          <LearnCard
            icon={<Lightbulb className="w-5 h-5 text-amber-500" />}
            title="When should I use useQuery?"
            color="amber"
          >
            <p className="mb-3 font-semibold">Use useQuery when you have:</p>
            <ul className="list-disc list-inside space-y-2 mb-3 text-stone-600">
              <li><strong>Dashboard data</strong> - Stats, charts, summaries that don't change every second</li>
              <li><strong>User profiles</strong> - Fetch once, cache while the user browses</li>
              <li><strong>Lists and search results</strong> - Product catalogs, search results, paginated data</li>
              <li><strong>Configuration/settings</strong> - Feature flags, app config</li>
              <li><strong>Any GET request</strong> that benefits from caching</li>
            </ul>
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
              <p className="font-semibold text-rose-800 text-sm mb-1">Don't use useQuery for:</p>
              <p className="text-sm text-stone-600">
                Real-time chat messages, live cursors, or data that changes multiple times per second.
                Use WebSockets (like <code className="bg-stone-200 px-1 rounded">useAgent</code>) for those.
              </p>
            </div>
          </LearnCard>
        </TabsContent>

        <TabsContent value="code" className="mt-4">
          <Card className="bg-stone-900 text-stone-100 border-2 border-stone-700 rounded-2xl">
            <CardContent className="p-0">
              <pre className="p-4 overflow-x-auto text-xs leading-relaxed font-mono">
                <code>{`import { useQuery } from '@tanstack/react-query';

function HealthCheck() {
  const {
    data,
    isLoading,
    isError,
    isFetching,  // True during background refetch
    isStale,     // True when data is older than staleTime
    refetch,     // Manual refetch function
  } = useQuery({
    queryKey: ['health'],  // Unique cache key
    queryFn: async () => {
      const res = await fetch('/api/health');
      return res.json();
    },
    staleTime: 10000,          // Fresh for 10 seconds
    refetchOnWindowFocus: true, // Auto-refetch on tab focus
    retry: 3,                   // Retry failed requests 3 times
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
  });

  if (isLoading) return <Loading />;
  if (isError) return <Error />;

  return (
    <div>
      {isFetching && <span>Updating in background...</span>}
      <p>Status: {data.status}</p>
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}`}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}

// ============================================================================
// Example 2: Query with Parameters
// ============================================================================

function ParameterizedQueryExample() {
  const [statType, setStatType] = useState<"users" | "requests" | "agents">(
    "users"
  );

  const { data, isLoading, isFetching, error, dataUpdatedAt } =
    useQuery<StatsData>({
      queryKey: ["stats", statType],
      queryFn: async () => {
        const res = await fetch(`/api/tanstack-demo/stats/${statType}`);
        if (!res.ok) throw new Error("Failed to fetch stats");
        return res.json();
      },
      staleTime: 30000, // 30 seconds
    });

  const statIcons = {
    users: <Users className="w-5 h-5" />,
    requests: <Activity className="w-5 h-5" />,
    agents: <Bot className="w-5 h-5" />,
  };

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl text-stone-800 flex items-center gap-2">
            <Server className="w-6 h-6 text-blue-500" />
            Example 2: Parameterized Queries
          </h3>
          <p className="font-body text-sm text-stone-500 mt-1">
            Each parameter combination gets its own cache entry
          </p>
        </div>
        <span className="inline-flex items-center bg-blue-100 border border-blue-300 text-blue-700 rounded-full px-3 py-1 font-body text-xs shadow-[1px_1px_0_#A09A92]">
          queryKey: ['stats', type]
        </span>
      </div>

      <Tabs defaultValue="demo" className="w-full">
        <TabsList className="bg-stone-200 border border-stone-300 rounded-xl p-1">
          <TabsTrigger
            value="demo"
            className="font-body rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Live Demo
          </TabsTrigger>
          <TabsTrigger
            value="learn"
            className="font-body rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Learn
          </TabsTrigger>
          <TabsTrigger
            value="code"
            className="font-body rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="demo" className="space-y-4 mt-4">
          <Card className="bg-white border-2 border-stone-800 rounded-2xl shadow-[4px_4px_0_#2D2A26]">
            <CardHeader>
              <CardTitle className="font-display text-xl text-stone-800">
                System Statistics
              </CardTitle>
              <CardDescription className="font-body text-stone-500">
                Switch between stat types - each gets cached separately
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Type Selector */}
              <div className="flex gap-2">
                {(["users", "requests", "agents"] as const).map((type) => (
                  <Button
                    key={type}
                    variant={statType === type ? "default" : "outline"}
                    onClick={() => setStatType(type)}
                    className={cn(
                      "font-body border-2 border-stone-800 rounded-xl transition-all",
                      statType === type
                        ? "bg-blue-500 text-white hover:bg-blue-600 shadow-[2px_2px_0_#2D2A26]"
                        : "bg-white hover:bg-stone-50"
                    )}
                  >
                    {statIcons[type]}
                    <span className="ml-2 capitalize">{type}</span>
                  </Button>
                ))}
              </div>

              {/* Cache Status */}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                <p className="font-body text-xs text-blue-700 flex items-center gap-2">
                  <Database className="w-3 h-3" />
                  Cache key:{" "}
                  <code className="bg-blue-100 px-1 rounded">
                    ['stats', '{statType}']
                  </code>
                  {isFetching && (
                    <span className="ml-auto flex items-center gap-1 text-blue-600">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Fetching...
                    </span>
                  )}
                </p>
              </div>

              {/* Stats Display */}
              {isLoading ? (
                <div className="h-32 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : error ? (
                <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300">
                  <p className="font-body text-rose-700 text-sm">
                    Failed to load stats
                  </p>
                </div>
              ) : data ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Total" value={data.total} />
                  {data.active !== undefined && (
                    <StatCard label="Active" value={data.active} />
                  )}
                  {data.new !== undefined && (
                    <StatCard label="New" value={data.new} />
                  )}
                  {data.today !== undefined && (
                    <StatCard label="Today" value={data.today} />
                  )}
                  {data.avgLatency !== undefined && (
                    <StatCard label="Avg Latency" value={`${data.avgLatency}ms`} />
                  )}
                  {data.conversations !== undefined && (
                    <StatCard label="Conversations" value={data.conversations} />
                  )}
                </div>
              ) : null}

              {dataUpdatedAt && (
                <p className="font-body text-xs text-stone-500">
                  Last fetched: {new Date(dataUpdatedAt).toLocaleTimeString()}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="learn" className="mt-4 space-y-4">
          {/* How queryKey works */}
          <LearnCard
            icon={<Database className="w-5 h-5 text-blue-500" />}
            title="How does queryKey work?"
            color="blue"
          >
            <p className="mb-3">
              The <code className="bg-stone-200 px-1 rounded">queryKey</code> is like a unique address for your cached data.
              When any part of the key changes, TanStack Query treats it as a <strong>different query</strong>.
            </p>
            <div className="grid md:grid-cols-2 gap-3 mb-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <code className="text-xs">['stats', 'users']</code>
                <p className="text-xs text-stone-500 mt-1">User stats cache</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <code className="text-xs">['stats', 'agents']</code>
                <p className="text-xs text-stone-500 mt-1">Agent stats cache (different!)</p>
              </div>
            </div>
            <p className="mb-3">
              This is why switching tabs in the demo is <strong>instant after the first load</strong> - each stat type
              has its own cached entry that persists until it becomes stale.
            </p>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-semibold text-blue-800 text-sm mb-1">Real-life example:</p>
              <p className="text-sm text-stone-600">
                E-commerce product pages: <code className="bg-stone-200 px-1 rounded">['product', productId]</code>.
                Each product gets cached separately. Visit product #123, then #456, then go back to #123 -
                it loads instantly from cache!
              </p>
            </div>
          </LearnCard>

          {/* Stale-while-revalidate */}
          <LearnCard
            icon={<RefreshCw className="w-5 h-5 text-emerald-500" />}
            title="What is Stale-While-Revalidate?"
            color="emerald"
          >
            <p className="mb-3">
              This is the <strong>killer feature</strong> of TanStack Query. When data is stale:
            </p>
            <ol className="list-decimal list-inside space-y-2 mb-3 text-stone-600">
              <li><strong>Show stale data immediately</strong> (no loading spinner!)</li>
              <li><strong>Fetch fresh data in background</strong></li>
              <li><strong>Replace with fresh data</strong> when it arrives</li>
            </ol>
            <p className="mb-3">
              Users see <em>something</em> right away, and the UI updates seamlessly when fresh data arrives.
              This pattern dramatically improves perceived performance.
            </p>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="font-semibold text-emerald-800 text-sm mb-1">Try it yourself:</p>
              <p className="text-sm text-stone-600">
                1. Click "Users" to load that tab<br/>
                2. Click "Agents" to load that tab<br/>
                3. Click "Users" again - notice it's <strong>instant</strong> (cached)<br/>
                4. Watch the "Background Fetching" indicator update silently
              </p>
            </div>
          </LearnCard>

          {/* When to use parameterized queries */}
          <LearnCard
            icon={<Lightbulb className="w-5 h-5 text-amber-500" />}
            title="When should I use parameterized queries?"
            color="amber"
          >
            <p className="mb-3">Use parameters in your queryKey when you're fetching:</p>
            <ul className="list-disc list-inside space-y-1 mb-3 text-stone-600">
              <li><strong>Detail pages:</strong> <code className="bg-stone-200 px-1 rounded">['user', userId]</code></li>
              <li><strong>Filtered lists:</strong> <code className="bg-stone-200 px-1 rounded">{`['products', { category, sort }]`}</code></li>
              <li><strong>Paginated data:</strong> <code className="bg-stone-200 px-1 rounded">{`['posts', { page, limit }]`}</code></li>
              <li><strong>Search results:</strong> <code className="bg-stone-200 px-1 rounded">['search', searchTerm]</code></li>
              <li><strong>Date ranges:</strong> <code className="bg-stone-200 px-1 rounded">{`['analytics', { from, to }]`}</code></li>
            </ul>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="font-semibold text-amber-800 text-sm mb-1">Pro tip:</p>
              <p className="text-sm text-stone-600">
                Objects in queryKey are compared by value, not reference.
                <code className="bg-stone-200 px-1 rounded mx-1">['users', {`{ page: 1 }`}]</code> and
                <code className="bg-stone-200 px-1 rounded mx-1">['users', {`{ page: 1 }`}]</code> are the same key!
              </p>
            </div>
          </LearnCard>
        </TabsContent>

        <TabsContent value="code" className="mt-4">
          <Card className="bg-stone-900 text-stone-100 border-2 border-stone-700 rounded-2xl">
            <CardContent className="p-0">
              <pre className="p-4 overflow-x-auto text-xs leading-relaxed font-mono">
                <code>{`import { useQuery } from '@tanstack/react-query';

function StatsView({ type }: { type: 'users' | 'requests' | 'agents' }) {
  const { data, isLoading, isFetching } = useQuery({
    // Each unique queryKey gets its own cache
    queryKey: ['stats', type],
    queryFn: async () => {
      const res = await fetch(\`/api/stats/\${type}\`);
      return res.json();
    },
    staleTime: 30000, // 30 seconds
  });

  // When you switch types:
  // - If cached: Shows cached data instantly (stale-while-revalidate)
  // - If not cached: Shows loading state
  // - isFetching indicates background refresh

  return (
    <div>
      {isFetching && <span>Refreshing...</span>}
      <p>Total: {data?.total}</p>
    </div>
  );
}`}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 bg-white rounded-xl border-2 border-stone-300">
      <p className="font-body text-xs text-stone-500 uppercase tracking-wider">
        {label}
      </p>
      <p className="font-display text-2xl text-stone-800">{value}</p>
    </div>
  );
}

// ============================================================================
// Example 3: Mutations & Optimistic Updates
// ============================================================================

function MutationExample() {
  const queryClient = useQueryClient();
  const [newItemText, setNewItemText] = useState("");

  // Fetch items
  const {
    data: itemsData,
    isLoading,
    isFetching,
  } = useQuery<ItemsResponse>({
    queryKey: ["items"],
    queryFn: async () => {
      const res = await fetch("/api/tanstack-demo/items");
      if (!res.ok) throw new Error("Failed to fetch items");
      return res.json();
    },
  });

  // Create mutation with optimistic update
  const createMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch("/api/tanstack-demo/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const errorData = (await res.json()) as { error?: string };
        throw new Error(errorData.error || "Failed to create item");
      }
      return res.json() as Promise<DemoItem>;
    },
    // Optimistic update
    onMutate: async (text) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["items"] });

      // Snapshot previous value
      const previousItems = queryClient.getQueryData<ItemsResponse>(["items"]);

      // Optimistically update
      const optimisticItem: DemoItem = {
        id: `temp-${Date.now()}`,
        text,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<ItemsResponse>(["items"], (old) => ({
        items: [optimisticItem, ...(old?.items || [])],
        total: (old?.total || 0) + 1,
      }));

      return { previousItems };
    },
    // Rollback on error
    onError: (_err, _text, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(["items"], context.previousItems);
      }
    },
    // Refetch after success or error
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tanstack-demo/items/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete item");
      return res.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["items"] });
      const previousItems = queryClient.getQueryData<ItemsResponse>(["items"]);

      queryClient.setQueryData<ItemsResponse>(["items"], (old) => ({
        items: (old?.items || []).filter((item) => item.id !== id),
        total: Math.max((old?.total || 0) - 1, 0),
      }));

      return { previousItems };
    },
    onError: (_err, _id, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(["items"], context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    createMutation.mutate(newItemText);
    setNewItemText("");
  };

  const items = itemsData?.items || [];

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl text-stone-800 flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" />
            Example 3: Mutations & Optimistic Updates
          </h3>
          <p className="font-body text-sm text-stone-500 mt-1">
            Instant UI feedback with automatic rollback on errors
          </p>
        </div>
        <span className="inline-flex items-center bg-amber-100 border border-amber-300 text-amber-700 rounded-full px-3 py-1 font-body text-xs shadow-[1px_1px_0_#A09A92]">
          useMutation()
        </span>
      </div>

      <Tabs defaultValue="demo" className="w-full">
        <TabsList className="bg-stone-200 border border-stone-300 rounded-xl p-1">
          <TabsTrigger
            value="demo"
            className="font-body rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Live Demo
          </TabsTrigger>
          <TabsTrigger
            value="learn"
            className="font-body rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Learn
          </TabsTrigger>
          <TabsTrigger
            value="code"
            className="font-body rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="demo" className="space-y-4 mt-4">
          <Card className="bg-white border-2 border-stone-800 rounded-2xl shadow-[4px_4px_0_#2D2A26]">
            <CardHeader>
              <CardTitle className="font-display text-xl text-stone-800">
                Todo Items (with 10% failure rate)
              </CardTitle>
              <CardDescription className="font-body text-stone-500">
                Add items to see optimistic updates. Some may fail to
                demonstrate rollback.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Form */}
              <form onSubmit={handleCreate} className="flex gap-3">
                <input
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="Enter a new item..."
                  className="flex-1 px-4 py-2 rounded-xl border-2 border-stone-800 font-body text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 shadow-[2px_2px_0_#2D2A26]"
                />
                <Button
                  type="submit"
                  disabled={createMutation.isPending || !newItemText.trim()}
                  className="bg-amber-400 hover:bg-amber-500 text-stone-800 font-body font-semibold border-2 border-stone-800 rounded-xl shadow-[3px_3px_0_#2D2A26] hover:shadow-[2px_2px_0_#2D2A26] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </form>

              {/* Mutation Status */}
              {createMutation.isError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <p className="font-body text-sm text-rose-700">
                    {createMutation.error instanceof Error
                      ? createMutation.error.message
                      : "Failed to create item"}{" "}
                    - <strong>Rolled back!</strong>
                  </p>
                </div>
              )}

              {/* Items List */}
              {isLoading ? (
                <div className="h-40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                </div>
              ) : items.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-stone-400 border-2 border-dashed border-stone-300 rounded-xl">
                  <Database className="w-10 h-10 mb-2 opacity-30" />
                  <p className="font-body text-sm">
                    No items yet. Add one above!
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border-2 transition-all",
                        item.id.startsWith("temp-")
                          ? "bg-amber-50 border-amber-300 border-dashed"
                          : "bg-white border-stone-300"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {item.id.startsWith("temp-") ? (
                          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        )}
                        <span className="font-body text-sm text-stone-700">
                          {item.text}
                        </span>
                        {item.id.startsWith("temp-") && (
                          <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                            Optimistic
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(item.id)}
                        disabled={
                          deleteMutation.isPending ||
                          item.id.startsWith("temp-")
                        }
                        className="text-stone-400 hover:text-rose-500 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              {isFetching && !isLoading && (
                <p className="font-body text-xs text-stone-500 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Syncing with server...
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="learn" className="mt-4 space-y-4">
          {/* What is Optimistic Update? */}
          <LearnCard
            icon={<Zap className="w-5 h-5 text-amber-500" />}
            title="What is an Optimistic Update?"
            color="amber"
          >
            <p className="mb-3">
              An <strong>optimistic update</strong> means updating the UI <em>before</em> the server confirms success.
              You're "optimistic" that the server will accept the change.
            </p>
            <div className="grid md:grid-cols-2 gap-3 mb-3">
              <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                <p className="font-semibold text-rose-800 text-sm mb-1">Without optimistic updates:</p>
                <ol className="text-xs text-stone-600 list-decimal list-inside">
                  <li>User clicks "Add"</li>
                  <li>Show loading spinner</li>
                  <li>Wait for server response</li>
                  <li>Update UI (feels slow!)</li>
                </ol>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="font-semibold text-emerald-800 text-sm mb-1">With optimistic updates:</p>
                <ol className="text-xs text-stone-600 list-decimal list-inside">
                  <li>User clicks "Add"</li>
                  <li>Update UI immediately</li>
                  <li>Send request in background</li>
                  <li>Rollback if failed (rare)</li>
                </ol>
              </div>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="font-semibold text-amber-800 text-sm mb-1">Real-life examples:</p>
              <ul className="text-sm text-stone-600 list-disc list-inside">
                <li>Twitter: Like button turns red immediately</li>
                <li>Gmail: Email moves to trash instantly</li>
                <li>Notion: Text appears as you type (not after save)</li>
              </ul>
            </div>
          </LearnCard>

          {/* The Mutation Lifecycle */}
          <LearnCard
            icon={<Activity className="w-5 h-5 text-violet-500" />}
            title="The Mutation Lifecycle"
            color="violet"
          >
            <p className="mb-3">useMutation has four key callbacks:</p>
            <div className="space-y-2 mb-3">
              <div className="p-2 bg-amber-50 rounded border border-amber-200">
                <code className="text-xs font-semibold text-amber-800">onMutate</code>
                <p className="text-xs text-stone-600">Runs BEFORE the API call. Save current state, do optimistic update.</p>
              </div>
              <div className="p-2 bg-emerald-50 rounded border border-emerald-200">
                <code className="text-xs font-semibold text-emerald-800">onSuccess</code>
                <p className="text-xs text-stone-600">Runs when the API call succeeds. Update cache with real server data.</p>
              </div>
              <div className="p-2 bg-rose-50 rounded border border-rose-200">
                <code className="text-xs font-semibold text-rose-800">onError</code>
                <p className="text-xs text-stone-600">Runs when the API call fails. Rollback to saved state!</p>
              </div>
              <div className="p-2 bg-blue-50 rounded border border-blue-200">
                <code className="text-xs font-semibold text-blue-800">onSettled</code>
                <p className="text-xs text-stone-600">Runs after success OR error. Good place to invalidate queries.</p>
              </div>
            </div>
          </LearnCard>

          {/* When to use optimistic updates */}
          <LearnCard
            icon={<Lightbulb className="w-5 h-5 text-emerald-500" />}
            title="When should I use optimistic updates?"
            color="emerald"
          >
            <p className="mb-3 font-semibold text-emerald-800">Use optimistic updates when:</p>
            <ul className="list-disc list-inside space-y-1 mb-3 text-stone-600">
              <li>The action <strong>usually succeeds</strong> (90%+ success rate)</li>
              <li>The change is <strong>reversible</strong> (can rollback)</li>
              <li>Users expect <strong>instant feedback</strong> (social actions, todos)</li>
              <li>Network latency would <strong>hurt UX</strong></li>
            </ul>
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
              <p className="font-semibold text-rose-800 text-sm mb-1">Avoid optimistic updates for:</p>
              <ul className="text-sm text-stone-600 list-disc list-inside">
                <li>Payment processing (needs server confirmation)</li>
                <li>Actions with complex validation</li>
                <li>Irreversible operations (account deletion)</li>
              </ul>
            </div>
          </LearnCard>
        </TabsContent>

        <TabsContent value="code" className="mt-4">
          <Card className="bg-stone-900 text-stone-100 border-2 border-stone-700 rounded-2xl">
            <CardContent className="p-0">
              <pre className="p-4 overflow-x-auto text-xs leading-relaxed font-mono">
                <code>{`import { useMutation, useQueryClient } from '@tanstack/react-query';

function AddItem() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch('/api/items', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      return res.json();
    },

    // Optimistic update - runs before API call
    onMutate: async (text) => {
      // Cancel ongoing fetches
      await queryClient.cancelQueries({ queryKey: ['items'] });

      // Save current state for rollback
      const previous = queryClient.getQueryData(['items']);

      // Optimistically add item
      queryClient.setQueryData(['items'], (old) => ({
        items: [{ id: 'temp', text, status: 'pending' }, ...old.items],
      }));

      return { previous }; // Context for rollback
    },

    // Rollback on error
    onError: (err, text, context) => {
      queryClient.setQueryData(['items'], context.previous);
    },

    // Refetch to sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  return (
    <button onClick={() => mutation.mutate('New item')}>
      {mutation.isPending ? 'Adding...' : 'Add Item'}
    </button>
  );
}`}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}

// ============================================================================
// Example 4: Request Deduplication
// ============================================================================

function DeduplicationExample() {
  const [componentCount, setComponentCount] = useState(1);

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl text-stone-800 flex items-center gap-2">
            <Database className="w-6 h-6 text-violet-500" />
            Example 4: Request Deduplication
          </h3>
          <p className="font-body text-sm text-stone-500 mt-1">
            Multiple components using the same query share one request
          </p>
        </div>
        <span className="inline-flex items-center bg-violet-100 border border-violet-300 text-violet-700 rounded-full px-3 py-1 font-body text-xs shadow-[1px_1px_0_#A09A92]">
          Shared Cache
        </span>
      </div>

      <Tabs defaultValue="demo" className="w-full">
        <TabsList className="bg-stone-200 border border-stone-300 rounded-xl p-1">
          <TabsTrigger
            value="demo"
            className="font-body rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Live Demo
          </TabsTrigger>
          <TabsTrigger
            value="learn"
            className="font-body rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Learn
          </TabsTrigger>
          <TabsTrigger
            value="code"
            className="font-body rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="demo" className="space-y-4 mt-4">
          <Card className="bg-white border-2 border-stone-800 rounded-2xl shadow-[4px_4px_0_#2D2A26]">
            <CardHeader>
              <CardTitle className="font-display text-xl text-stone-800">
                Shared Health Query
              </CardTitle>
              <CardDescription className="font-body text-stone-500">
                Add components that all use the same query - only one network
                request!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Controls */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setComponentCount((c) => Math.min(c + 1, 4))}
                  disabled={componentCount >= 4}
                  className="bg-violet-500 hover:bg-violet-600 text-white font-body font-semibold border-2 border-stone-800 rounded-xl shadow-[3px_3px_0_#2D2A26] hover:shadow-[2px_2px_0_#2D2A26] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Component
                </Button>
                <Button
                  onClick={() => setComponentCount((c) => Math.max(c - 1, 1))}
                  disabled={componentCount <= 1}
                  variant="outline"
                  className="border-2 border-stone-800 rounded-xl"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>

              <div className="p-3 rounded-xl bg-violet-50 border border-violet-200">
                <p className="font-body text-xs text-violet-700 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  {componentCount} component(s) sharing queryKey: ['health'].
                  Check Network tab - only 1 request!
                </p>
              </div>

              {/* Multiple components using same query */}
              <div className="grid md:grid-cols-2 gap-3">
                {Array.from({ length: componentCount }).map((_, i) => (
                  <SharedHealthDisplay key={i} instanceId={i + 1} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="learn" className="mt-4 space-y-4">
          {/* What is request deduplication? */}
          <LearnCard
            icon={<Database className="w-5 h-5 text-violet-500" />}
            title="What is Request Deduplication?"
            color="violet"
          >
            <p className="mb-3">
              When multiple components use the <strong>same queryKey</strong>, TanStack Query is smart enough to:
            </p>
            <ol className="list-decimal list-inside space-y-1 mb-3 text-stone-600">
              <li>Make only <strong>ONE network request</strong></li>
              <li><strong>Share the result</strong> with all components</li>
              <li>Keep them <strong>all in sync</strong> automatically</li>
            </ol>
            <div className="p-3 bg-violet-50 rounded-lg border border-violet-200">
              <p className="font-semibold text-violet-800 text-sm mb-1">Why does this matter?</p>
              <p className="text-sm text-stone-600">
                Without deduplication, if you render a user avatar in the header, sidebar, AND footer,
                you'd make 3 identical API calls. With TanStack Query, you make 1 call and all 3 components
                get the same data instantly.
              </p>
            </div>
          </LearnCard>

          {/* Real-life examples */}
          <LearnCard
            icon={<Lightbulb className="w-5 h-5 text-amber-500" />}
            title="Real-life examples of deduplication"
            color="amber"
          >
            <p className="mb-3 font-semibold">Common scenarios where this helps:</p>
            <ul className="list-disc list-inside space-y-2 mb-3 text-stone-600">
              <li>
                <strong>User data:</strong> Profile photo in header, settings dropdown, and sidebar -
                all use <code className="bg-stone-200 px-1 rounded">['user', userId]</code>
              </li>
              <li>
                <strong>Shopping cart:</strong> Cart icon count, checkout page, and mini-cart -
                all use <code className="bg-stone-200 px-1 rounded">['cart']</code>
              </li>
              <li>
                <strong>Notifications:</strong> Badge count and notification dropdown -
                all use <code className="bg-stone-200 px-1 rounded">['notifications']</code>
              </li>
              <li>
                <strong>Feature flags:</strong> Multiple components checking the same flag -
                all use <code className="bg-stone-200 px-1 rounded">['features']</code>
              </li>
            </ul>
          </LearnCard>

          {/* How it works */}
          <LearnCard
            icon={<RefreshCw className="w-5 h-5 text-blue-500" />}
            title="How does it stay in sync?"
            color="blue"
          >
            <p className="mb-3">
              All components "subscribe" to the same cache entry. When the cache updates, <strong>all subscribers
              re-render automatically</strong>.
            </p>
            <div className="grid md:grid-cols-2 gap-3 mb-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="font-semibold text-blue-800 text-sm mb-1">Manual update:</p>
                <code className="text-xs">queryClient.setQueryData(['user'], newData)</code>
                <p className="text-xs text-stone-500 mt-1">All components using ['user'] update instantly</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="font-semibold text-blue-800 text-sm mb-1">Invalidation:</p>
                <code className="text-xs">{`queryClient.invalidateQueries({ queryKey: ['user'] })`}</code>
                <p className="text-xs text-stone-500 mt-1">Triggers refetch, all components get fresh data</p>
              </div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="font-semibold text-emerald-800 text-sm mb-1">Try it in the demo:</p>
              <p className="text-sm text-stone-600">
                Open your browser's Network tab, add multiple components, and watch - only one request is made!
                All components show the exact same "Cached at" time.
              </p>
            </div>
          </LearnCard>
        </TabsContent>

        <TabsContent value="code" className="mt-4">
          <Card className="bg-stone-900 text-stone-100 border-2 border-stone-700 rounded-2xl">
            <CardContent className="p-0">
              <pre className="p-4 overflow-x-auto text-xs leading-relaxed font-mono">
                <code>{`// Component A uses the health query
function HeaderHealth() {
  const { data } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  });
  return <span>{data?.status}</span>;
}

// Component B uses the SAME query
function SidebarHealth() {
  const { data } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  });
  return <span>{data?.region}</span>;
}

// Component C also uses the SAME query
function FooterHealth() {
  const { data } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  });
  return <span>Uptime: {data?.uptime}</span>;
}

// All 3 components share ONE network request!
// TanStack Query deduplicates identical queries
// and broadcasts the result to all subscribers.`}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}

function SharedHealthDisplay({ instanceId }: { instanceId: number }) {
  const { data, isLoading, dataUpdatedAt } = useQuery<HealthData>({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await fetch("/api/tanstack-demo/health");
      if (!res.ok) throw new Error("Failed to fetch health");
      return res.json();
    },
    staleTime: 10000,
  });

  return (
    <div className="p-3 rounded-xl bg-white border-2 border-stone-300 animate-in fade-in duration-200">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-body text-xs font-semibold">
          {instanceId}
        </div>
        <span className="font-body text-xs text-stone-500">
          Component #{instanceId}
        </span>
      </div>
      {isLoading ? (
        <div className="flex items-center gap-2 text-stone-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span className="text-xs">Loading...</span>
        </div>
      ) : data ? (
        <div className="space-y-1 text-xs font-body">
          <p className="text-stone-700">
            Status: <strong className="text-emerald-600">{data.status}</strong>
          </p>
          <p className="text-stone-500">
            Cached at: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "-"}
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ============================================================================
// Example 5: WebSocket + Query Integration
// ============================================================================

function WebSocketQueryExample({ sessionId }: { sessionId: string }) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // WebSocket connection via useAgent
  const agent = useAgent({
    agent: "research-agent",
    name: sessionId,
    onOpen: () => {
      setIsConnected(true);
      setMessages((m) => [...m, "Connected to agent"]);
    },
    onClose: () => {
      setIsConnected(false);
      setMessages((m) => [...m, "Disconnected"]);
    },
    onMessage: (message) => {
      try {
        const data = JSON.parse(message.data);
        if (data.type === "state_update") {
          // Invalidate queries when agent state changes
          queryClient.invalidateQueries({ queryKey: ["stats"] });
          setMessages((m) => [
            ...m,
            `State update received - invalidating queries`,
          ]);
        } else if (data.type === "chunk") {
          setMessages((m) => [...m, `Received: ${data.content.slice(0, 50)}...`]);
        }
      } catch {
        setMessages((m) => [...m, `Raw: ${message.data.slice(0, 50)}...`]);
      }
    },
    onError: () => {
      setMessages((m) => [...m, "WebSocket error"]);
    },
  });

  const handleInvalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["stats"] });
    setMessages((m) => [...m, "Manually invalidated stats queries"]);
  };

  const handleSendMessage = () => {
    if (agent) {
      agent.send(JSON.stringify({ city: "Tokyo, Japan" }));
      setMessages((m) => [...m, "Sent message to agent"]);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl text-stone-800 flex items-center gap-2">
            <Wifi className="w-6 h-6 text-cyan-500" />
            Example 5: WebSocket + Query Integration
          </h3>
          <p className="font-body text-sm text-stone-500 mt-1">
            Use WebSocket events to invalidate and update query cache
          </p>
        </div>
        <span className="inline-flex items-center bg-cyan-100 border border-cyan-300 text-cyan-700 rounded-full px-3 py-1 font-body text-xs shadow-[1px_1px_0_#A09A92]">
          useAgent + useQueryClient
        </span>
      </div>

      <Tabs defaultValue="demo" className="w-full">
        <TabsList className="bg-stone-200 border border-stone-300 rounded-xl p-1">
          <TabsTrigger
            value="demo"
            className="font-body rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Live Demo
          </TabsTrigger>
          <TabsTrigger
            value="learn"
            className="font-body rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Learn
          </TabsTrigger>
          <TabsTrigger
            value="code"
            className="font-body rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="demo" className="space-y-4 mt-4">
          <Card className="bg-white border-2 border-stone-800 rounded-2xl shadow-[4px_4px_0_#2D2A26]">
            <CardHeader>
              <CardTitle className="font-display text-xl text-stone-800 flex items-center gap-2">
                WebSocket + Query Cache
                {isConnected ? (
                  <span className="flex items-center gap-1 text-emerald-600 text-sm font-body font-normal">
                    <Wifi className="w-4 h-4" />
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-stone-400 text-sm font-body font-normal">
                    <WifiOff className="w-4 h-4" />
                    Disconnected
                  </span>
                )}
              </CardTitle>
              <CardDescription className="font-body text-stone-500">
                WebSocket events can trigger query invalidation for real-time
                sync
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Actions */}
              <div className="flex gap-3 flex-wrap">
                <Button
                  onClick={handleSendMessage}
                  disabled={!isConnected}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white font-body font-semibold border-2 border-stone-800 rounded-xl shadow-[3px_3px_0_#2D2A26] hover:shadow-[2px_2px_0_#2D2A26] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Send to Agent
                </Button>
                <Button
                  onClick={handleInvalidateQueries}
                  variant="outline"
                  className="border-2 border-stone-800 rounded-xl"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Invalidate Stats
                </Button>
              </div>

              {/* Log */}
              <div className="p-4 rounded-xl bg-stone-100 border-2 border-stone-300 h-40 overflow-y-auto font-mono text-xs">
                {messages.length === 0 ? (
                  <p className="text-stone-400">
                    WebSocket events will appear here...
                  </p>
                ) : (
                  messages.map((msg, i) => (
                    <p key={i} className="text-stone-600">
                      <span className="text-stone-400">
                        [{new Date().toLocaleTimeString()}]
                      </span>{" "}
                      {msg}
                    </p>
                  ))
                )}
              </div>

              <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200">
                <p className="font-body text-xs text-cyan-700 flex items-start gap-2">
                  <Info className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>
                    <strong>Pattern:</strong> When the agent sends a state
                    update via WebSocket, call{" "}
                    <code className="bg-cyan-100 px-1 rounded">
                      queryClient.invalidateQueries()
                    </code>{" "}
                    to trigger a refetch. This combines real-time updates with
                    efficient caching.
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="learn" className="mt-4 space-y-4">
          {/* Why combine WebSocket + Query? */}
          <LearnCard
            icon={<Wifi className="w-5 h-5 text-cyan-500" />}
            title="Why combine WebSocket + Query?"
            color="cyan"
          >
            <p className="mb-3">
              WebSockets and TanStack Query solve <strong>different problems</strong>. Combining them gives you the best of both:
            </p>
            <div className="grid md:grid-cols-2 gap-3 mb-3">
              <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                <p className="font-semibold text-cyan-800 text-sm mb-1">WebSocket (useAgent)</p>
                <ul className="text-xs text-stone-600 list-disc list-inside">
                  <li>Real-time push notifications</li>
                  <li>Instant bi-directional communication</li>
                  <li>Agent state synchronization</li>
                </ul>
              </div>
              <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                <p className="font-semibold text-rose-800 text-sm mb-1">TanStack Query</p>
                <ul className="text-xs text-stone-600 list-disc list-inside">
                  <li>Caching & deduplication</li>
                  <li>Automatic retries</li>
                  <li>Loading/error states</li>
                </ul>
              </div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="font-semibold text-emerald-800 text-sm mb-1">The pattern:</p>
              <p className="text-sm text-stone-600">
                WebSocket tells you <em>"something changed"</em>, then Query <em>efficiently fetches</em> the new data
                with all its caching benefits. You don't send the actual data over WebSocket - just a notification!
              </p>
            </div>
          </LearnCard>

          {/* Two approaches */}
          <LearnCard
            icon={<Activity className="w-5 h-5 text-violet-500" />}
            title="Two ways to update the cache"
            color="violet"
          >
            <p className="mb-3">When you receive a WebSocket message, you have two options:</p>
            <div className="space-y-3 mb-3">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="font-semibold text-amber-800 text-sm">Option 1: Invalidate (recommended)</p>
                <code className="text-xs block my-2 bg-white p-2 rounded">{`queryClient.invalidateQueries({ queryKey: ['stats'] })`}</code>
                <p className="text-xs text-stone-600">
                  Marks data as stale and triggers a refetch. Best when you don't have the new data in the WebSocket message.
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="font-semibold text-blue-800 text-sm">Option 2: Direct update</p>
                <code className="text-xs block my-2 bg-white p-2 rounded">{`queryClient.setQueryData(['stats'], newData)`}</code>
                <p className="text-xs text-stone-600">
                  Directly updates the cache. Best when the WebSocket message contains the complete new data.
                </p>
              </div>
            </div>
          </LearnCard>

          {/* Real-life examples */}
          <LearnCard
            icon={<Lightbulb className="w-5 h-5 text-amber-500" />}
            title="Real-life examples"
            color="amber"
          >
            <ul className="space-y-3 text-stone-600">
              <li className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <strong className="text-amber-800">Collaborative editing (Notion, Google Docs)</strong>
                <p className="text-sm">WebSocket: "Document changed by user X". Query: Fetch latest document state.</p>
              </li>
              <li className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <strong className="text-amber-800">Live dashboard (Analytics, Monitoring)</strong>
                <p className="text-sm">WebSocket: "New data point received". Query: Refresh chart data.</p>
              </li>
              <li className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <strong className="text-amber-800">Chat with AI agent (this project!)</strong>
                <p className="text-sm">WebSocket: Agent streams response in real-time. Query: Cache conversation history.</p>
              </li>
              <li className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <strong className="text-amber-800">E-commerce inventory</strong>
                <p className="text-sm">WebSocket: "Stock level changed". Query: Refresh product availability.</p>
              </li>
            </ul>
          </LearnCard>
        </TabsContent>

        <TabsContent value="code" className="mt-4">
          <Card className="bg-stone-900 text-stone-100 border-2 border-stone-700 rounded-2xl">
            <CardContent className="p-0">
              <pre className="p-4 overflow-x-auto text-xs leading-relaxed font-mono">
                <code>{`import { useQueryClient } from '@tanstack/react-query';
import { useAgent } from 'agents/react';

function RealTimeStats({ sessionId }) {
  const queryClient = useQueryClient();

  // WebSocket for real-time events
  const agent = useAgent({
    agent: 'research-agent',
    name: sessionId,
    onMessage: (message) => {
      const data = JSON.parse(message.data);

      if (data.type === 'state_update') {
        // When agent state changes, invalidate cached data
        // This triggers a refetch of the stats query
        queryClient.invalidateQueries({ queryKey: ['stats'] });
      }

      // Alternatively, update cache directly:
      if (data.type === 'new_stat') {
        queryClient.setQueryData(['stats', 'users'], (old) => ({
          ...old,
          total: data.newTotal,
        }));
      }
    },
  });

  // Query for stats (will refetch when invalidated)
  const { data } = useQuery({
    queryKey: ['stats', 'users'],
    queryFn: fetchUserStats,
  });

  return <StatsDisplay data={data} />;
}

// Benefits of this pattern:
// 1. WebSocket handles real-time notifications
// 2. Query handles caching & deduplication
// 3. Best of both worlds!`}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function LearnCard({
  icon,
  title,
  color,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  color: "orange" | "blue" | "violet" | "amber" | "emerald" | "cyan" | "rose";
  children: React.ReactNode;
}) {
  const borderColors = {
    orange: "border-orange-300",
    blue: "border-blue-300",
    violet: "border-violet-300",
    amber: "border-amber-300",
    emerald: "border-emerald-300",
    cyan: "border-cyan-300",
    rose: "border-rose-300",
  };

  const bgColors = {
    orange: "bg-orange-50",
    blue: "bg-blue-50",
    violet: "bg-violet-50",
    amber: "bg-amber-50",
    emerald: "bg-emerald-50",
    cyan: "bg-cyan-50",
    rose: "bg-rose-50",
  };

  return (
    <Card className={cn("border-2 rounded-2xl", borderColors[color], bgColors[color])}>
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-lg text-stone-800 flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="font-body text-sm text-stone-700">
        {children}
      </CardContent>
    </Card>
  );
}

function StatusBadge({
  active,
  label,
  color,
}: {
  active: boolean;
  label: string;
  color: "amber" | "blue" | "orange" | "green" | "red";
}) {
  const colors = {
    amber: "bg-amber-100 text-amber-700 border-amber-300",
    blue: "bg-blue-100 text-blue-700 border-blue-300",
    orange: "bg-orange-100 text-orange-700 border-orange-300",
    green: "bg-emerald-100 text-emerald-700 border-emerald-300",
    red: "bg-rose-100 text-rose-700 border-rose-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full font-body text-xs border transition-all",
        active ? colors[color] : "bg-stone-100 text-stone-400 border-stone-200"
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          active
            ? color === "amber"
              ? "bg-amber-500 animate-pulse"
              : color === "blue"
                ? "bg-blue-500 animate-pulse"
                : color === "orange"
                  ? "bg-orange-500"
                  : color === "green"
                    ? "bg-emerald-500"
                    : "bg-rose-500"
            : "bg-stone-300"
        )}
      />
      {label}
    </span>
  );
}

// ============================================================================
// Error Boundary
// ============================================================================

export function ErrorBoundary({ error }: { error: unknown }) {
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
            className="bg-rose-500 hover:bg-rose-600 text-white font-body font-semibold border-2 border-stone-800 rounded-xl shadow-[3px_3px_0_#2D2A26]"
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
