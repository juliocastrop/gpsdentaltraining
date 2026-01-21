import type { APIRoute } from 'astro';
import { createCheckoutSession } from '../../../lib/stripe/checkout';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { items, customerEmail, userId } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cart items are required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate items structure
    for (const item of items) {
      if (!item.ticketTypeId || !item.eventId || !item.quantity) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid item format. Required: ticketTypeId, eventId, quantity',
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const baseUrl = import.meta.env.PUBLIC_APP_URL || 'http://localhost:4321';

    const session = await createCheckoutSession({
      items,
      customerEmail,
      userId,
      successUrl: `${baseUrl}/checkout/success`,
      cancelUrl: `${baseUrl}/checkout/cancel`,
    });

    return new Response(JSON.stringify({
      success: true,
      sessionId: session.id,
      url: session.url,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create checkout session',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
