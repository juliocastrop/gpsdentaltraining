import type { APIRoute } from 'astro';
import { getUserTotalCredits, getUserCreditLedger } from '../../../lib/supabase/queries';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User ID is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get total credits
    const totalCredits = await getUserTotalCredits(userId);

    // Get credit ledger
    const ledger = await getUserCreditLedger(userId);

    // Format ledger for response
    const formattedLedger = ledger.map((entry) => ({
      id: entry.id,
      credits: entry.credits,
      source: entry.source,
      transactionType: entry.transaction_type,
      eventTitle: entry.events?.title || null,
      eventDate: entry.events?.start_date || null,
      notes: entry.notes,
      awardedAt: entry.awarded_at,
    }));

    return new Response(JSON.stringify({
      success: true,
      totalCredits,
      ledger: formattedLedger,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching user credits:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch credits',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
