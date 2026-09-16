import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

/**
 * Returns a configured Stripe instance.
 * Safe for build time: will only initialize when called at runtime.
 */
export function getStripe(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      'STRIPE_SECRET_KEY is not defined in environment variables. Please add it to your .env.local file.'
    );
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia' as any,
    appInfo: {
      name: 'Michigan AI Business Conference 2026 Ticketing',
      version: '1.0.0',
    },
  });

  return stripeClient;
}

export default getStripe;
