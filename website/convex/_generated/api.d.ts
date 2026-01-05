/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auditLogs from "../auditLogs.js";
import type * as customers from "../customers.js";
import type * as dashboard from "../dashboard.js";
import type * as dispatch from "../dispatch.js";
import type * as drivers from "../drivers.js";
import type * as finance from "../finance.js";
import type * as googleMaps from "../googleMaps.js";
import type * as inventory from "../inventory.js";
import type * as migrations from "../migrations.js";
import type * as orders from "../orders.js";
import type * as payments from "../payments.js";
import type * as products from "../products.js";
import type * as routes from "../routes.js";
import type * as settings from "../settings.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auditLogs: typeof auditLogs;
  customers: typeof customers;
  dashboard: typeof dashboard;
  dispatch: typeof dispatch;
  drivers: typeof drivers;
  finance: typeof finance;
  googleMaps: typeof googleMaps;
  inventory: typeof inventory;
  migrations: typeof migrations;
  orders: typeof orders;
  payments: typeof payments;
  products: typeof products;
  routes: typeof routes;
  settings: typeof settings;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
