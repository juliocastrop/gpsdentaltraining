/**
 * Cart Recovery Cron Job - GPS Dental Training
 * Runs hourly to send recovery emails for abandoned carts
 *
 * Schedule: Every hour at minute 30
 * Vercel cron: "30 * * * *"
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase/client';
import { getResend } from '../../../lib/email/client';

export const GET: APIRoute = async ({ request }) => {
  // Verify cron secret (for Vercel cron jobs)
  const authHeader = request.headers.get('authorization');
  if (
    import.meta.env.CRON_SECRET &&
    authHeader !== `Bearer ${import.meta.env.CRON_SECRET}`
  ) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const results = {
    processed: 0,
    emailsSent: 0,
    errors: [] as string[],
  };

  try {
    // Get cart recovery settings
    const { data: settings } = await supabaseAdmin
      .from('cart_recovery_settings')
      .select('key, value');

    const settingsMap = new Map(
      settings?.map((s) => [s.key, s.value]) || []
    );

    const isEnabled = settingsMap.get('enabled') === true;
    const maxEmails = (settingsMap.get('max_emails_per_cart') as number) || 3;

    if (!isEnabled) {
      return new Response(
        JSON.stringify({ success: true, message: 'Cart recovery is disabled', results }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get active email templates
    const { data: templates } = await supabaseAdmin
      .from('cart_recovery_templates')
      .select('*')
      .eq('is_active', true)
      .order('sequence_order', { ascending: true });

    if (!templates || templates.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No active email templates', results }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Find carts that need recovery emails
    const now = new Date();

    for (const template of templates) {
      // Calculate the threshold for this template
      const thresholdHours = template.delay_hours;
      const threshold = new Date(now.getTime() - thresholdHours * 60 * 60 * 1000);

      // Find carts that:
      // 1. Are abandoned or notified status
      // 2. Have email address
      // 3. Were abandoned before the threshold
      // 4. Haven't received this sequence number yet
      // 5. Haven't completed the email sequence
      const { data: eligibleCarts } = await supabaseAdmin
        .from('abandoned_carts')
        .select('*')
        .in('status', ['abandoned', 'notified'])
        .not('email', 'is', null)
        .lt('abandoned_at', threshold.toISOString())
        .lt('emails_sent', template.sequence_order)
        .eq('email_sequence_completed', false)
        .limit(50); // Process in batches

      for (const cart of eligibleCarts || []) {
        results.processed++;

        try {
          // Check if we should send this specific template
          if (cart.emails_sent >= template.sequence_order) {
            continue;
          }

          // For templates after the first, check if enough time has passed since last email
          if (cart.emails_sent > 0 && cart.last_email_sent_at) {
            const lastEmailDate = new Date(cart.last_email_sent_at);
            const hoursSinceLastEmail =
              (now.getTime() - lastEmailDate.getTime()) / (60 * 60 * 1000);

            // Require at least the delay_hours from the current template
            if (hoursSinceLastEmail < template.delay_hours) {
              continue;
            }
          }

          // Generate coupon if needed
          let couponCode = cart.coupon_code;
          if (template.include_coupon && !couponCode) {
            couponCode = generateCouponCode();
            await supabaseAdmin
              .from('abandoned_carts')
              .update({ coupon_code: couponCode })
              .eq('id', cart.id);
          }

          // Build recovery URL
          const recoveryUrl = `${import.meta.env.PUBLIC_SITE_URL || 'https://gpsdentaltraining.com'}/api/cart/recover/${cart.recovery_token}`;

          // Replace template variables
          const htmlContent = replaceTemplateVariables(template.html_content, {
            first_name: cart.first_name || 'there',
            last_name: cart.last_name || '',
            email: cart.email,
            cart_total: formatCurrency(cart.cart_total),
            cart_items: formatCartItems(cart.cart_contents),
            checkout_url: recoveryUrl,
            coupon_code: couponCode || '',
            unsubscribe_url: `${import.meta.env.PUBLIC_SITE_URL || 'https://gpsdentaltraining.com'}/unsubscribe?email=${encodeURIComponent(cart.email)}`,
          });

          const subject = replaceTemplateVariables(template.subject, {
            first_name: cart.first_name || 'there',
          });

          // Send email
          const { data: emailResult, error: emailError } = await getResend().emails.send({
            from: 'GPS Dental Training <noreply@gpsdentaltraining.com>',
            to: cart.email,
            subject: subject,
            html: htmlContent,
          });

          if (emailError) {
            results.errors.push(`Cart ${cart.id}: ${emailError.message}`);

            await supabaseAdmin
              .from('cart_recovery_emails')
              .insert({
                cart_id: cart.id,
                template_id: template.id,
                to_email: cart.email,
                subject: subject,
                sequence_number: template.sequence_order,
                status: 'failed',
                error_message: emailError.message,
              });

            continue;
          }

          // Log successful email
          await supabaseAdmin
            .from('cart_recovery_emails')
            .insert({
              cart_id: cart.id,
              template_id: template.id,
              to_email: cart.email,
              subject: subject,
              sequence_number: template.sequence_order,
              status: 'sent',
              sent_at: now.toISOString(),
              resend_message_id: emailResult?.id,
            });

          // Update cart
          await supabaseAdmin
            .from('abandoned_carts')
            .update({
              emails_sent: template.sequence_order,
              last_email_sent_at: now.toISOString(),
              status: 'notified',
              email_sequence_completed: template.sequence_order >= maxEmails,
            })
            .eq('id', cart.id);

          results.emailsSent++;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          results.errors.push(`Cart ${cart.id}: ${errorMessage}`);
        }
      }
    }

    // Expire old carts (older than 7 days with no activity)
    const expiryThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    await supabaseAdmin
      .from('abandoned_carts')
      .update({ status: 'expired' })
      .in('status', ['abandoned', 'notified'])
      .lt('updated_at', expiryThreshold.toISOString())
      .eq('email_sequence_completed', true);

    // Update daily analytics
    await updateDailyAnalytics();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cart recovery cron completed',
        results,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Cart recovery cron error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

async function updateDailyAnalytics() {
  const today = new Date().toISOString().split('T')[0];

  // Get today's stats
  const { count: abandoned } = await supabaseAdmin
    .from('abandoned_carts')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today);

  const { count: recovered } = await supabaseAdmin
    .from('abandoned_carts')
    .select('*', { count: 'exact', head: true })
    .in('status', ['recovered', 'converted'])
    .gte('recovered_at', today);

  const { data: abandonedValue } = await supabaseAdmin
    .from('abandoned_carts')
    .select('cart_total')
    .gte('created_at', today);

  const { data: recoveredValue } = await supabaseAdmin
    .from('abandoned_carts')
    .select('cart_total')
    .in('status', ['recovered', 'converted'])
    .gte('recovered_at', today);

  const { count: emailsSent } = await supabaseAdmin
    .from('cart_recovery_emails')
    .select('*', { count: 'exact', head: true })
    .gte('sent_at', today);

  const { count: emailsOpened } = await supabaseAdmin
    .from('cart_recovery_emails')
    .select('*', { count: 'exact', head: true })
    .gte('opened_at', today);

  const { count: emailsClicked } = await supabaseAdmin
    .from('cart_recovery_emails')
    .select('*', { count: 'exact', head: true })
    .gte('clicked_at', today);

  const totalAbandoned = abandoned || 0;
  const totalRecovered = recovered || 0;
  const recoveryRate = totalAbandoned > 0 ? (totalRecovered / totalAbandoned) * 100 : 0;

  // Upsert analytics
  await supabaseAdmin
    .from('cart_recovery_analytics')
    .upsert({
      date: today,
      carts_abandoned: totalAbandoned,
      carts_recovered: totalRecovered,
      abandoned_value: abandonedValue?.reduce((sum, c) => sum + (c.cart_total || 0), 0) || 0,
      recovered_value: recoveredValue?.reduce((sum, c) => sum + (c.cart_total || 0), 0) || 0,
      emails_sent: emailsSent || 0,
      emails_opened: emailsOpened || 0,
      emails_clicked: emailsClicked || 0,
      recovery_rate: recoveryRate,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'date',
    });
}

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
