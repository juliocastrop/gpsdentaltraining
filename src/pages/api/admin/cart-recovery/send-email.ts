/**
 * Send Cart Recovery Email API - GPS Dental Training
 * Manually trigger a recovery email for an abandoned cart
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase/client';
import { getResend } from '../../../../lib/email/client';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { cartId, templateId } = body;

    if (!cartId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cart ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get cart details
    const { data: cart, error: cartError } = await supabaseAdmin
      .from('abandoned_carts')
      .select('*')
      .eq('id', cartId)
      .single();

    if (cartError || !cart) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cart not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!cart.email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cart has no email address' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get next email template in sequence
    const sequenceNumber = (cart.emails_sent || 0) + 1;

    const { data: template, error: templateError } = await supabaseAdmin
      .from('cart_recovery_templates')
      .select('*')
      .eq('sequence_order', templateId ? undefined : sequenceNumber)
      .eq('id', templateId || undefined)
      .eq('is_active', true)
      .single();

    if (templateError && !templateId) {
      // Try to get any active template
      const { data: anyTemplate } = await supabaseAdmin
        .from('cart_recovery_templates')
        .select('*')
        .eq('is_active', true)
        .order('sequence_order', { ascending: true })
        .limit(1)
        .single();

      if (!anyTemplate) {
        return new Response(
          JSON.stringify({ success: false, error: 'No active email templates found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const emailTemplate = template || (await supabaseAdmin
      .from('cart_recovery_templates')
      .select('*')
      .eq('is_active', true)
      .order('sequence_order', { ascending: true })
      .limit(1)
      .single()).data;

    if (!emailTemplate) {
      return new Response(
        JSON.stringify({ success: false, error: 'No email template available' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate coupon if template requires it
    let couponCode = cart.coupon_code;
    if (emailTemplate.include_coupon && !couponCode) {
      couponCode = generateCouponCode();
      await supabaseAdmin
        .from('abandoned_carts')
        .update({ coupon_code: couponCode })
        .eq('id', cart.id);
    }

    // Build recovery URL
    const recoveryUrl = `${import.meta.env.PUBLIC_SITE_URL || 'https://gpsdentaltraining.com'}/api/cart/recover/${cart.recovery_token}`;

    // Replace template variables
    const htmlContent = replaceTemplateVariables(emailTemplate.html_content, {
      first_name: cart.first_name || 'there',
      last_name: cart.last_name || '',
      email: cart.email,
      cart_total: formatCurrency(cart.cart_total),
      cart_items: formatCartItems(cart.cart_contents),
      checkout_url: recoveryUrl,
      coupon_code: couponCode || '',
      unsubscribe_url: `${import.meta.env.PUBLIC_SITE_URL || 'https://gpsdentaltraining.com'}/unsubscribe?email=${encodeURIComponent(cart.email)}`,
    });

    const subject = replaceTemplateVariables(emailTemplate.subject, {
      first_name: cart.first_name || 'there',
    });

    // Send email via Resend
    const { data: emailResult, error: emailError } = await getResend().emails.send({
      from: 'GPS Dental Training <noreply@gpsdentaltraining.com>',
      to: cart.email,
      subject: subject,
      html: htmlContent,
      text: emailTemplate.text_content || stripHtml(htmlContent),
    });

    if (emailError) {
      console.error('Error sending email:', emailError);

      // Log failed email
      await supabaseAdmin
        .from('cart_recovery_emails')
        .insert({
          cart_id: cart.id,
          template_id: emailTemplate.id,
          to_email: cart.email,
          subject: subject,
          sequence_number: sequenceNumber,
          status: 'failed',
          error_message: emailError.message,
        });

      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send email' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Log sent email
    await supabaseAdmin
      .from('cart_recovery_emails')
      .insert({
        cart_id: cart.id,
        template_id: emailTemplate.id,
        to_email: cart.email,
        subject: subject,
        sequence_number: sequenceNumber,
        status: 'sent',
        sent_at: new Date().toISOString(),
        resend_message_id: emailResult?.id,
      });

    // Update cart
    await supabaseAdmin
      .from('abandoned_carts')
      .update({
        emails_sent: sequenceNumber,
        last_email_sent_at: new Date().toISOString(),
        status: 'notified',
        email_sequence_completed: sequenceNumber >= 3,
      })
      .eq('id', cart.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Recovery email sent successfully',
        emailId: emailResult?.id,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Send email error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

function generateCouponCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SAVE';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatCartItems(items: Array<{ name: string; price: number; quantity: number }>): string {
  if (!items || items.length === 0) {
    return '<p>Your cart items</p>';
  }

  return items
    .map(
      (item) =>
        `<div style="padding: 10px 0; border-bottom: 1px solid #eee;">
          <strong>${item.name}</strong><br>
          Qty: ${item.quantity} - ${formatCurrency(item.price * item.quantity)}
        </div>`
    )
    .join('');
}

function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
