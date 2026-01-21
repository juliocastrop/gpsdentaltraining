import type { APIRoute } from 'astro';
import { createCertificateTemplate, getCertificateTemplates } from '../../../../lib/supabase/queries';

export const GET: APIRoute = async () => {
  try {
    const templates = await getCertificateTemplates();
    return new Response(JSON.stringify(templates), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch templates' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, slug, template_type } = body;

    if (!name || !slug || !template_type) {
      return new Response(JSON.stringify({ error: 'Name, slug, and template_type are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate template_type
    if (!['course', 'seminar'].includes(template_type)) {
      return new Response(JSON.stringify({ error: 'Invalid template type' }), {
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

    const template = await createCertificateTemplate({
      name,
      slug,
      template_type,
      is_default: false,
      // Default values will be set by the database
    });

    return new Response(JSON.stringify(template), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating template:', error);

    // Handle unique constraint violation
    if (error.code === '23505') {
      return new Response(JSON.stringify({ error: 'A template with this slug already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Failed to create template' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
