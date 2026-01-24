import type { APIRoute } from 'astro';
import { stripe } from '../../../lib/stripe/client';
import {
  createOrder,
  updateOrderStatus,
  createTicket,
  getOrderByStripeSession,
  getTicketTypeById,
  getEventById,
  getSeminarWithFullData,
  createSeminarRegistration,
  getUserSeminarRegistration,
  getUpcomingSeminarSessions,
} from '../../../lib/supabase/queries';
import { generateAndStoreQRCode } from '../../../lib/qrcode/generator';
import { generateSeminarQRCodeWithString } from '../../../lib/qrcode/seminar';
import {
  sendTicketConfirmationEmail,
  sendSeminarRegistrationEmail,
} from '../../../lib/email/sender';
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

  // Check if this is a seminar purchase
  const purchaseType = session.metadata?.purchase_type;
  if (purchaseType === 'seminar') {
    await handleSeminarPurchase(session);
    return;
  }

  // Parse items from metadata (for event tickets)
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

      // Generate QR code for ticket
      let qrCodeUrl = '';
      try {
        const qrResult = await generateAndStoreQRCode(
          ticket.id,
          ticket.ticket_code,
          item.eventId
        );
        qrCodeUrl = qrResult.qrCodeUrl;
        console.log('Generated QR code for ticket:', ticket.ticket_code, qrCodeUrl);
      } catch (qrError) {
        console.error('Failed to generate QR code for ticket:', ticket.ticket_code, qrError);
        // Continue even if QR generation fails - ticket is still valid
      }

      // Send ticket confirmation email
      const attendeeEmail = session.customer_details?.email || session.customer_email;
      if (attendeeEmail) {
        try {
          const emailResult = await sendTicketConfirmationEmail(attendeeEmail, {
            attendeeName: session.customer_details?.name || 'Guest',
            eventTitle: event.title,
            eventDate: new Date(event.start_date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            eventVenue: event.venue || 'TBD',
            ticketCode: ticket.ticket_code,
            ticketType: ticketType.name,
            qrCodeUrl: qrCodeUrl,
            orderNumber: order.order_number,
          });
          console.log('Sent ticket email:', emailResult.success ? 'success' : emailResult.error);
        } catch (emailError) {
          console.error('Failed to send ticket email:', emailError);
          // Continue even if email fails - ticket is still valid
        }
      }
    }
  }

  console.log('Order and tickets created successfully for session:', session.id);
}

/**
 * Handle seminar purchase - create registration with QR code
 */
async function handleSeminarPurchase(session: Stripe.Checkout.Session) {
  console.log('Processing seminar purchase:', session.id);

  const seminarId = session.metadata?.seminar_id;
  const userId = session.metadata?.user_id;

  if (!seminarId) {
    throw new Error('No seminar_id in session metadata');
  }

  // Calculate total from session
  const total = (session.amount_total || 0) / 100;

  // Create order record
  const order = await createOrder({
    user_id: userId || undefined,
    stripe_session_id: session.id,
    billing_email: session.customer_details?.email || session.customer_email || '',
    billing_name: session.customer_details?.name || undefined,
    total,
  });

  // Update order status
  if (session.payment_intent) {
    await updateOrderStatus(order.id, 'completed', 'paid');
  }

  // Check if user already has a registration
  if (userId) {
    const existingReg = await getUserSeminarRegistration(userId, seminarId);
    if (existingReg) {
      console.log('User already has registration for seminar:', seminarId);
      return;
    }
  }

  // Get upcoming sessions to determine start date
  const upcomingSessions = await getUpcomingSeminarSessions(seminarId, 1);
  const startSessionDate = upcomingSessions.length > 0
    ? upcomingSessions[0].session_date
    : null;

  // Generate QR code for seminar registration
  const { qrCode: qrCodeString, qrCodeUrl } = await generateSeminarQRCodeWithString();

  // Create seminar registration
  if (userId) {
    const registration = await createSeminarRegistration({
      user_id: userId,
      seminar_id: seminarId,
      order_id: order.id,
      start_session_date: startSessionDate || undefined,
      qr_code: qrCodeString,
      qr_code_url: qrCodeUrl,
    });

    console.log('Created seminar registration:', registration.id, 'QR:', qrCodeString);

    // Send seminar registration confirmation email
    const attendeeEmail = session.customer_details?.email || session.customer_email;
    if (attendeeEmail) {
      try {
        // Get seminar details for email
        const seminar = await getSeminarWithFullData(seminarId);

        if (seminar) {
          const emailResult = await sendSeminarRegistrationEmail(attendeeEmail, {
            attendeeName: session.customer_details?.name || 'Member',
            seminarTitle: seminar.title || 'GPS Monthly Seminars',
            seminarYear: seminar.year || new Date().getFullYear(),
            totalSessions: 10,
            creditsPerSession: 2,
            totalCredits: 20,
            qrCodeUrl: qrCodeUrl,
            qrCode: qrCodeString,
            orderNumber: order.order_number,
            firstSessionDate: startSessionDate
              ? new Date(startSessionDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : undefined,
            price: total,
          });
          console.log('Sent seminar registration email:', emailResult.success ? 'success' : emailResult.error);
        }
      } catch (emailError) {
        console.error('Failed to send seminar registration email:', emailError);
        // Continue even if email fails - registration is still valid
      }
    }
  } else {
    console.log('No user_id for seminar purchase - registration will need to be created manually or via guest linking');
  }

  console.log('Seminar purchase processed successfully for session:', session.id);
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
