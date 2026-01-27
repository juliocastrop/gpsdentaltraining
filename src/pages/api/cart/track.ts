/**
 * Track Cart API - GPS Dental Training
 * Tracks cart contents for abandoned cart recovery
 * Called from frontend when cart changes
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase/client';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      sessionId,
      cartContents,
      cartTotal,
      itemCount,
      email,
      firstName,
      lastName,
      userId,
      sourceUrl,
      utmSource,
      utmMedium,
      utmCampaign,
    } = body;

    if (!sessionId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Session ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if cart already exists for this session
    const { data: existingCart } = await supabaseAdmin
      .from('abandoned_carts')
      .select('id, status')
      .eq('session_id', sessionId)
      .single();

    // Calculate cart hash for deduplication
    const cartHash = await calculateCartHash(cartContents);

    if (existingCart) {
      // Update existing cart
      if (existingCart.status === 'abandoned' || existingCart.status === 'notified') {
        const { error: updateError } = await supabaseAdmin
          .from('abandoned_carts')
          .update({
            cart_contents: cartContents,
            cart_total: cartTotal,
            item_count: itemCount,
            cart_hash: cartHash,
            email: email || undefined,
            first_name: firstName || undefined,
            last_name: lastName || undefined,
            user_id: userId || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingCart.id);

        if (updateError) {
          console.error('Error updating cart:', updateError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to update cart' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, cartId: existingCart.id, action: 'updated' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Cart already recovered/converted, don't update
      return new Response(
        JSON.stringify({ success: true, cartId: existingCart.id, action: 'skipped' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create new cart entry
    const recoveryToken = generateRecoveryToken();

    const { data: newCart, error: insertError } = await supabaseAdmin
      .from('abandoned_carts')
      .insert({
        session_id: sessionId,
        cart_contents: cartContents,
        cart_total: cartTotal,
        item_count: itemCount,
        cart_hash: cartHash,
        email: email || null,
        first_name: firstName || null,
        last_name: lastName || null,
        user_id: userId || null,
        recovery_token: recoveryToken,
        source_url: sourceUrl || null,
        utm_source: utmSource || null,
        utm_medium: utmMedium || null,
        utm_campaign: utmCampaign || null,
        status: 'abandoned',
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating cart:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create cart' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, cartId: newCart?.id, action: 'created' }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Cart tracking error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

function generateRecoveryToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

async function calculateCartHash(cartContents: unknown): Promise<string> {
  const text = JSON.stringify(cartContents);
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
