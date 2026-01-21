/**
 * GPS Dental Training - Clerk Webhooks
 * Handles user sync between Clerk and Supabase
 */
import type { APIRoute } from 'astro';
import { Webhook } from 'svix';
import { supabaseAdmin } from '../../../lib/supabase/client';
import type { InsertUser, UserRole } from '../../../types/database';

// Clerk webhook event types
interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{
      id: string;
      email_address: string;
      verification?: { status: string };
    }>;
    first_name: string | null;
    last_name: string | null;
    phone_numbers: Array<{
      id: string;
      phone_number: string;
    }>;
    public_metadata: Record<string, unknown>;
    created_at: number;
    updated_at: number;
  };
}

export const POST: APIRoute = async ({ request }) => {
  const webhookSecret = import.meta.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET not configured');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  // Get the headers and body
  const svixId = request.headers.get('svix-id');
  const svixTimestamp = request.headers.get('svix-timestamp');
  const svixSignature = request.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const body = await request.text();

  // Verify the webhook
  const wh = new Webhook(webhookSecret);
  let event: ClerkWebhookEvent;

  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new Response('Webhook verification failed', { status: 400 });
  }

  // Process the event
  const { type, data } = event;

  console.log(`Clerk webhook received: ${type}`);

  try {
    switch (type) {
      case 'user.created': {
        await handleUserCreated(data);
        break;
      }
      case 'user.updated': {
        await handleUserUpdated(data);
        break;
      }
      case 'user.deleted': {
        await handleUserDeleted(data.id);
        break;
      }
      default:
        console.log(`Unhandled webhook type: ${type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Error processing webhook', { status: 500 });
  }
};

/**
 * Handle user.created event - create user in Supabase
 */
async function handleUserCreated(data: ClerkWebhookEvent['data']) {
  const primaryEmail = data.email_addresses.find(
    (email) => email.verification?.status === 'verified'
  )?.email_address || data.email_addresses[0]?.email_address;

  if (!primaryEmail) {
    console.error('No email found for user:', data.id);
    return;
  }

  const primaryPhone = data.phone_numbers[0]?.phone_number || null;
  const role = (data.public_metadata?.role as UserRole) || 'customer';

  const userData: InsertUser = {
    clerk_id: data.id,
    email: primaryEmail,
    first_name: data.first_name || undefined,
    last_name: data.last_name || undefined,
    phone: primaryPhone || undefined,
    role,
  };

  // Check if user already exists (by email or clerk_id)
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .or(`clerk_id.eq.${data.id},email.eq.${primaryEmail}`)
    .maybeSingle();

  if (existingUser) {
    // Update existing user with clerk_id
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        clerk_id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: primaryPhone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingUser.id);

    if (error) {
      console.error('Error updating existing user:', error);
      throw error;
    }

    console.log(`Updated existing user: ${existingUser.id} with Clerk ID: ${data.id}`);
  } else {
    // Create new user
    const { error } = await supabaseAdmin.from('users').insert(userData);

    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }

    console.log(`Created new user with Clerk ID: ${data.id}`);
  }

  // Link any guest orders to this user
  await linkGuestOrders(primaryEmail, data.id);
}

/**
 * Handle user.updated event - update user in Supabase
 */
async function handleUserUpdated(data: ClerkWebhookEvent['data']) {
  const primaryEmail = data.email_addresses.find(
    (email) => email.verification?.status === 'verified'
  )?.email_address || data.email_addresses[0]?.email_address;

  const primaryPhone = data.phone_numbers[0]?.phone_number || null;
  const role = (data.public_metadata?.role as UserRole) || 'customer';

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      email: primaryEmail,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: primaryPhone,
      role,
      updated_at: new Date().toISOString(),
    })
    .eq('clerk_id', data.id);

  if (error) {
    console.error('Error updating user:', error);
    throw error;
  }

  console.log(`Updated user with Clerk ID: ${data.id}`);
}

/**
 * Handle user.deleted event - soft delete or anonymize user in Supabase
 */
async function handleUserDeleted(clerkId: string) {
  // We don't actually delete the user to preserve order history
  // Instead, we clear their clerk_id and anonymize PII
  const { error } = await supabaseAdmin
    .from('users')
    .update({
      clerk_id: null,
      email: `deleted-${clerkId}@deleted.gpsdentaltraining.com`,
      first_name: 'Deleted',
      last_name: 'User',
      phone: null,
      updated_at: new Date().toISOString(),
    })
    .eq('clerk_id', clerkId);

  if (error) {
    console.error('Error soft-deleting user:', error);
    throw error;
  }

  console.log(`Soft-deleted user with Clerk ID: ${clerkId}`);
}

/**
 * Link guest orders to the newly created/linked user
 * This handles cases where a user purchased as a guest before creating an account
 */
async function linkGuestOrders(email: string, clerkId: string) {
  // Get the user ID from Supabase
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single();

  if (!user) {
    console.log('User not found for linking orders');
    return;
  }

  // Link orders with matching email that have no user_id
  const { data: linkedOrders, error: ordersError } = await supabaseAdmin
    .from('orders')
    .update({ user_id: user.id })
    .eq('billing_email', email)
    .is('user_id', null)
    .select('id');

  if (ordersError) {
    console.error('Error linking orders:', ordersError);
    return;
  }

  if (linkedOrders && linkedOrders.length > 0) {
    console.log(`Linked ${linkedOrders.length} guest orders to user ${user.id}`);

    // Also link the tickets from these orders
    for (const order of linkedOrders) {
      await supabaseAdmin
        .from('tickets')
        .update({ user_id: user.id })
        .eq('order_id', order.id)
        .is('user_id', null);
    }
  }
}
