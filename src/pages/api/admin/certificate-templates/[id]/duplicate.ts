import type { APIRoute } from 'astro';
import { duplicateCertificateTemplate } from '../../../../../lib/supabase/queries';

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Template ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { name, slug } = body;

    if (!name || !slug) {
      return new Response(JSON.stringify({ error: 'Name and slug are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return new Response(JSON.stringify({ error: 'Slug must contain only lowercase letters, numbers, and hyphens' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const template = await duplicateCertificateTemplate(id, name, slug);

    return new Response(JSON.stringify(template), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error duplicating template:', error);

    if (error.message === 'Template not found') {
      return new Response(JSON.stringify({ error: 'Template not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (error.code === '23505') {
      return new Response(JSON.stringify({ error: 'A template with this slug already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Failed to duplicate template' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
