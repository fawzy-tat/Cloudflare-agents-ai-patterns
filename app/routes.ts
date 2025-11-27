import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("direct-agent", "routes/direct-agent.tsx"),
	route("http-streaming", "routes/http-streaming.tsx"),
	route("http-streaming-initiate", "routes/http-streaming-initiate.tsx"),
	route("http-direct", "routes/http-direct.tsx"),
] satisfies RouteConfig;
