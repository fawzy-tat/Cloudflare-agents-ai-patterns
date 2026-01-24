import { useState } from "react";
import { useNavigate, isRouteErrorResponse } from "react-router";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import type { Route } from "./+types/object-streaming";
import {
  recipeSchema,
  heroesArraySchema,
  classificationSchema,
  type Recipe,
  type Hero,
  type Classification,
} from "~/schemas";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  ArrowLeft,
  ChefHat,
  Swords,
  Tags,
  Play,
  Code,
  Sparkles,
  Clock,
  Users,
  Heart,
  Zap,
  Brain,
  Shield,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { cn } from "~/lib/utils";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Vercel AI SDK: streamObject() Demo" },
    {
      name: "description",
      content:
        "Learn how to use streamObject() for structured data streaming with Vercel AI SDK",
    },
  ];
}

// ============================================================================
// Main Component
// ============================================================================

export default function VercelAIMethodsPage() {
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
                <span className="w-8 h-8 bg-amber-400 border-2 border-stone-800 rounded-lg flex items-center justify-center shadow-[2px_2px_0_#2D2A26]">
                  <Code className="w-4 h-4 text-stone-800" />
                </span>
                streamObject() Demo
              </h1>
              <p className="font-body text-stone-500 text-sm">
                Learn how to use streamObject() for structured data streaming
              </p>
            </div>
          </div>
          <span className="inline-flex items-center bg-amber-100 border border-amber-300 text-stone-700 rounded-full px-3 py-1 font-body text-xs shadow-[1px_1px_0_#A09A92]">
            Direct LLM Calls (No Agent)
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-12">
        {/* Intro Section */}
        <section className="max-w-3xl space-y-4">
          <h2 className="font-display text-3xl text-stone-800">
            Understanding{" "}
            <code className="text-amber-600 bg-amber-100 px-2 py-1 rounded-lg border border-amber-300">
              streamObject()
            </code>
          </h2>
          <p className="font-body text-stone-600 leading-relaxed">
            The{" "}
            <code className="text-sm bg-stone-200 px-1.5 py-0.5 rounded border border-stone-300">
              streamObject()
            </code>{" "}
            function from Vercel AI SDK streams typed, structured objects from
            an LLM. Unlike text streaming, it provides{" "}
            <strong>partial objects</strong> as they're generated, allowing your
            UI to progressively display structured data. This is perfect for:
          </p>
          <ul className="grid md:grid-cols-3 gap-3 text-sm">
            <li className="flex items-center gap-2 p-4 rounded-xl bg-white border-2 border-stone-800 shadow-[3px_3px_0_#2D2A26]">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="font-body text-stone-700">
                Structured data generation
              </span>
            </li>
            <li className="flex items-center gap-2 p-4 rounded-xl bg-white border-2 border-stone-800 shadow-[3px_3px_0_#2D2A26]">
              <Tags className="w-4 h-4 text-amber-500" />
              <span className="font-body text-stone-700">
                Classification tasks
              </span>
            </li>
            <li className="flex items-center gap-2 p-4 rounded-xl bg-white border-2 border-stone-800 shadow-[3px_3px_0_#2D2A26]">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="font-body text-stone-700">
                Progressive UI updates
              </span>
            </li>
          </ul>
        </section>

        <Separator className="bg-stone-300" />

        {/* Example 1: Recipe Generation */}
        <RecipeExample />

        <Separator className="bg-stone-300" />

        {/* Example 2: Hero Array Generation */}
        <HeroesExample />

        <Separator className="bg-stone-300" />

        {/* Example 3: Classification */}
        <ClassifyExample />
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
// Example 1: Recipe Generation (Object Schema)
// ============================================================================

function RecipeExample() {
  const [cuisine, setCuisine] = useState("Italian");

  // useObject hook from @ai-sdk/react handles streaming automatically
  const { object, submit, isLoading, error, stop } = useObject({
    api: "/api/stream-object/recipe",
    schema: recipeSchema,
  });

  const handleGenerate = () => {
    submit({ cuisine });
  };

  // Cast to proper type - useObject returns DeepPartial<T>
  const recipe = (object as Recipe | undefined)?.recipe;

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl text-stone-800 flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-amber-500" />
            Example 1: Stream Object (Recipe Generation)
          </h3>
          <p className="font-body text-sm text-stone-500 mt-1">
            Streams a structured recipe object with nested arrays. Watch as each
            field populates progressively.
          </p>
        </div>
        <span className="inline-flex items-center bg-amber-100 border border-amber-300 text-amber-700 rounded-full px-3 py-1 font-body text-xs shadow-[1px_1px_0_#A09A92]">
          output: 'object'
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
            value="code"
            className="font-body rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Frontend Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="demo" className="space-y-4 mt-4">
          <Card className="bg-white border-2 border-stone-800 rounded-2xl shadow-[4px_4px_0_#2D2A26]">
            <CardHeader>
              <CardTitle className="font-display text-xl text-stone-800">
                Generate a Recipe
              </CardTitle>
              <CardDescription className="font-body text-stone-500">
                Select a cuisine type and watch the recipe stream in real-time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Select value={cuisine} onValueChange={setCuisine}>
                  <SelectTrigger className="w-[200px] border-2 border-stone-800 rounded-xl shadow-[2px_2px_0_#2D2A26]">
                    <SelectValue placeholder="Select cuisine" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-stone-800 rounded-xl">
                    <SelectItem value="Italian">Italian</SelectItem>
                    <SelectItem value="Japanese">Japanese</SelectItem>
                    <SelectItem value="Mexican">Mexican</SelectItem>
                    <SelectItem value="Indian">Indian</SelectItem>
                    <SelectItem value="Thai">Thai</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="bg-amber-400 hover:bg-amber-500 text-stone-800 font-body font-semibold border-2 border-stone-800 rounded-xl shadow-[3px_3px_0_#2D2A26] hover:shadow-[2px_2px_0_#2D2A26] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Streaming...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Generate Recipe
                    </>
                  )}
                </Button>
                {isLoading && (
                  <Button
                    variant="outline"
                    onClick={stop}
                    className="border-2 border-stone-800 rounded-xl"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                )}
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border-2 border-dashed border-rose-300 rounded-xl text-rose-700 font-body text-sm">
                  {error.message}
                </div>
              )}

              {/* Recipe Display */}
              {recipe && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Header Info */}
                  <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300">
                    <h4 className="font-display text-2xl text-stone-800">
                      {recipe.name || (
                        <span className="animate-pulse bg-amber-200 rounded h-6 w-48 inline-block" />
                      )}
                    </h4>
                    {recipe.cuisine && (
                      <span className="inline-flex items-center mt-2 bg-amber-100 border border-amber-300 text-amber-700 rounded-full px-2 py-0.5 text-xs font-body">
                        {recipe.cuisine}
                      </span>
                    )}
                    <div className="flex gap-4 mt-3 text-sm text-stone-500 font-body">
                      {recipe.prepTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Prep: {recipe.prepTime}
                        </span>
                      )}
                      {recipe.cookTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Cook: {recipe.cookTime}
                        </span>
                      )}
                      {recipe.servings && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Serves: {recipe.servings}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Ingredients */}
                    <div className="p-4 rounded-xl bg-white border-2 border-stone-300">
                      <h5 className="font-body font-semibold text-stone-800 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-amber-400 text-stone-800 flex items-center justify-center text-xs font-bold">
                          1
                        </span>
                        Ingredients
                      </h5>
                      <ul className="space-y-2 font-body text-sm">
                        {recipe.ingredients?.map((ing, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-stone-700 animate-in slide-in-from-left duration-200"
                            style={{ animationDelay: `${i * 50}ms` }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span className="font-medium">{ing.amount}</span>
                            {ing.unit && (
                              <span className="text-stone-500">{ing.unit}</span>
                            )}
                            <span>{ing.item}</span>
                          </li>
                        ))}
                        {isLoading &&
                          (!recipe.ingredients ||
                            recipe.ingredients.length === 0) && (
                            <li className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                              <span className="text-stone-500">
                                Loading ingredients...
                              </span>
                            </li>
                          )}
                      </ul>
                    </div>

                    {/* Steps */}
                    <div className="p-4 rounded-xl bg-white border-2 border-stone-300">
                      <h5 className="font-body font-semibold text-stone-800 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-amber-400 text-stone-800 flex items-center justify-center text-xs font-bold">
                          2
                        </span>
                        Instructions
                      </h5>
                      <ol className="space-y-3 font-body text-sm">
                        {recipe.steps?.map((step, i) => (
                          <li
                            key={i}
                            className="flex gap-3 text-stone-700 animate-in slide-in-from-right duration-200"
                            style={{ animationDelay: `${i * 100}ms` }}
                          >
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-medium">
                              {i + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                        {isLoading &&
                          (!recipe.steps || recipe.steps.length === 0) && (
                            <li className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                              <span className="text-stone-500">
                                Loading steps...
                              </span>
                            </li>
                          )}
                      </ol>
                    </div>
                  </div>

                  {/* Tips */}
                  {recipe.tips && recipe.tips.length > 0 && (
                    <div className="p-4 rounded-xl bg-amber-50 border-2 border-dashed border-amber-300">
                      <h5 className="font-body font-semibold text-amber-700 mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Pro Tips
                      </h5>
                      <ul className="space-y-1 text-sm text-stone-700 font-body">
                        {recipe.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span>•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {!recipe && !isLoading && !error && (
                <div className="h-40 flex flex-col items-center justify-center text-stone-400 border-2 border-dashed border-stone-300 rounded-xl">
                  <ChefHat className="w-12 h-12 mb-2 opacity-30" />
                  <p className="font-body text-sm">
                    Select a cuisine and generate a recipe
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="code" className="mt-4">
          <Card className="bg-stone-900 text-stone-100 border-2 border-stone-700 rounded-2xl">
            <CardContent className="p-0">
              <pre className="p-4 overflow-x-auto text-xs leading-relaxed font-mono">
                <code>{`// Frontend: Using useObject from @ai-sdk/react
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { z } from "zod";

// Define schema (same as backend)
const recipeSchema = z.object({
  recipe: z.object({
    name: z.string(),
    ingredients: z.array(z.object({
      item: z.string(),
      amount: z.string(),
    })),
    steps: z.array(z.string()),
  }),
});

function RecipeGenerator() {
  const [cuisine, setCuisine] = useState("Italian");
  
  // useObject handles streaming automatically!
  const { object, submit, isLoading, error, stop } = useObject({
    api: "/api/stream-object/recipe",
    schema: recipeSchema,
  });

  return (
    <div>
      <button onClick={() => submit({ cuisine })} disabled={isLoading}>
        {isLoading ? "Streaming..." : "Generate Recipe"}
      </button>
      
      {/* UI updates progressively as object streams in */}
      {object?.recipe?.name && <h2>{object.recipe.name}</h2>}
      {object?.recipe?.ingredients?.map((ing, i) => (
        <li key={i}>{ing.amount} {ing.item}</li>
      ))}
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
// Example 2: Hero Array Generation
// ============================================================================

function HeroesExample() {
  const [genre, setGenre] = useState("fantasy");
  const [count, setCount] = useState("4");

  // useObject for array streaming
  const { object, submit, isLoading, error, stop } = useObject({
    api: "/api/stream-object/heroes",
    schema: heroesArraySchema,
  });

  const handleGenerate = () => {
    submit({ genre, count: parseInt(count) });
  };

  // Cast to proper type - useObject returns DeepPartial<T>
  const heroes = (Array.isArray(object) ? object : []) as Hero[];

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl text-stone-800 flex items-center gap-2">
            <Swords className="w-6 h-6 text-rose-500" />
            Example 2: Stream Array (Hero Generation)
          </h3>
          <p className="font-body text-sm text-stone-500 mt-1">
            Streams an array of hero objects. Each complete hero appears as it's
            generated.
          </p>
        </div>
        <span className="inline-flex items-center bg-rose-100 border border-rose-300 text-rose-700 rounded-full px-3 py-1 font-body text-xs shadow-[1px_1px_0_#A09A92]">
          output: 'array'
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
            value="code"
            className="font-body rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Frontend Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="demo" className="space-y-4 mt-4">
          <Card className="bg-white border-2 border-stone-800 rounded-2xl shadow-[4px_4px_0_#2D2A26]">
            <CardHeader>
              <CardTitle className="font-display text-xl text-stone-800">
                Generate RPG Heroes
              </CardTitle>
              <CardDescription className="font-body text-stone-500">
                Create a party of unique heroes with stats, skills, and
                backstories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 flex-wrap">
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger className="w-[150px] border-2 border-stone-800 rounded-xl shadow-[2px_2px_0_#2D2A26]">
                    <SelectValue placeholder="Genre" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-stone-800 rounded-xl">
                    <SelectItem value="fantasy">Fantasy</SelectItem>
                    <SelectItem value="sci-fi">Sci-Fi</SelectItem>
                    <SelectItem value="cyberpunk">Cyberpunk</SelectItem>
                    <SelectItem value="post-apocalyptic">
                      Post-Apocalyptic
                    </SelectItem>
                    <SelectItem value="steampunk">Steampunk</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={count} onValueChange={setCount}>
                  <SelectTrigger className="w-[120px] border-2 border-stone-800 rounded-xl shadow-[2px_2px_0_#2D2A26]">
                    <SelectValue placeholder="Count" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-stone-800 rounded-xl">
                    <SelectItem value="2">2 Heroes</SelectItem>
                    <SelectItem value="3">3 Heroes</SelectItem>
                    <SelectItem value="4">4 Heroes</SelectItem>
                    <SelectItem value="5">5 Heroes</SelectItem>
                    <SelectItem value="6">6 Heroes</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-body font-semibold border-2 border-stone-800 rounded-xl shadow-[3px_3px_0_#2D2A26] hover:shadow-[2px_2px_0_#2D2A26] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Swords className="w-4 h-4 mr-2" />
                      Generate Party
                    </>
                  )}
                </Button>
                {isLoading && (
                  <Button
                    variant="outline"
                    onClick={stop}
                    className="border-2 border-stone-800 rounded-xl"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                )}
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border-2 border-dashed border-rose-300 rounded-xl text-rose-700 font-body text-sm">
                  {error.message}
                </div>
              )}

              {/* Heroes Grid */}
              {heroes.length > 0 && (
                <div className="grid md:grid-cols-2 gap-4">
                  {heroes.map((hero, i) => (
                    <HeroCard key={i} hero={hero} index={i} />
                  ))}
                </div>
              )}

              {heroes.length === 0 && !isLoading && !error && (
                <div className="h-40 flex flex-col items-center justify-center text-stone-400 border-2 border-dashed border-stone-300 rounded-xl">
                  <Swords className="w-12 h-12 mb-2 opacity-30" />
                  <p className="font-body text-sm">
                    Configure and generate your hero party
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="code" className="mt-4">
          <Card className="bg-stone-900 text-stone-100 border-2 border-stone-700 rounded-2xl">
            <CardContent className="p-0">
              <pre className="p-4 overflow-x-auto text-xs leading-relaxed font-mono">
                <code>{`// Backend: Array streaming with output: 'array'
app.post("/api/stream-object/heroes", async (c) => {
  const { count, genre } = await c.req.json();

  const result = streamObject({
    model: openai("gpt-4o-mini"),
    output: "array", // Stream array elements
    schema: z.object({
      name: z.string(),
      class: z.string(),
      level: z.number(),
      skills: z.array(z.string()),
      stats: z.object({ strength: z.number(), ... }),
    }),
    prompt: \`Generate \${count} \${genre} RPG heroes.\`,
  });

  return result.toTextStreamResponse();
});

// Frontend: Using useObject with array schema
import { experimental_useObject as useObject } from "@ai-sdk/react";

const heroesSchema = z.array(z.object({
  name: z.string(),
  class: z.string(),
  level: z.number(),
  skills: z.array(z.string()),
}));

function HeroGenerator() {
  const { object, submit, isLoading } = useObject({
    api: "/api/stream-object/heroes",
    schema: heroesSchema,
  });
  
  const heroes = Array.isArray(object) ? object : [];
  
  return (
    <div>
      <button onClick={() => submit({ genre: "fantasy", count: 4 })}>
        Generate Heroes
      </button>
      {heroes.map((hero, i) => (
        <div key={i}>{hero.name} - {hero.class}</div>
      ))}
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

function HeroCard({ hero, index }: { hero: Hero; index: number }) {
  const classColors: Record<string, string> = {
    warrior: "bg-rose-100 text-rose-700 border-rose-300",
    mage: "bg-blue-100 text-blue-700 border-blue-300",
    rogue: "bg-stone-200 text-stone-700 border-stone-400",
    healer: "bg-green-100 text-green-700 border-green-300",
    ranger: "bg-emerald-100 text-emerald-700 border-emerald-300",
    paladin: "bg-amber-100 text-amber-700 border-amber-300",
  };

  const getClassColor = (heroClass?: string) => {
    if (!heroClass) return "bg-stone-100 border-stone-300";
    const key = heroClass.toLowerCase();
    for (const [cls, color] of Object.entries(classColors)) {
      if (key.includes(cls)) return color;
    }
    return "bg-rose-100 text-rose-700 border-rose-300";
  };

  return (
    <Card
      className="animate-in slide-in-from-bottom duration-300 bg-white border-2 border-stone-800 rounded-2xl shadow-[3px_3px_0_#2D2A26]"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg text-stone-800 flex items-center gap-2">
            {hero.name || "..."}
            {hero.level && (
              <span className="inline-flex items-center bg-stone-200 border border-stone-400 text-stone-600 rounded-full px-2 py-0.5 text-xs font-body">
                Lv.{hero.level}
              </span>
            )}
          </CardTitle>
          {hero.class && (
            <span
              className={cn(
                "inline-flex items-center border rounded-full px-2 py-0.5 text-xs font-body",
                getClassColor(hero.class)
              )}
            >
              {hero.class}
            </span>
          )}
        </div>
        {hero.race && (
          <CardDescription className="font-body text-xs text-stone-500">
            {hero.race}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3 text-sm font-body">
        {hero.backstory && (
          <p className="text-stone-500 italic text-xs leading-relaxed">
            "{hero.backstory}"
          </p>
        )}

        {/* Stats */}
        {hero.stats && (
          <div className="grid grid-cols-4 gap-2">
            <StatBadge
              label="STR"
              value={hero.stats.strength}
              icon={<Swords className="w-3 h-3" />}
            />
            <StatBadge
              label="AGI"
              value={hero.stats.agility}
              icon={<Zap className="w-3 h-3" />}
            />
            <StatBadge
              label="INT"
              value={hero.stats.intelligence}
              icon={<Brain className="w-3 h-3" />}
            />
            <StatBadge
              label="CHA"
              value={hero.stats.charisma}
              icon={<Heart className="w-3 h-3" />}
            />
          </div>
        )}

        {/* Skills */}
        {hero.skills && hero.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {hero.skills.map((skill, i) => (
              <span
                key={i}
                className="inline-flex items-center bg-stone-100 border border-stone-300 text-stone-600 rounded-full px-2 py-0.5 text-xs"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatBadge({
  label,
  value,
  icon,
}: {
  label: string;
  value?: number;
  icon: React.ReactNode;
}) {
  const getStatColor = (val?: number) => {
    if (!val) return "text-stone-400";
    if (val >= 16) return "text-emerald-600";
    if (val >= 12) return "text-blue-600";
    if (val >= 8) return "text-amber-600";
    return "text-rose-600";
  };

  return (
    <div className="flex flex-col items-center p-1.5 rounded-lg bg-stone-100 border border-stone-300">
      <div className="flex items-center gap-1 text-stone-500">
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
      </div>
      <span className={cn("text-sm font-bold", getStatColor(value))}>
        {value ?? "-"}
      </span>
    </div>
  );
}

// ============================================================================
// Example 3: Classification (Enum)
// ============================================================================

// Sample texts moved outside component for performance
const SAMPLE_TEXTS = {
  sentiment: [
    "I absolutely loved this product! Best purchase I've ever made!",
    "It's okay, nothing special but gets the job done.",
    "Terrible experience. Would not recommend to anyone.",
    "Mixed feelings - great quality but shipping was slow.",
  ],
  genre: [
    "A group of astronauts travel through a wormhole in search of a new habitable planet.",
    "Two rival families in fair Verona where we lay our scene...",
    "A serial killer sends taunting letters to the detective hunting him.",
    "A young wizard discovers he has magical powers on his 11th birthday.",
  ],
  priority: [
    "URGENT: Production server is down, affecting all customers!",
    "Feature request: Would be nice to have dark mode.",
    "Bug report: Button color looks slightly off on mobile.",
    "Critical security vulnerability discovered in authentication system.",
  ],
} as const;

function ClassifyExample() {
  const [classificationType, setClassificationType] = useState<
    "sentiment" | "genre" | "priority"
  >("sentiment");
  const [inputText, setInputText] = useState("");

  // useObject for classification streaming
  const { object, submit, isLoading, error, stop } = useObject({
    api: "/api/stream-object/classify",
    schema: classificationSchema,
  });

  const sampleTexts = SAMPLE_TEXTS;

  const handleClassify = () => {
    if (!inputText.trim()) return;
    submit({
      text: inputText,
      classificationType,
    });
  };

  const resultDisplay: Record<
    string,
    { color: string; icon: React.ReactNode }
  > = {
    // Sentiment
    very_positive: {
      color: "bg-emerald-500",
      icon: <Heart className="w-4 h-4" />,
    },
    positive: { color: "bg-green-500", icon: <Heart className="w-4 h-4" /> },
    neutral: { color: "bg-stone-400", icon: <Shield className="w-4 h-4" /> },
    negative: { color: "bg-amber-500", icon: <Zap className="w-4 h-4" /> },
    very_negative: { color: "bg-rose-500", icon: <Zap className="w-4 h-4" /> },
    // Priority
    critical: { color: "bg-rose-600", icon: <Zap className="w-4 h-4" /> },
    high: { color: "bg-amber-500", icon: <Zap className="w-4 h-4" /> },
    medium: { color: "bg-amber-400", icon: <Shield className="w-4 h-4" /> },
    low: { color: "bg-blue-500", icon: <Shield className="w-4 h-4" /> },
    none: { color: "bg-stone-400", icon: <Shield className="w-4 h-4" /> },
    // Genre
    action: { color: "bg-rose-500", icon: <Swords className="w-4 h-4" /> },
    comedy: { color: "bg-amber-400", icon: <Sparkles className="w-4 h-4" /> },
    drama: { color: "bg-purple-500", icon: <Heart className="w-4 h-4" /> },
    horror: { color: "bg-stone-700", icon: <Zap className="w-4 h-4" /> },
    "sci-fi": { color: "bg-blue-500", icon: <Brain className="w-4 h-4" /> },
    romance: { color: "bg-pink-500", icon: <Heart className="w-4 h-4" /> },
    thriller: { color: "bg-amber-600", icon: <Zap className="w-4 h-4" /> },
    documentary: { color: "bg-teal-500", icon: <Brain className="w-4 h-4" /> },
    animation: { color: "bg-cyan-500", icon: <Sparkles className="w-4 h-4" /> },
    fantasy: { color: "bg-violet-500", icon: <Sparkles className="w-4 h-4" /> },
  };

  // Extract classification from object response - cast to proper type
  const classificationObj = object as Classification | undefined;
  const result = classificationObj?.classification || null;
  const confidence = classificationObj?.confidence || null;
  const displayConfig = result ? resultDisplay[result] : null;

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl text-stone-800 flex items-center gap-2">
            <Tags className="w-6 h-6 text-teal-500" />
            Example 3: Stream Enum (Classification)
          </h3>
          <p className="font-body text-sm text-stone-500 mt-1">
            Classifies text into predefined categories. Perfect for sentiment
            analysis, tagging, or routing.
          </p>
        </div>
        <span className="inline-flex items-center bg-teal-100 border border-teal-300 text-teal-700 rounded-full px-3 py-1 font-body text-xs shadow-[1px_1px_0_#A09A92]">
          z.enum() schema
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
            value="code"
            className="font-body rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Frontend Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="demo" className="space-y-4 mt-4">
          <Card className="bg-white border-2 border-stone-800 rounded-2xl shadow-[4px_4px_0_#2D2A26]">
            <CardHeader>
              <CardTitle className="font-display text-xl text-stone-800">
                Classify Text
              </CardTitle>
              <CardDescription className="font-body text-stone-500">
                Choose a classification type and enter text to categorize
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 flex-wrap">
                <Select
                  value={classificationType}
                  onValueChange={(v) =>
                    setClassificationType(v as typeof classificationType)
                  }
                >
                  <SelectTrigger className="w-[150px] border-2 border-stone-800 rounded-xl shadow-[2px_2px_0_#2D2A26]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-stone-800 rounded-xl">
                    <SelectItem value="sentiment">Sentiment</SelectItem>
                    <SelectItem value="genre">Movie Genre</SelectItem>
                    <SelectItem value="priority">Task Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sample Texts */}
              <div className="space-y-2">
                <p className="font-body text-xs text-stone-500">
                  Try a sample or enter your own:
                </p>
                <div className="flex flex-wrap gap-2">
                  {sampleTexts[classificationType].map((text, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="font-body text-xs h-7 max-w-[200px] truncate border border-stone-300 rounded-lg"
                      onClick={() => setInputText(text)}
                    >
                      {text.slice(0, 40)}...
                    </Button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="space-y-2">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Enter text to classify..."
                  className="w-full h-24 p-3 font-body text-sm rounded-xl border-2 border-stone-800 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/50 shadow-[2px_2px_0_#2D2A26]"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleClassify}
                    disabled={isLoading || !inputText.trim()}
                    className="bg-teal-500 hover:bg-teal-600 text-white font-body font-semibold border-2 border-stone-800 rounded-xl shadow-[3px_3px_0_#2D2A26] hover:shadow-[2px_2px_0_#2D2A26] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Classifying...
                      </>
                    ) : (
                      <>
                        <Tags className="w-4 h-4 mr-2" />
                        Classify
                      </>
                    )}
                  </Button>
                  {isLoading && (
                    <Button
                      variant="outline"
                      onClick={stop}
                      className="border-2 border-stone-800 rounded-xl"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Stop
                    </Button>
                  )}
                  {inputText && !isLoading && (
                    <Button
                      variant="outline"
                      onClick={() => setInputText("")}
                      className="border-2 border-stone-800 rounded-xl"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border-2 border-dashed border-rose-300 rounded-xl text-rose-700 font-body text-sm">
                  {error.message}
                </div>
              )}

              {/* Result */}
              {result && displayConfig && (
                <div className="p-6 rounded-xl bg-teal-50 border-2 border-teal-300 animate-in zoom-in duration-200">
                  <div className="flex items-center justify-center gap-3">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center text-white",
                        displayConfig.color
                      )}
                    >
                      {displayConfig.icon}
                    </div>
                    <div>
                      <p className="font-body text-xs text-stone-500 uppercase tracking-wider">
                        Classification Result
                      </p>
                      <p className="font-display text-2xl text-stone-800 capitalize">
                        {result.replace(/_/g, " ")}
                      </p>
                      {confidence && (
                        <p className="font-body text-xs text-stone-500 mt-1">
                          Confidence:{" "}
                          <span className="font-medium capitalize">
                            {confidence}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Show streaming progress */}
              {isLoading && classificationObj && !result && (
                <div className="p-4 rounded-xl bg-teal-50 border-2 border-dashed border-teal-300">
                  <div className="flex items-center gap-2 text-sm text-teal-700 font-body">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="code" className="mt-4">
          <Card className="bg-stone-900 text-stone-100 border-2 border-stone-700 rounded-2xl">
            <CardContent className="p-0">
              <pre className="p-4 overflow-x-auto text-xs leading-relaxed font-mono">
                <code>{`// Backend: Classification using z.enum() in schema
app.post("/api/stream-object/classify", async (c) => {
  const { text, classificationType } = await c.req.json();

  const schema = z.object({
    classification: z.enum([
      "very_positive", "positive", "neutral", 
      "negative", "very_negative"
    ]),
    confidence: z.string().describe("high, medium, or low"),
  });

  const result = streamObject({
    model: openai("gpt-4o-mini"),
    schema,
    prompt: \`Analyze sentiment: "\${text}"\`,
  });

  return result.toTextStreamResponse();
});

// Frontend: Using useObject for classification
import { experimental_useObject as useObject } from "@ai-sdk/react";

const classificationSchema = z.object({
  classification: z.string(),
  confidence: z.string(),
});

function SentimentClassifier() {
  const [text, setText] = useState("");
  const { object, submit, isLoading } = useObject({
    api: "/api/stream-object/classify",
    schema: classificationSchema,
  });

  return (
    <div>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={() => submit({ text })}>
        Classify
      </button>
      {object?.classification && (
        <p>Result: {object.classification}</p>
      )}
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
// Error Boundary
// ============================================================================

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
        </CardContent>
      </Card>
    </div>
  );
}
