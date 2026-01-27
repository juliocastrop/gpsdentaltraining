/**
 * General Settings API
 * Save and retrieve general application settings
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase/client';
import { invalidateSiteSettingsCache } from '../../../../lib/data/site-settings-loader';

const SETTINGS_KEY = 'general_settings';

export const POST: APIRoute = async ({ request }) => {
  try {
    const settings = await request.json();

    if (!settings.company_name) {
      return new Response(
        JSON.stringify({ error: 'Company name is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: existing } = await supabaseAdmin
      .from('site_settings')
      .select('id')
      .eq('key', SETTINGS_KEY)
      .single();

    if (existing) {
      const { error } = await supabaseAdmin
        .from('site_settings')
        .update({
          value: settings,
          updated_at: new Date().toISOString(),
        })
        .eq('key', SETTINGS_KEY);

      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin
        .from('site_settings')
        .insert({
          key: SETTINGS_KEY,
          value: settings,
        });

      if (error) throw error;
    }

    // Invalidate the in-memory cache so the next page load picks up the new values
    invalidateSiteSettingsCache();

    return new Response(
      JSON.stringify({ success: true, message: 'Settings saved successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('General settings save error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to save settings' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return new Response(
      JSON.stringify({ success: true, settings: data?.value || {} }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('General settings fetch error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch settings' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
