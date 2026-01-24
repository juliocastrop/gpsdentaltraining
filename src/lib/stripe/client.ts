import Stripe from 'stripe';

const stripeSecretKey = import.meta.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY is not configured');
}

export const stripe = new Stripe(stripeSecretKey || '', {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

export const getStripePublishableKey = () => {
  return import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
};
