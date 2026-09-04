import Stripe from "stripe";
import { unavailable } from "./errors.mjs";

export const createStripeClient = (env = process.env) => {
  const key = String(env.STRIPE_RESTRICTED_KEY || "").trim();
  if (!/^rk_(?:test|live)_/.test(key)) throw unavailable("The Office Stripe connection is not configured with a restricted key.");
  return new Stripe(key, {
    apiVersion: "2026-07-29.dahlia",
    maxNetworkRetries: 2,
    timeout: 10_000,
    appInfo: { name: "Integrity Office", version: "1.0.0" },
  });
};
