/**
 * Admin Upload API - Event Image (Featured Image)
 * Accepts multipart FormData with an image file, uploads to Supabase Storage
 * Returns the public URL for the uploaded image
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase/client';

const BUCKET = 'event-images';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Allowed: JPG, PNG, WebP' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size is 10MB' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const safeName = file.name
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .substring(0, 50);
    const fileName = `${safeName}-${timestamp}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);

      if (error.message?.includes('not found') || error.message?.includes('Bucket')) {
        return new Response(
          JSON.stringify({
            error: `Storage bucket "${BUCKET}" not found. Please create it in the Supabase Dashboard > Storage.`,
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: `Upload failed: ${error.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(data.path);

    return new Response(
      JSON.stringify({
        success: true,
        url: urlData.publicUrl,
        path: data.path,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Event image upload error:', error);
    return new Response(
      JSON.stringify({
        error: 'Upload failed',
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
