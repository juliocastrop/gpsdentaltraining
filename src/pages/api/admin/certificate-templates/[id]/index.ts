import type { APIRoute } from 'astro';
import {
  getCertificateTemplateById,
  updateCertificateTemplate,
  deleteCertificateTemplate,
} from '../../../../../lib/supabase/queries';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Template ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const template = await getCertificateTemplateById(id);
    if (!template) {
      return new Response(JSON.stringify({ error: 'Template not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(template), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch template' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Template ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();

    // Remove read-only fields and fields that don't exist in DB
    const {
      id: _,
      created_at,
      updated_at,
      // Remove text input duplicates (color pickers sync fields)
      header_bg_color_text,
      header_text_color_text,
      primary_color_text,
      secondary_color_text,
      accent_color_text,
      attendee_name_color_text,
      event_title_color_text,
      date_color_text,
      border_color_text,
      ...updateData
    } = body;

    // Clean up null/undefined values and ensure proper types
    const cleanedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(updateData)) {
      // Skip undefined values
      if (value === undefined) continue;

      // Convert empty strings to null for URL fields
      if (typeof value === 'string' && value === '' && key.includes('_url')) {
        cleanedData[key] = null;
      }
      // Convert page_orientation from full word to single letter
      else if (key === 'page_orientation') {
        cleanedData[key] = value === 'landscape' ? 'L' : value === 'portrait' ? 'P' : value;
      }
      else {
        cleanedData[key] = value;
      }
    }

    const template = await updateCertificateTemplate(id, cleanedData);

    return new Response(JSON.stringify(template), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating template:', error);

    if (error.code === '23505') {
      return new Response(JSON.stringify({ error: 'A template with this slug already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Return more detailed error for debugging
    return new Response(JSON.stringify({
      error: 'Failed to update template',
      details: error.message || error.code || String(error),
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Template ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if template exists and is not default
    const template = await getCertificateTemplateById(id);
    if (!template) {
      return new Response(JSON.stringify({ error: 'Template not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (template.is_default) {
      return new Response(JSON.stringify({ error: 'Cannot delete the default template' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await deleteCertificateTemplate(id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete template' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
