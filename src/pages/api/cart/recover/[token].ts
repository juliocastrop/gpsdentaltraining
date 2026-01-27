/**
 * Cart Recovery Link Handler - GPS Dental Training
 * Redirects user to checkout with their abandoned cart restored
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase/client';

export const GET: APIRoute = async ({ params, redirect }) => {
  try {
    const { token } = params;

    if (!token) {
      return redirect('/cart?error=invalid_link');
    }

    // Find cart by recovery token
    const { data: cart, error } = await supabaseAdmin
      .from('abandoned_carts')
      .select('*')
      .eq('recovery_token', token)
      .single();

    if (error || !cart) {
      console.error('Cart not found:', error);
      return redirect('/cart?error=cart_not_found');
    }

    // Check if cart is expired
    if (cart.expires_at && new Date(cart.expires_at) < new Date()) {
      await supabaseAdmin
        .from('abandoned_carts')
        .update({ status: 'expired' })
        .eq('id', cart.id);

      return redirect('/cart?error=cart_expired');
    }

    // Mark cart as being recovered (click tracked)
    await supabaseAdmin
      .from('abandoned_carts')
      .update({
        status: cart.status === 'abandoned' ? 'notified' : cart.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cart.id);

    // Track email click if there are sent emails
    await supabaseAdmin
      .from('cart_recovery_emails')
      .update({
        clicked_at: new Date().toISOString(),
        click_count: 1, // Will be incremented properly with SQL
      })
      .eq('cart_id', cart.id)
      .is('clicked_at', null);

    // Build checkout URL with cart data
    const cartItems = cart.cart_contents || [];
    const checkoutUrl = new URL('/checkout', 'https://gpsdentaltraining.com');

    // Add cart items as URL params or store in session
    checkoutUrl.searchParams.set('recover', cart.id);

    // If there's a coupon, add it
    if (cart.coupon_code) {
      checkoutUrl.searchParams.set('coupon', cart.coupon_code);
    }

    return redirect(checkoutUrl.pathname + checkoutUrl.search);
  } catch (error) {
    console.error('Cart recovery error:', error);
    return redirect('/cart?error=recovery_failed');
  }
};
