import { ConvexHttpClient } from "convex/browser"
import { makeFunctionReference } from "convex/server"

declare global {
  // eslint-disable-next-line no-var
  var __convexClient: ConvexHttpClient | undefined
}

function getConvexUrl() {
  const privateUrl = process.env.CONVEX_URL?.trim()
  if (privateUrl) return privateUrl

  if (process.env.NODE_ENV === "development") {
    return process.env.NEXT_PUBLIC_CONVEX_URL?.trim()
  }

  return undefined
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
