/**
 * Admin Upload API - Certificate Template Images (Logo, Signature, PACE Logo)
 * Accepts multipart FormData with an image file, uploads to Supabase Storage
 * Returns the public URL for the uploaded image
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase/client';

const BUCKET = 'certificate-assets';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const imageType = formData.get('type') as string | null; // logo, signature, pace_logo

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Allowed: JPG, PNG, WebP, SVG' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size is 5MB' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Determine folder based on image type
    const folder = imageType || 'misc';
    const validFolders = ['logo', 'signature', 'pace_logo', 'misc'];
    const safeFolder = validFolders.includes(folder) ? folder : 'misc';

    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const timestamp = Date.now();
    const safeName = file.name
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .substring(0, 50);
    const fileName = `${safeFolder}/${safeName}-${timestamp}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Try to upload to the bucket
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);

      // If bucket doesn't exist, try site-assets as fallback
      if (error.message?.includes('not found') || error.message?.includes('Bucket')) {
        // Try fallback bucket
        const fallbackBucket = 'site-assets';
        const fallbackFileName = `certificate-templates/${fileName}`;

        const { data: fallbackData, error: fallbackError } = await supabaseAdmin.storage
          .from(fallbackBucket)
          .upload(fallbackFileName, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (fallbackError) {
          return new Response(
            JSON.stringify({
              error: `Storage bucket not available. Please create "${BUCKET}" or "${fallbackBucket}" bucket in Supabase Dashboard > Storage.`,
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const { data: fallbackUrlData } = supabaseAdmin.storage
          .from(fallbackBucket)
          .getPublicUrl(fallbackData.path);

        return new Response(
          JSON.stringify({
            success: true,
            url: fallbackUrlData.publicUrl,
            path: fallbackData.path,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
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
    console.error('Certificate template image upload error:', error);
    return new Response(
      JSON.stringify({
        error: 'Upload failed',
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
