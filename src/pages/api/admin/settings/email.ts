/**
 * Email Settings API
 * Save email configuration settings
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase/client';

export const POST: APIRoute = async ({ request }) => {
  try {
    const settings = await request.json();

    // Validate required fields
    if (!settings.company_name || !settings.from_name) {
      return new Response(
        JSON.stringify({ error: 'Company name and from name are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if settings exist
    const { data: existing } = await supabaseAdmin
      .from('site_settings')
      .select('id')
      .eq('key', 'email_settings')
      .single();

    if (existing) {
      // Update existing settings
      const { error } = await supabaseAdmin
        .from('site_settings')
        .update({
          value: settings,
          updated_at: new Date().toISOString(),
        })
        .eq('key', 'email_settings');

      if (error) throw error;
    } else {
      // Create new settings
      const { error } = await supabaseAdmin
        .from('site_settings')
        .insert({
          key: 'email_settings',
          value: settings,
        });

      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email settings saved successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Email settings save error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to save email settings' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'email_settings')
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return new Response(
      JSON.stringify({ success: true, settings: data?.value || {} }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Email settings fetch error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch email settings' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
