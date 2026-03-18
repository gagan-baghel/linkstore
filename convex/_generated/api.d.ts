/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as auditLogs from "../auditLogs.js";
import type * as billing from "../billing.js";
import type * as clicks from "../clicks.js";
import type * as crons from "../crons.js";
import type * as events from "../events.js";
import type * as linkHealth from "../linkHealth.js";
import type * as products from "../products.js";
import type * as stores from "../stores.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  auditLogs: typeof auditLogs;
  billing: typeof billing;
  clicks: typeof clicks;
  crons: typeof crons;
  events: typeof events;
  linkHealth: typeof linkHealth;
  products: typeof products;
  stores: typeof stores;
  subscriptions: typeof subscriptions;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
