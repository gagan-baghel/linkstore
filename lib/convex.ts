import { ConvexHttpClient } from "convex/browser"
import { makeFunctionReference } from "convex/server"

declare global {
  var __convexClient: ConvexHttpClient | undefined
}

function getConvexUrl() {
  return process.env.CONVEX_URL?.trim()
}

function getConvexClient() {
  const url = getConvexUrl()
  if (!url) {
    throw new Error("Please define CONVEX_URL in your environment.")
  }

  if (!global.__convexClient) {
    global.__convexClient = new ConvexHttpClient(url)
  }

  return global.__convexClient
}

export async function convexQuery<TArgs extends Record<string, any>, TResult>(
  name: string,
  args: TArgs,
): Promise<TResult> {
  const client = getConvexClient()
  const ref = makeFunctionReference<"query", TArgs, TResult>(name) as any
  return client.query(ref, args as any)
}

export async function convexMutation<TArgs extends Record<string, any>, TResult>(
  name: string,
  args: TArgs,
): Promise<TResult> {
  const client = getConvexClient()
  const ref = makeFunctionReference<"mutation", TArgs, TResult>(name) as any
  return client.mutation(ref, args as any)
}

export async function convexAction<TArgs extends Record<string, any>, TResult>(
  name: string,
  args: TArgs,
): Promise<TResult> {
  const client = getConvexClient()
  const ref = makeFunctionReference<"action", TArgs, TResult>(name) as any
  return client.action(ref, args as any)
}
