import { stripe } from './client';
import { getTicketTypeById, getEventById } from '../supabase/queries';
import type { Stripe } from 'stripe';

interface CartItem {
  ticketTypeId: string;
  eventId: string;
  quantity: number;
}

interface CheckoutSessionParams {
  items: CartItem[];
  customerEmail?: string;
  userId?: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession({
  items,
  customerEmail,
  userId,
  successUrl,
  cancelUrl,
}: CheckoutSessionParams): Promise<Stripe.Checkout.Session> {
  // Build line items
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  for (const item of items) {
    const ticketType = await getTicketTypeById(item.ticketTypeId);
    const event = await getEventById(item.eventId);

    if (!ticketType || !event) {
      throw new Error(`Invalid ticket type or event: ${item.ticketTypeId}`);
    }

    // If ticket has Stripe price ID, use it; otherwise create price data
    if (ticketType.stripe_price_id) {
      lineItems.push({
        price: ticketType.stripe_price_id,
        quantity: item.quantity,
      });
    } else {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${event.title} - ${ticketType.name}`,
            description: `${ticketType.name} ticket for ${event.title}`,
            metadata: {
              event_id: event.id,
              ticket_type_id: ticketType.id,
            },
          },
          unit_amount: Math.round(ticketType.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      });
    }
  }

  // Build metadata for webhook processing
  const metadata: Record<string, string> = {
    items: JSON.stringify(items),
  };

  if (userId) {
    metadata.user_id = userId;
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: lineItems,
    customer_email: customerEmail,
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata,
    billing_address_collection: 'required',
    phone_number_collection: {
      enabled: true,
    },
    custom_fields: [
      {
        key: 'attendee_name',
        label: {
          type: 'custom',
          custom: 'Attendee Name (if different from billing)',
        },
        type: 'text',
        optional: true,
      },
    ],
    // Allow guest checkout
    customer_creation: 'if_required',
  });

  return session;
}

export async function retrieveCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'customer', 'payment_intent'],
  });
}

export async function getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.retrieve(paymentIntentId);
}
