import { createStripeWebhookHandler } from "../server/stripe-webhook.mjs";

export const handler = createStripeWebhookHandler();
