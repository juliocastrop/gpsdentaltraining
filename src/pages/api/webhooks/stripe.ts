import type { APIRoute } from 'astro';
import { stripe } from '../../../lib/stripe/client';
import {
  createOrder,
  updateOrderStatus,
  createTicket,
  getOrderByStripeSession,
  getTicketTypeById,
  getEventById,
} from '../../../lib/supabase/queries';
import type Stripe from 'stripe';

const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !webhookSecret) {
    return new Response('Webhook signature or secret missing', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`, {
      status: 400,
    });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object as Stripe.Charge);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook handler failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout.session.completed:', session.id);

  // Check if order already exists
  try {
    const existingOrder = await getOrderByStripeSession(session.id);
    if (existingOrder) {
      console.log('Order already exists for session:', session.id);
      return;
    }
  } catch {
    // Order doesn't exist, continue creating
  }

  // Parse items from metadata
  const itemsJson = session.metadata?.items;
  if (!itemsJson) {
    throw new Error('No items in session metadata');
  }

  const items = JSON.parse(itemsJson) as Array<{
    ticketTypeId: string;
    eventId: string;
    quantity: number;
  }>;

  // Calculate total from session
  const total = (session.amount_total || 0) / 100;

  // Create order
  const order = await createOrder({
    user_id: session.metadata?.user_id || undefined,
    stripe_session_id: session.id,
    billing_email: session.customer_details?.email || session.customer_email || '',
    billing_name: session.customer_details?.name || undefined,
    total,
  });

  // Update order with payment intent
  if (session.payment_intent) {
    await updateOrderStatus(
      order.id,
      'completed',
      'paid'
    );
  }

  // Create tickets for each item
  for (const item of items) {
    const ticketType = await getTicketTypeById(item.ticketTypeId);
    const event = await getEventById(item.eventId);

    if (!ticketType || !event) {
      console.error('Invalid ticket type or event:', item);
      continue;
    }

    // Create individual tickets based on quantity
    for (let i = 0; i < item.quantity; i++) {
      const ticket = await createTicket({
        ticket_type_id: item.ticketTypeId,
        event_id: item.eventId,
        order_id: order.id,
        user_id: session.metadata?.user_id || undefined,
        attendee_name: session.customer_details?.name || 'Guest',
        attendee_email: session.customer_details?.email || session.customer_email || '',
      });

      console.log('Created ticket:', ticket.ticket_code);

      // TODO: Generate QR code for ticket
      // TODO: Send ticket email with Resend
    }
  }

  console.log('Order and tickets created successfully for session:', session.id);
}

async function handleRefund(charge: Stripe.Charge) {
  console.log('Processing refund for charge:', charge.id);

  // Find the associated order
  const paymentIntentId = typeof charge.payment_intent === 'string'
    ? charge.payment_intent
    : charge.payment_intent?.id;

  if (!paymentIntentId) {
    console.error('No payment intent found for charge:', charge.id);
    return;
  }

  // TODO: Find order by payment intent and update status
  // TODO: Cancel associated tickets
  // TODO: Notify waitlist if applicable
  // TODO: Send refund confirmation email

  console.log('Refund processed for charge:', charge.id);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed for intent:', paymentIntent.id);

  // TODO: Find pending order and mark as failed
  // TODO: Send payment failed notification email

  console.log('Payment failure handled for intent:', paymentIntent.id);
}
