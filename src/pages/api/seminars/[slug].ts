import type { APIRoute } from 'astro';
import { getSeminarBySlug, getSeminarSessions } from '../../../lib/supabase/queries';

/**
 * GET /api/seminars/[slug]
 * Returns a seminar by slug with its sessions
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    const { slug } = params;

    if (!slug) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Seminar slug is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const seminar = await getSeminarBySlug(slug);

    if (!seminar) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Seminar not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get sessions for this seminar
    const sessions = await getSeminarSessions(seminar.id);

    return new Response(JSON.stringify({
      success: true,
      data: {
        ...seminar,
        sessions,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching seminar:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch seminar',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
