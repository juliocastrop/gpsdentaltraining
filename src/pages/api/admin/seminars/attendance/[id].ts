/**
 * Seminar Attendance API - Delete/Update
 * Manage individual attendance records
 */
import type { APIRoute } from 'astro';
import { deleteSeminarAttendance } from '../../../../../lib/supabase/queries';

/**
 * DELETE /api/admin/seminars/attendance/[id]
 * Remove an attendance record (undo check-in)
 */
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Attendance ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await deleteSeminarAttendance(id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Attendance record removed and CE credits revoked',
        data: result,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Delete attendance error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to delete attendance record',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
