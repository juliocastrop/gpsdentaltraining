import type { APIRoute } from 'astro';
import { setDefaultCertificateTemplate } from '../../../../../lib/supabase/queries';

export const POST: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Template ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const template = await setDefaultCertificateTemplate(id);

    return new Response(JSON.stringify(template), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error setting default template:', error);
    return new Response(JSON.stringify({ error: 'Failed to set default template' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
