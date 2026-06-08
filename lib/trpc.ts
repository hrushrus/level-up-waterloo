import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink, httpLink } from "@trpc/client";
import superjson from "superjson";
import { Platform } from "react-native";
import type { AppRouter } from "@/server/routers";
import { getApiBaseUrl } from "@/constants/oauth";
import * as Auth from "@/lib/_core/auth";

/**
 * tRPC React client for type-safe API calls.
 *
 * IMPORTANT (tRPC v11): The `transformer` must be inside `httpBatchLink`,
 * NOT at the root createClient level. This ensures client and server
 * use the same serialization format (superjson).
 */
export const trpc = createTRPCReact<AppRouter>();

const linkOptions = {
  url: `${getApiBaseUrl()}/api/trpc`,
  transformer: superjson,
  async headers() {
    const token = await Auth.getSessionToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
  fetch(url: RequestInfo | URL, options?: RequestInit) {
    return fetch(url, {
      ...options,
      credentials: Platform.OS === "web" ? "include" : "omit",
    });
  },
};

/**
 * Creates the tRPC client with proper configuration.
 * Call this once in your app's root layout.
 */
export function createTRPCClient() {
  return trpc.createClient({
    links: [
      Platform.OS === "web" ? httpBatchLink(linkOptions) : httpLink(linkOptions),
    ],
  });
}
