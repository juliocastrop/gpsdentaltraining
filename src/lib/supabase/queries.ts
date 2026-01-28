/**
 * Supabase Query Functions
 * Centralized database operations for GPS Dental Training
 */

import { supabaseAdmin } from './client';
import type {
  Event,
  EventWithSpeakers,
  Speaker,
  TicketTypeRow,
  Order,
  Ticket,
  Attendance,
  CELedger,
  Waitlist,
  Certificate,
  CertificateTemplate,
  CertificateTemplateType,
  Seminar,
  SeminarSession,
  SeminarRegistration,
  User,
  InsertOrder,
  InsertTicket,
  InsertWaitlist,
  InsertAttendance,
  InsertCECredit,
  TicketAvailabilityInfo,
  SiteFeature,
  InsertSiteFeature,
} from '../../types/database';

// ============================================================
// EVENTS
// ============================================================

export async function getPublishedEvents() {
  const { data, error } = await supabaseAdmin
    .from('events')
    .select('*')
    .eq('status', 'published')
    .order('start_date', { ascending: true });

  if (error) throw error;
  return data as Event[];
}

export async function getUpcomingEvents(limit = 10) {
  const { data, error } = await supabaseAdmin
    .from('events')
    .select('*')
    .eq('status', 'published')
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data as Event[];
}

export async function getPublishedEventsWithSpeakers(): Promise<EventWithSpeakers[]> {
  // Get all published events
  const { data: events, error: eventsError } = await supabaseAdmin
    .from('events')
    .select('*')
    .eq('status', 'published')
    .order('start_date', { ascending: true });

  if (eventsError) throw eventsError;

  // Get all event-speaker relationships
  const { data: allEventSpeakers, error: speakersError } = await supabaseAdmin
    .from('event_speakers')
    .select(`
      event_id,
      display_order,
      speaker:speakers (*)
    `)
    .order('display_order', { ascending: true });

  if (speakersError) throw speakersError;

  // Map speakers to their events
  return events.map(event => ({
    ...event,
    speakers: allEventSpeakers
      ?.filter(es => es.event_id === event.id)
      .map(es => es.speaker as unknown as Speaker) || [],
  })) as EventWithSpeakers[];
}

export async function getFeaturedEvent(): Promise<EventWithSpeakers | null> {
  // Get the next upcoming published event (closest to today)
  const { data: event, error: eventError } = await supabaseAdmin
    .from('events')
    .select('*')
    .eq('status', 'published')
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (eventError) throw eventError;
  if (!event) return null;

  // Get speakers for this event
  const { data: eventSpeakers, error: speakersError } = await supabaseAdmin
    .from('event_speakers')
    .select(`
      display_order,
      speaker:speakers (*)
    `)
    .eq('event_id', event.id)
    .order('display_order', { ascending: true });

  if (speakersError) throw speakersError;

  return {
    ...event,
    speakers: eventSpeakers?.map(es => es.speaker as unknown as Speaker) || [],
  } as EventWithSpeakers;
}

export async function getEventBySlug(slug: string, { preview = false }: { preview?: boolean } = {}) {
  let query = supabaseAdmin
    .from('events')
    .select('*')
    .eq('slug', slug);

  if (!preview) {
    query = query.eq('status', 'published');
  }

  const { data, error } = await query.single();

  if (error) throw error;
  return data as Event;
}

export async function getEventWithSpeakers(slug: string, { preview = false }: { preview?: boolean } = {}): Promise<EventWithSpeakers> {
  // Get the event
  let query = supabaseAdmin
    .from('events')
    .select('*')
    .eq('slug', slug);

  if (!preview) {
    query = query.eq('status', 'published');
  }

  const { data: event, error: eventError } = await query.single();

  if (eventError) throw eventError;

  // Get speakers for this event
  const { data: eventSpeakers, error: speakersError } = await supabaseAdmin
    .from('event_speakers')
    .select(`
      display_order,
      speaker:speakers (*)
    `)
    .eq('event_id', event.id)
    .order('display_order', { ascending: true });

  if (speakersError) throw speakersError;

  // Extract speakers from the joined data
  const speakers = eventSpeakers?.map(es => es.speaker as unknown as Speaker) || [];

  return {
    ...event,
    speakers,
  } as EventWithSpeakers;
}

// ============================================================
// SPEAKERS
// ============================================================

export async function getSpeakers() {
  const { data, error } = await supabaseAdmin
    .from('speakers')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data as Speaker[];
}

export async function getSpeakerBySlug(slug: string) {
  const { data, error } = await supabaseAdmin
    .from('speakers')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data as Speaker;
}

export async function getSpeakersForEvent(eventId: string) {
  const { data, error } = await supabaseAdmin
    .from('event_speakers')
    .select(`
      display_order,
      speaker:speakers (*)
    `)
    .eq('event_id', eventId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data?.map(es => es.speaker as unknown as Speaker) || [];
}

export async function getFeaturedSpeakers(limit = 6) {
  const { data, error } = await supabaseAdmin
    .from('speakers')
    .select('*')
    .eq('is_featured', true)
    .order('display_order', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data as Speaker[];
}

export async function getSpeakerWithEvents(slug: string) {
  // Get the speaker
  const { data: speaker, error: speakerError } = await supabaseAdmin
    .from('speakers')
    .select('*')
    .eq('slug', slug)
    .single();

  if (speakerError) throw speakerError;

  // Get events this speaker is associated with
  const { data: eventSpeakers, error: eventsError } = await supabaseAdmin
    .from('event_speakers')
    .select(`
      event:events (*)
    `)
    .eq('speaker_id', speaker.id);

  if (eventsError) throw eventsError;

  // Get seminars this speaker moderates
  const { data: seminarModerators, error: seminarsError } = await supabaseAdmin
    .from('seminar_moderators')
    .select(`
      role,
      seminar:seminars (*)
    `)
    .eq('speaker_id', speaker.id);

  if (seminarsError) throw seminarsError;

  return {
    ...speaker,
    events: eventSpeakers?.map(es => es.event as unknown as Event).filter(Boolean) || [],
    seminars: seminarModerators?.map(sm => ({ ...sm.seminar as unknown as Seminar, role: sm.role })).filter(s => s.id) || [],
  };
}

export async function getEventById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Event;
}

// ============================================================
// TICKET TYPES
// ============================================================

export async function getActiveTicketTypes(eventId: string) {
  const { data, error } = await supabaseAdmin
    .from('ticket_types')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'active')
    .order('price', { ascending: true });

  if (error) throw error;
  return data as TicketTypeRow[];
}

export async function getTicketTypeById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('ticket_types')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as TicketTypeRow;
}

export async function getTicketStock(ticketTypeId: string) {
  const { data, error } = await supabaseAdmin
    .rpc('get_ticket_stock', { p_ticket_type_id: ticketTypeId });

  if (error) throw error;
  return data[0] as { total: number; sold: number; available: number; unlimited: boolean };
}

export async function isTicketSoldOut(ticketTypeId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .rpc('is_ticket_sold_out', { p_ticket_type_id: ticketTypeId });

  if (error) throw error;
  return data as boolean;
}

export async function getEventAvailability(eventId: string) {
  const ticketTypes = await getActiveTicketTypes(eventId);

  let allSoldOut = true;
  const ticketsInfo: TicketAvailabilityInfo[] = [];

  for (const ticket of ticketTypes) {
    const isSoldOut = await isTicketSoldOut(ticket.id);
    const stock = await getTicketStock(ticket.id);

    ticketsInfo.push({
      id: ticket.id,
      name: ticket.name,
      price: ticket.price,
      is_sold_out: isSoldOut,
      is_manual_sold_out: ticket.manual_sold_out,
      stock: {
        total: stock.total,
        sold: stock.sold,
        available: stock.available,
        unlimited: stock.unlimited,
      },
    });

    if (!isSoldOut) {
      allSoldOut = false;
    }
  }

  return {
    is_available: !allSoldOut && ticketsInfo.length > 0,
    is_sold_out: allSoldOut || ticketsInfo.length === 0,
    has_active_tickets: ticketsInfo.length > 0,
    reason: ticketsInfo.length === 0 ? 'no_tickets' : (allSoldOut ? 'sold_out' : 'available'),
    tickets: ticketsInfo,
    waitlist_enabled: allSoldOut || ticketsInfo.length === 0,
  };
}

// ============================================================
// ORDERS
// ============================================================

export async function createOrder(orderData: InsertOrder) {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .insert({
      ...orderData,
      status: 'pending',
      payment_status: 'unpaid',
    })
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  paymentStatus?: string
) {
  const updateData: Record<string, unknown> = { status };
  if (paymentStatus) {
    updateData.payment_status = paymentStatus;
  }
  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

// ============================================================
// TICKETS
// ============================================================

export async function createTicket(ticketData: InsertTicket) {
  const { data, error } = await supabaseAdmin
    .from('tickets')
    .insert(ticketData)
    .select()
    .single();

  if (error) throw error;
  return data as Ticket;
}

export async function updateTicketStatus(ticketId: string, status: string) {
  const { data, error } = await supabaseAdmin
    .from('tickets')
    .update({ status })
    .eq('id', ticketId)
    .select()
    .single();

  if (error) throw error;
  return data as Ticket;
}

export async function updateTicketQRCode(ticketId: string, qrCodeData: object, qrCodeUrl: string) {
  const { data, error } = await supabaseAdmin
    .from('tickets')
    .update({
      qr_code_data: qrCodeData,
      qr_code_url: qrCodeUrl,
    })
    .eq('id', ticketId)
    .select()
    .single();

  if (error) throw error;
  return data as Ticket;
}

// ============================================================
// ATTENDANCE
// ============================================================

export async function createAttendance(attendanceData: InsertAttendance) {
  const { data, error } = await supabaseAdmin
    .from('attendance')
    .insert(attendanceData)
    .select()
    .single();

  if (error) throw error;
  return data as Attendance;
}

export async function getEventAttendance(eventId: string) {
  const { data, error } = await supabaseAdmin
    .from('attendance')
    .select('*, tickets(*, users(*))')
    .eq('event_id', eventId)
    .order('checked_in_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function isTicketCheckedIn(ticketId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('attendance')
    .select('id')
    .eq('ticket_id', ticketId)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}

// ============================================================
// CE CREDITS
// ============================================================

export async function awardCECredits(creditData: InsertCECredit) {
  const { data, error } = await supabaseAdmin
    .from('ce_ledger')
    .insert({
      ...creditData,
      transaction_type: creditData.transaction_type || 'earned',
    })
    .select()
    .single();

  if (error) throw error;
  return data as CELedger;
}

export async function getUserTotalCredits(userId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .rpc('get_user_total_credits', { p_user_id: userId });

  if (error) throw error;
  return data as number;
}

export async function getUserCreditLedger(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('ce_ledger')
    .select('*, events(*)')
    .eq('user_id', userId)
    .order('awarded_at', { ascending: false });

  if (error) throw error;
  return data as (CELedger & { events: Event | null })[];
}

// ============================================================
// WAITLIST
// ============================================================

export async function addToWaitlist(waitlistData: InsertWaitlist) {
  // Get next position - use event-based position if no ticket_type_id
  let positionData: number;

  if (waitlistData.ticket_type_id) {
    const { data, error } = await supabaseAdmin
      .rpc('get_next_waitlist_position', { p_ticket_type_id: waitlistData.ticket_type_id });
    if (error) throw error;
    positionData = data;
  } else {
    const { data, error } = await supabaseAdmin
      .rpc('get_next_waitlist_position_by_event', { p_event_id: waitlistData.event_id });
    if (error) throw error;
    positionData = data;
  }

  const { data, error } = await supabaseAdmin
    .from('waitlist')
    .insert({
      ...waitlistData,
      position: positionData,
      status: 'waiting',
    })
    .select()
    .single();

  if (error) throw error;
  return data as Waitlist;
}

export async function checkWaitlistStatus(email: string, eventId?: string) {
  let query = supabaseAdmin
    .from('waitlist')
    .select('*, events(*), ticket_types(*)')
    .eq('email', email)
    .in('status', ['waiting', 'notified']);

  if (eventId) {
    query = query.eq('event_id', eventId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function notifyWaitlistEntry(waitlistId: string) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48);

  const { data, error } = await supabaseAdmin
    .from('waitlist')
    .update({
      status: 'notified',
      notified_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .eq('id', waitlistId)
    .select()
    .single();

  if (error) throw error;
  return data as Waitlist;
}

export async function getNextInWaitlist(ticketTypeId: string) {
  const { data, error } = await supabaseAdmin
    .from('waitlist')
    .select('*')
    .eq('ticket_type_id', ticketTypeId)
    .eq('status', 'waiting')
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as Waitlist | null;
}

// ============================================================
// CERTIFICATES
// ============================================================

export async function createCertificate(certificateData: {
  certificate_code: string;
  ticket_id?: string | null;
  user_id?: string | null;
  event_id: string;
  attendee_name: string;
  pdf_url?: string;
}) {
  const { data, error } = await supabaseAdmin
    .from('certificates')
    .insert(certificateData)
    .select()
    .single();

  if (error) throw error;
  return data as Certificate;
}

export async function getCertificateById(certificateId: string) {
  const { data, error } = await supabaseAdmin
    .from('certificates')
    .select(`
      *,
      event:events(id, title, slug, start_date, end_date, venue, ce_credits),
      ticket:tickets(id, ticket_code, attendee_email, attendee_name),
      user:users(id, email, first_name, last_name)
    `)
    .eq('id', certificateId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function getCertificateByTicket(ticketId: string) {
  const { data, error } = await supabaseAdmin
    .from('certificates')
    .select('*')
    .eq('ticket_id', ticketId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Certificate;
}

export async function updateCertificateSentAt(certificateId: string) {
  const { error } = await supabaseAdmin
    .from('certificates')
    .update({ sent_at: new Date().toISOString() })
    .eq('id', certificateId);

  if (error) throw error;
}

export async function updateCertificatePDF(certificateId: string, pdfUrl: string) {
  const { data, error } = await supabaseAdmin
    .from('certificates')
    .update({ pdf_url: pdfUrl })
    .eq('id', certificateId)
    .select()
    .single();

  if (error) throw error;
  return data as Certificate;
}

export async function markCertificateSent(certificateId: string) {
  const { data, error } = await supabaseAdmin
    .from('certificates')
    .update({ sent_at: new Date().toISOString() })
    .eq('id', certificateId)
    .select()
    .single();

  if (error) throw error;
  return data as Certificate;
}

// ============================================================
// SEMINARS
// ============================================================

export async function getActiveSeminars() {
  const { data, error } = await supabaseAdmin
    .from('seminars')
    .select('*')
    .in('status', ['active', 'completed'])
    .order('year', { ascending: false });

  if (error) throw error;
  return data as Seminar[];
}

export async function getSeminarBySlug(slug: string) {
  const { data, error } = await supabaseAdmin
    .from('seminars')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data as Seminar;
}

export async function getSeminarSessions(seminarId: string) {
  const { data, error } = await supabaseAdmin
    .from('seminar_sessions')
    .select('*')
    .eq('seminar_id', seminarId)
    .order('session_number', { ascending: true });

  if (error) throw error;
  return data as SeminarSession[];
}

export async function getUserSeminarRegistration(userId: string, seminarId: string) {
  const { data, error } = await supabaseAdmin
    .from('seminar_registrations')
    .select('*, seminars(*)')
    .eq('user_id', userId)
    .eq('seminar_id', seminarId)
    .neq('status', 'cancelled')
    .maybeSingle();

  if (error) throw error;
  return data as (SeminarRegistration & { seminars: Seminar }) | null;
}

// ============================================================
// TEAM MEMBERS
// ============================================================

export async function getTeamMembers() {
  const { data, error } = await supabaseAdmin
    .from('team_members')
    .select('*')
    .eq('status', 'active')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getFeaturedTeamMembers(limit = 6) {
  const { data, error } = await supabaseAdmin
    .from('team_members')
    .select('*')
    .eq('status', 'active')
    .eq('is_featured', true)
    .order('display_order', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getTeamMemberBySlug(slug: string) {
  const { data, error } = await supabaseAdmin
    .from('team_members')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// CALENDAR / EVENTS DATA
// ============================================================

export async function getCalendarEvents() {
  // Get all published events
  const { data: events, error: eventsError } = await supabaseAdmin
    .from('events')
    .select('*')
    .eq('status', 'published')
    .order('start_date', { ascending: true });

  if (eventsError) throw eventsError;

  // Get all seminar sessions
  const { data: seminars, error: seminarsError } = await supabaseAdmin
    .from('seminars')
    .select(`
      *,
      sessions:seminar_sessions (*)
    `)
    .in('status', ['active', 'upcoming'])
    .order('year', { ascending: true });

  if (seminarsError) throw seminarsError;

  return { events: events || [], seminars: seminars || [] };
}

// ============================================================
// USERS
// ============================================================

export async function getUserByClerkId(clerkId: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('clerk_id', clerkId)
    .maybeSingle();

  if (error) throw error;
  return data as User | null;
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) throw error;
  return data as User | null;
}

export async function createUser(userData: {
  clerk_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert(userData)
    .select()
    .single();

  if (error) throw error;
  return data as User;
}

export async function updateUser(userId: string, userData: Partial<User>) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update(userData)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as User;
}

// ============================================================
// TESTIMONIALS
// ============================================================

export async function getTestimonials() {
  const { data, error } = await supabaseAdmin
    .from('testimonials')
    .select('*')
    .eq('status', 'published')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getFeaturedTestimonials(limit = 6) {
  const { data, error } = await supabaseAdmin
    .from('testimonials')
    .select('*')
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('display_order', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ============================================================
// PARTNERS / SPONSORS
// ============================================================

export async function getPartners() {
  const { data, error } = await supabaseAdmin
    .from('partners')
    .select('*')
    .eq('status', 'active')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getFeaturedPartners(limit = 8) {
  const { data, error } = await supabaseAdmin
    .from('partners')
    .select('*')
    .eq('status', 'active')
    .eq('is_featured', true)
    .order('display_order', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ============================================================
// HERO SLIDES
// ============================================================

export interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  overlay_opacity?: number;
  cta_text?: string;
  cta_link?: string;
  cta_secondary_text?: string;
  cta_secondary_link?: string;
  linked_event_id?: string;
  linked_seminar_id?: string;
  ce_credits?: number;
  badge_text?: string;
  badge_variant?: string;
  display_order: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  linked_event?: Event;
  linked_seminar?: Seminar;
}

/**
 * Get all active hero slides, optionally filtering by schedule
 * @param checkSchedule If true, only returns slides within their scheduled date range
 */
export async function getActiveHeroSlides(checkSchedule = true): Promise<HeroSlide[]> {
  let query = supabaseAdmin
    .from('hero_slides')
    .select(`
      *,
      linked_event:events (*),
      linked_seminar:seminars (*)
    `)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (checkSchedule) {
    const now = new Date().toISOString();
    // Only include slides where:
    // - No start_date OR start_date <= now
    // - No end_date OR end_date >= now
    query = query
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Transform data to merge linked event/seminar data if needed
  return (data || []).map(slide => {
    const result: HeroSlide = { ...slide };

    // If linked to an event, use event data as fallback
    if (slide.linked_event && slide.linked_event_id) {
      const event = slide.linked_event as Event;
      if (!result.title) result.title = event.title;
      if (!result.description) result.description = event.description ?? undefined;
      if (!result.image_url) result.image_url = event.featured_image_url ?? undefined;
      if (!result.cta_link) result.cta_link = `/courses/${event.slug}`;
      if (result.ce_credits === null || result.ce_credits === undefined) {
        result.ce_credits = event.ce_credits ?? undefined;
      }
    }

    // If linked to a seminar, use seminar data as fallback
    if (slide.linked_seminar && slide.linked_seminar_id) {
      const seminar = slide.linked_seminar as Seminar;
      if (!result.title) result.title = seminar.title;
      if (!result.description) result.description = seminar.description ?? undefined;
      if (!result.image_url) result.image_url = seminar.featured_image_url ?? undefined;
      if (!result.cta_link) result.cta_link = `/monthly-seminars/${seminar.slug}`;
    }

    return result;
  });
}

/**
 * Get a single hero slide by ID
 */
export async function getHeroSlideById(id: string): Promise<HeroSlide | null> {
  const { data, error } = await supabaseAdmin
    .from('hero_slides')
    .select(`
      *,
      linked_event:events (*),
      linked_seminar:seminars (*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as HeroSlide;
}

/**
 * Get all hero slides (for admin management)
 */
export async function getAllHeroSlides(): Promise<HeroSlide[]> {
  const { data, error } = await supabaseAdmin
    .from('hero_slides')
    .select(`
      *,
      linked_event:events (*),
      linked_seminar:seminars (*)
    `)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ============================================================
// USER ACCOUNT - ORDERS
// ============================================================

export interface OrderWithItems {
  id: string;
  order_number: string;
  user_id: string;
  stripe_session_id?: string;
  billing_email: string;
  billing_name: string;
  billing_phone?: string;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  payment_status: string;
  notes?: string;
  created_at: string;
  completed_at?: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  ticket_type_id: string;
  event_id: string;
  quantity: number;
  unit_price: number;
  total: number;
  ticket_type?: {
    id: string;
    name: string;
    ticket_type: string;
  };
  event?: Event;
}

/**
 * Get user's orders with items
 */
export async function getUserOrders(userId: string): Promise<OrderWithItems[]> {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      items:order_items (
        *,
        ticket_type:ticket_types (id, name, ticket_type),
        event:events (*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as OrderWithItems[];
}

/**
 * Get single order by ID
 */
export async function getOrderById(orderId: string): Promise<OrderWithItems | null> {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      items:order_items (
        *,
        ticket_type:ticket_types (id, name, ticket_type),
        event:events (*)
      )
    `)
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return data as OrderWithItems;
}

/**
 * Get order by Stripe session ID
 */
export async function getOrderByStripeSession(sessionId: string): Promise<OrderWithItems | null> {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      items:order_items (
        *,
        ticket_type:ticket_types (id, name, ticket_type),
        event:events (*)
      )
    `)
    .eq('stripe_session_id', sessionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data as OrderWithItems;
}

// ============================================================
// USER ACCOUNT - TICKETS
// ============================================================

export interface TicketWithEvent {
  id: string;
  ticket_code: string;
  ticket_type_id: string;
  event_id: string;
  order_id: string;
  user_id: string;
  attendee_name: string;
  attendee_email: string;
  qr_code_url?: string;
  status: string;
  created_at: string;
  used_at?: string;
  ticket_type?: {
    id: string;
    name: string;
    ticket_type: string;
  };
  event?: Event;
}

/**
 * Get user's tickets with event info
 */
export async function getUserTickets(userId: string): Promise<TicketWithEvent[]> {
  const { data, error } = await supabaseAdmin
    .from('tickets')
    .select(`
      *,
      ticket_type:ticket_types (id, name, ticket_type),
      event:events (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as TicketWithEvent[];
}

/**
 * Get user's upcoming valid tickets
 */
export async function getUserUpcomingTickets(userId: string): Promise<TicketWithEvent[]> {
  const { data, error } = await supabaseAdmin
    .from('tickets')
    .select(`
      *,
      ticket_type:ticket_types (id, name, ticket_type),
      event:events (*)
    `)
    .eq('user_id', userId)
    .eq('status', 'valid')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Filter to only show tickets for future events
  const now = new Date();
  return ((data || []) as TicketWithEvent[]).filter(ticket => {
    if (!ticket.event?.start_date) return true;
    return new Date(ticket.event.start_date) >= now;
  });
}

/**
 * Get ticket by code (for QR validation)
 */
export async function getTicketByCode(code: string): Promise<TicketWithEvent | null> {
  const { data, error } = await supabaseAdmin
    .from('tickets')
    .select(`
      *,
      ticket_type:ticket_types (id, name, ticket_type),
      event:events (*)
    `)
    .eq('ticket_code', code)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as TicketWithEvent;
}

// ============================================================
// USER ACCOUNT - CERTIFICATES
// ============================================================

export interface CertificateWithEvent {
  id: string;
  certificate_code: string;
  ticket_id?: string;
  user_id: string;
  event_id: string;
  attendee_name: string;
  pdf_url?: string;
  generated_at: string;
  sent_at?: string;
  event?: Event;
}

/**
 * Get user's certificates
 */
export async function getUserCertificates(userId: string): Promise<CertificateWithEvent[]> {
  const { data, error } = await supabaseAdmin
    .from('certificates')
    .select(`
      *,
      event:events (*)
    `)
    .eq('user_id', userId)
    .order('generated_at', { ascending: false });

  if (error) throw error;
  return (data || []) as CertificateWithEvent[];
}

/**
 * Get certificate by code (for public validation)
 */
export async function getCertificateByCode(code: string): Promise<CertificateWithEvent | null> {
  const { data, error } = await supabaseAdmin
    .from('certificates')
    .select(`
      *,
      event:events (*)
    `)
    .eq('certificate_code', code)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as CertificateWithEvent;
}

// ============================================================
// USER ACCOUNT - SEMINAR REGISTRATIONS
// ============================================================

export interface SeminarRegistrationWithDetails {
  id: string;
  user_id: string;
  seminar_id: string;
  order_id?: string;
  registration_date: string;
  start_session_date?: string;
  sessions_completed: number;
  sessions_remaining: number;
  makeup_used: boolean;
  status: string;
  qr_code?: string;
  qr_code_url?: string;
  notes?: string;
  created_at: string;
  seminar?: Seminar;
  attendance?: SeminarAttendanceRecord[];
}

export interface SeminarAttendanceRecord {
  id: string;
  registration_id: string;
  session_id: string;
  user_id: string;
  seminar_id: string;
  attended: boolean;
  checked_in_at: string;
  is_makeup: boolean;
  credits_awarded: number;
  session?: SeminarSession;
}

/**
 * Get user's seminar registrations with attendance
 */
export async function getUserSeminarRegistrations(userId: string): Promise<SeminarRegistrationWithDetails[]> {
  const { data, error } = await supabaseAdmin
    .from('seminar_registrations')
    .select(`
      *,
      seminar:seminars (*),
      attendance:seminar_attendance (
        *,
        session:seminar_sessions (*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as SeminarRegistrationWithDetails[];
}

/**
 * Get active seminar registration for user
 */
export async function getUserActiveSeminarRegistration(userId: string): Promise<SeminarRegistrationWithDetails | null> {
  const { data, error } = await supabaseAdmin
    .from('seminar_registrations')
    .select(`
      *,
      seminar:seminars (*),
      attendance:seminar_attendance (
        *,
        session:seminar_sessions (*)
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as SeminarRegistrationWithDetails;
}

// ============================================================
// CHECKOUT HELPERS
// ============================================================

/**
 * Create or get user by email (for guest checkout)
 */
export async function getOrCreateUserByEmail(email: string, name?: string) {
  // Try to find existing user
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (existingUser) return existingUser;

  // Create new guest user
  const nameParts = (name || '').split(' ');
  const { data: newUser, error } = await supabaseAdmin
    .from('users')
    .insert({
      email: email.toLowerCase(),
      first_name: nameParts[0] || null,
      last_name: nameParts.slice(1).join(' ') || null,
      role: 'customer',
    })
    .select()
    .single();

  if (error) throw error;
  return newUser;
}

// ============================================
// ADMIN QUERIES
// ============================================

/**
 * Get all events for admin (including unpublished)
 */
export async function getAllEventsAdmin() {
  const { data, error } = await supabaseAdmin
    .from('events')
    .select('*')
    .order('start_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get upcoming events for attendance management
 */
export async function getUpcomingEventsForAttendance() {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('events')
    .select('*')
    .gte('end_date', now)
    .eq('status', 'published')
    .order('start_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get tickets for an event (for attendance list)
 */
export async function getEventTicketsForAttendance(eventId: string) {
  const { data, error } = await supabaseAdmin
    .from('tickets')
    .select(`
      *,
      ticket_type:ticket_types(*),
      user:users(id, email, first_name, last_name),
      attendance:attendance(*)
    `)
    .eq('event_id', eventId)
    .in('status', ['valid', 'used'])
    .order('attendee_name', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Check in an attendee
 */
export async function checkInAttendee(ticketId: string, checkedInBy: string, method: 'qr_scan' | 'manual' | 'search' = 'manual') {
  // Get ticket info
  const { data: ticket, error: ticketError } = await supabaseAdmin
    .from('tickets')
    .select('*, event:events(*)')
    .eq('id', ticketId)
    .single();

  if (ticketError) throw ticketError;
  if (!ticket) throw new Error('Ticket not found');
  if (ticket.status === 'used') throw new Error('Ticket already used');
  if (ticket.status === 'cancelled') throw new Error('Ticket is cancelled');

  // Create attendance record
  const { data: attendance, error: attendanceError } = await supabaseAdmin
    .from('attendance')
    .insert({
      ticket_id: ticketId,
      event_id: ticket.event_id,
      user_id: ticket.user_id,
      checked_in_by: checkedInBy,
      check_in_method: method,
    })
    .select()
    .single();

  if (attendanceError) throw attendanceError;

  // Update ticket status
  await supabaseAdmin
    .from('tickets')
    .update({ status: 'used' })
    .eq('id', ticketId);

  // Auto-award CE credits if event has ce_credits
  if (ticket.event?.ce_credits && ticket.event.ce_credits > 0) {
    await supabaseAdmin
      .from('ce_ledger')
      .insert({
        user_id: ticket.user_id,
        event_id: ticket.event_id,
        credits: ticket.event.ce_credits,
        source: 'event_attendance',
        transaction_type: 'earned',
        notes: `Earned for attending ${ticket.event.title}`,
      });
  }

  return attendance;
}

/**
 * Get attendees who have checked in for an event
 */
export async function getEventCheckedInAttendees(eventId: string) {
  const { data, error } = await supabaseAdmin
    .from('attendance')
    .select(`
      *,
      ticket:tickets(*),
      user:users(id, email, first_name, last_name),
      checked_in_by_user:users!attendance_checked_in_by_fkey(id, email, first_name, last_name)
    `)
    .eq('event_id', eventId)
    .order('checked_in_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get all certificates for an event (admin)
 */
export async function getEventCertificatesAdmin(eventId: string) {
  const { data, error } = await supabaseAdmin
    .from('certificates')
    .select(`
      *,
      user:users(id, email, first_name, last_name),
      event:events(id, title, start_date, ce_credits)
    `)
    .eq('event_id', eventId)
    .order('generated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get attendees eligible for certificates (checked in but no certificate yet)
 */
export async function getEligibleForCertificates(eventId: string) {
  // Get all attendance records for the event
  const { data: attendees, error: attendeesError } = await supabaseAdmin
    .from('attendance')
    .select(`
      *,
      ticket:tickets(*),
      user:users(id, email, first_name, last_name)
    `)
    .eq('event_id', eventId);

  if (attendeesError) throw attendeesError;

  // Get existing certificates for the event
  const { data: certificates, error: certsError } = await supabaseAdmin
    .from('certificates')
    .select('ticket_id, user_id')
    .eq('event_id', eventId);

  if (certsError) throw certsError;

  // Filter out attendees who already have certificates
  const certifiedTicketIds = new Set((certificates || []).map(c => c.ticket_id));
  const eligible = (attendees || []).filter(a => !certifiedTicketIds.has(a.ticket_id));

  return eligible;
}

/**
 * Generate certificate for an attendee
 */
export async function generateCertificate(ticketId: string, eventId: string, userId: string, attendeeName: string) {
  // Generate unique certificate code
  const code = `GPS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const { data, error } = await supabaseAdmin
    .from('certificates')
    .insert({
      certificate_code: code,
      ticket_id: ticketId,
      event_id: eventId,
      user_id: userId,
      attendee_name: attendeeName,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get waitlist entries for an event (admin)
 */
export async function getEventWaitlistAdmin(eventId: string) {
  const { data, error } = await supabaseAdmin
    .from('waitlist')
    .select(`
      *,
      ticket_type:ticket_types(id, name, price),
      event:events(id, title, start_date)
    `)
    .eq('event_id', eventId)
    .order('position', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get all waitlist entries (admin)
 */
export async function getAllWaitlistAdmin() {
  const { data, error } = await supabaseAdmin
    .from('waitlist')
    .select(`
      *,
      ticket_type:ticket_types(id, name, price),
      event:events(id, title, start_date)
    `)
    .in('status', ['waiting', 'notified'])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Notify next person in waitlist
 */
export async function notifyNextInWaitlist(ticketTypeId: string) {
  const next = await getNextInWaitlist(ticketTypeId);
  if (!next) return null;

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48);

  const { data, error } = await supabaseAdmin
    .from('waitlist')
    .update({
      status: 'notified',
      notified_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .eq('id', next.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Cancel waitlist entry
 */
export async function cancelWaitlistEntry(waitlistId: string) {
  const { error } = await supabaseAdmin
    .from('waitlist')
    .update({ status: 'cancelled' })
    .eq('id', waitlistId);

  if (error) throw error;
}

/**
 * Get waitlist entry by ID
 */
export async function getWaitlistEntryById(waitlistId: string) {
  const { data, error } = await supabaseAdmin
    .from('waitlist')
    .select(`
      *,
      event:events(id, title, slug, start_date, end_date, venue),
      ticket_type:ticket_types(id, name, price)
    `)
    .eq('id', waitlistId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

/**
 * Update waitlist entry status
 */
export async function updateWaitlistStatus(
  waitlistId: string,
  status: 'waiting' | 'notified' | 'converted' | 'expired' | 'cancelled',
  expiresAt?: string
) {
  const updateData: any = {
    status,
    ...(status === 'notified' && { notified_at: new Date().toISOString() }),
    ...(expiresAt && { expires_at: expiresAt }),
  };

  const { error } = await supabaseAdmin
    .from('waitlist')
    .update(updateData)
    .eq('id', waitlistId);

  if (error) throw error;
}

/**
 * Get admin stats for dashboard
 */
export async function getAdminDashboardStats() {
  const now = new Date().toISOString();

  // Upcoming events count
  const { count: upcomingEvents } = await supabaseAdmin
    .from('events')
    .select('*', { count: 'exact', head: true })
    .gte('start_date', now)
    .eq('status', 'published');

  // Total tickets sold (valid + used)
  const { count: ticketsSold } = await supabaseAdmin
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .in('status', ['valid', 'used']);

  // Waitlist entries
  const { count: waitlistCount } = await supabaseAdmin
    .from('waitlist')
    .select('*', { count: 'exact', head: true })
    .in('status', ['waiting', 'notified']);

  // Certificates generated this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const { count: certificatesThisMonth } = await supabaseAdmin
    .from('certificates')
    .select('*', { count: 'exact', head: true })
    .gte('generated_at', startOfMonth.toISOString());

  return {
    upcomingEvents: upcomingEvents || 0,
    ticketsSold: ticketsSold || 0,
    waitlistCount: waitlistCount || 0,
    certificatesThisMonth: certificatesThisMonth || 0,
  };
}

// ============================================================
// CERTIFICATE TEMPLATES
// ============================================================

/**
 * Get all certificate templates
 */
export async function getCertificateTemplates() {
  const { data, error } = await supabaseAdmin
    .from('certificate_templates')
    .select('*')
    .eq('status', 'active')
    .order('name', { ascending: true });

  if (error) throw error;
  return data as CertificateTemplate[];
}

/**
 * Get certificate template by ID
 */
export async function getCertificateTemplateById(templateId: string) {
  const { data, error } = await supabaseAdmin
    .from('certificate_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as CertificateTemplate;
}

/**
 * Get certificate template by slug
 */
export async function getCertificateTemplateBySlug(slug: string) {
  const { data, error } = await supabaseAdmin
    .from('certificate_templates')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as CertificateTemplate;
}

/**
 * Get default template by type
 */
export async function getDefaultCertificateTemplate(templateType: CertificateTemplateType) {
  const { data, error } = await supabaseAdmin
    .from('certificate_templates')
    .select('*')
    .eq('template_type', templateType)
    .eq('is_default', true)
    .eq('status', 'active')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as CertificateTemplate;
}

/**
 * Get templates by type
 */
export async function getCertificateTemplatesByType(templateType: CertificateTemplateType) {
  const { data, error } = await supabaseAdmin
    .from('certificate_templates')
    .select('*')
    .eq('template_type', templateType)
    .eq('status', 'active')
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });

  if (error) throw error;
  return data as CertificateTemplate[];
}

/**
 * Create certificate template
 */
export async function createCertificateTemplate(templateData: Partial<CertificateTemplate>) {
  const { data, error } = await supabaseAdmin
    .from('certificate_templates')
    .insert(templateData)
    .select()
    .single();

  if (error) throw error;
  return data as CertificateTemplate;
}

/**
 * Update certificate template
 */
export async function updateCertificateTemplate(templateId: string, templateData: Partial<CertificateTemplate>) {
  const { data, error } = await supabaseAdmin
    .from('certificate_templates')
    .update(templateData)
    .eq('id', templateId)
    .select()
    .single();

  if (error) throw error;
  return data as CertificateTemplate;
}

/**
 * Delete certificate template (soft delete - sets to archived)
 */
export async function deleteCertificateTemplate(templateId: string) {
  const { error } = await supabaseAdmin
    .from('certificate_templates')
    .update({ status: 'archived' })
    .eq('id', templateId);

  if (error) throw error;
}

/**
 * Set default template (will trigger the DB trigger to unset previous default)
 */
export async function setDefaultCertificateTemplate(templateId: string) {
  const { data, error } = await supabaseAdmin
    .from('certificate_templates')
    .update({ is_default: true })
    .eq('id', templateId)
    .select()
    .single();

  if (error) throw error;
  return data as CertificateTemplate;
}

/**
 * Duplicate a template with a new name
 */
export async function duplicateCertificateTemplate(templateId: string, newName: string, newSlug: string) {
  // Get the original template
  const original = await getCertificateTemplateById(templateId);
  if (!original) throw new Error('Template not found');

  // Remove id and metadata fields, set new name/slug
  const { id, created_at, updated_at, ...templateData } = original;

  return createCertificateTemplate({
    ...templateData,
    name: newName,
    slug: newSlug,
    is_default: false, // Duplicates are never default
  });
}

// ============================================================
// SITE FEATURES
// ============================================================

/**
 * Get site features by section
 */
export async function getSiteFeaturesBySection(section: string) {
  const { data, error } = await supabaseAdmin
    .from('site_features')
    .select('*')
    .eq('section', section)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data as SiteFeature[];
}

/**
 * Get all site features
 */
export async function getAllSiteFeatures() {
  const { data, error } = await supabaseAdmin
    .from('site_features')
    .select('*')
    .order('section', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data as SiteFeature[];
}

/**
 * Get site feature by ID
 */
export async function getSiteFeatureById(featureId: string) {
  const { data, error } = await supabaseAdmin
    .from('site_features')
    .select('*')
    .eq('id', featureId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as SiteFeature;
}

/**
 * Create site feature
 */
export async function createSiteFeature(featureData: InsertSiteFeature) {
  const { data, error } = await supabaseAdmin
    .from('site_features')
    .insert(featureData)
    .select()
    .single();

  if (error) throw error;
  return data as SiteFeature;
}

/**
 * Update site feature
 */
export async function updateSiteFeature(featureId: string, featureData: Partial<SiteFeature>) {
  const { data, error } = await supabaseAdmin
    .from('site_features')
    .update(featureData)
    .eq('id', featureId)
    .select()
    .single();

  if (error) throw error;
  return data as SiteFeature;
}

/**
 * Delete site feature
 */
export async function deleteSiteFeature(featureId: string) {
  const { error } = await supabaseAdmin
    .from('site_features')
    .delete()
    .eq('id', featureId);

  if (error) throw error;
}

/**
 * Reorder site features within a section
 */
export async function reorderSiteFeatures(section: string, orderedIds: string[]) {
  // Update sort_order for each feature
  const updates = orderedIds.map((id, index) =>
    supabaseAdmin
      .from('site_features')
      .update({ sort_order: index + 1 })
      .eq('id', id)
      .eq('section', section)
  );

  await Promise.all(updates);
}

// ============================================================
// SEMINAR REGISTRATIONS - WRITE OPERATIONS
// ============================================================

export interface InsertSeminarRegistration {
  user_id: string;
  seminar_id: string;
  order_id?: string;
  start_session_date?: string;
  qr_code?: string;
  qr_code_url?: string;
}

/**
 * Create a new seminar registration
 * - Sets sessions_completed=0, sessions_remaining=10
 * - Status = 'active'
 * - makeup_used = false
 */
export async function createSeminarRegistration(data: InsertSeminarRegistration) {
  const { data: registration, error } = await supabaseAdmin
    .from('seminar_registrations')
    .insert({
      user_id: data.user_id,
      seminar_id: data.seminar_id,
      order_id: data.order_id || null,
      registration_date: new Date().toISOString(),
      start_session_date: data.start_session_date || null,
      sessions_completed: 0,
      sessions_remaining: 10,
      makeup_used: false,
      status: 'active',
      qr_code: data.qr_code || null,
      qr_code_url: data.qr_code_url || null,
    })
    .select(`
      *,
      seminar:seminars (*)
    `)
    .single();

  if (error) throw error;
  return registration as SeminarRegistration & { seminar: Seminar };
}

/**
 * Update seminar registration
 */
export async function updateSeminarRegistration(
  registrationId: string,
  data: Partial<{
    sessions_completed: number;
    sessions_remaining: number;
    makeup_used: boolean;
    status: 'active' | 'completed' | 'cancelled' | 'on_hold';
    qr_code: string;
    qr_code_url: string;
    notes: string;
  }>
) {
  const { data: registration, error } = await supabaseAdmin
    .from('seminar_registrations')
    .update(data)
    .eq('id', registrationId)
    .select(`
      *,
      seminar:seminars (*)
    `)
    .single();

  if (error) throw error;
  return registration as SeminarRegistration & { seminar: Seminar };
}

/**
 * Get registration by QR code
 */
export async function getSeminarRegistrationByQRCode(qrCode: string) {
  const { data, error } = await supabaseAdmin
    .from('seminar_registrations')
    .select(`
      *,
      seminar:seminars (*),
      user:users (id, email, first_name, last_name)
    `)
    .eq('qr_code', qrCode)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

/**
 * Get registration by ID
 */
export async function getSeminarRegistrationById(registrationId: string) {
  const { data, error } = await supabaseAdmin
    .from('seminar_registrations')
    .select(`
      *,
      seminar:seminars (*),
      user:users (id, email, first_name, last_name),
      attendance:seminar_attendance (
        *,
        session:seminar_sessions (*)
      )
    `)
    .eq('id', registrationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

/**
 * Cancel a seminar registration
 */
export async function cancelSeminarRegistration(registrationId: string) {
  const { error } = await supabaseAdmin
    .from('seminar_registrations')
    .update({ status: 'cancelled' })
    .eq('id', registrationId);

  if (error) throw error;
}

/**
 * Mark makeup as used for a registration
 */
export async function useSeminarMakeup(registrationId: string) {
  const { data, error } = await supabaseAdmin
    .from('seminar_registrations')
    .update({ makeup_used: true })
    .eq('id', registrationId)
    .select()
    .single();

  if (error) throw error;
  return data as SeminarRegistration;
}

// ============================================================
// SEMINAR ATTENDANCE - CHECK-IN OPERATIONS
// ============================================================

export interface InsertSeminarAttendance {
  registration_id: string;
  session_id: string;
  user_id: string;
  seminar_id: string;
  is_makeup?: boolean;
  credits_awarded?: number;
  checked_in_by?: string;
  notes?: string;
}

/**
 * Record seminar session attendance (check-in)
 * - Awards 2 CE credits by default
 * - Updates registration's sessions_completed/remaining
 */
export async function recordSeminarAttendance(data: InsertSeminarAttendance) {
  // First, check if already checked in for this session
  const { data: existing } = await supabaseAdmin
    .from('seminar_attendance')
    .select('id')
    .eq('registration_id', data.registration_id)
    .eq('session_id', data.session_id)
    .maybeSingle();

  if (existing) {
    throw new Error('Already checked in for this session');
  }

  // Get registration to validate
  const { data: registration, error: regError } = await supabaseAdmin
    .from('seminar_registrations')
    .select('*, seminar:seminars(*)')
    .eq('id', data.registration_id)
    .single();

  if (regError) throw regError;
  if (!registration) throw new Error('Registration not found');
  if (registration.status !== 'active') throw new Error('Registration is not active');
  if (registration.sessions_remaining <= 0) throw new Error('No sessions remaining');

  // If it's a makeup session, validate makeup_used is false
  if (data.is_makeup && registration.makeup_used) {
    throw new Error('Makeup session already used for this year');
  }

  // Create attendance record
  const creditsToAward = data.credits_awarded ?? 2;
  const { data: attendance, error: attendanceError } = await supabaseAdmin
    .from('seminar_attendance')
    .insert({
      registration_id: data.registration_id,
      session_id: data.session_id,
      user_id: data.user_id,
      seminar_id: data.seminar_id,
      attended: true,
      checked_in_at: new Date().toISOString(),
      checked_in_by: data.checked_in_by || null,
      is_makeup: data.is_makeup || false,
      credits_awarded: creditsToAward,
      notes: data.notes || null,
    })
    .select(`
      *,
      session:seminar_sessions (*)
    `)
    .single();

  if (attendanceError) throw attendanceError;

  // Update registration counters
  const newSessionsCompleted = registration.sessions_completed + 1;
  const newSessionsRemaining = registration.sessions_remaining - 1;
  const newStatus = newSessionsRemaining === 0 ? 'completed' : 'active';

  const updateData: any = {
    sessions_completed: newSessionsCompleted,
    sessions_remaining: newSessionsRemaining,
    status: newStatus,
  };

  // Mark makeup as used if this was a makeup session
  if (data.is_makeup) {
    updateData.makeup_used = true;
  }

  await supabaseAdmin
    .from('seminar_registrations')
    .update(updateData)
    .eq('id', data.registration_id);

  // Award CE credits
  await supabaseAdmin
    .from('ce_ledger')
    .insert({
      user_id: data.user_id,
      event_id: null, // Seminars use seminar_id, not event_id
      credits: creditsToAward,
      source: 'seminar_session',
      transaction_type: 'earned',
      notes: `Earned for attending ${registration.seminar?.title || 'Monthly Seminar'} session${data.is_makeup ? ' (Makeup)' : ''}`,
    });

  return {
    attendance,
    registration: {
      ...registration,
      sessions_completed: newSessionsCompleted,
      sessions_remaining: newSessionsRemaining,
      status: newStatus,
    },
    creditsAwarded: creditsToAward,
  };
}

/**
 * Get session by ID
 */
export async function getSeminarSessionById(sessionId: string) {
  const { data, error } = await supabaseAdmin
    .from('seminar_sessions')
    .select(`
      *,
      seminar:seminars (*)
    `)
    .eq('id', sessionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as SeminarSession & { seminar: Seminar };
}

/**
 * Check if user is checked in for a specific session
 */
export async function isSeminarSessionCheckedIn(registrationId: string, sessionId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('seminar_attendance')
    .select('id')
    .eq('registration_id', registrationId)
    .eq('session_id', sessionId)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}

/**
 * Get all attendance records for a registration
 */
export async function getSeminarAttendanceByRegistration(registrationId: string) {
  const { data, error } = await supabaseAdmin
    .from('seminar_attendance')
    .select(`
      *,
      session:seminar_sessions (*)
    `)
    .eq('registration_id', registrationId)
    .order('checked_in_at', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get all attendance for a session (admin)
 */
export async function getSeminarSessionAttendance(sessionId: string) {
  const { data, error } = await supabaseAdmin
    .from('seminar_attendance')
    .select(`
      *,
      registration:seminar_registrations (*),
      user:users (id, email, first_name, last_name)
    `)
    .eq('session_id', sessionId)
    .order('checked_in_at', { ascending: true });

  if (error) throw error;
  return data;
}

// ============================================================
// SEMINAR SESSIONS - ADMIN OPERATIONS
// ============================================================

/**
 * Get upcoming sessions for a seminar
 */
export async function getUpcomingSeminarSessions(seminarId: string, limit = 5) {
  const { data, error } = await supabaseAdmin
    .from('seminar_sessions')
    .select('*')
    .eq('seminar_id', seminarId)
    .gte('session_date', new Date().toISOString().split('T')[0])
    .order('session_date', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data as SeminarSession[];
}

/**
 * Get all sessions for a seminar with attendance count
 */
export async function getSeminarSessionsWithAttendance(seminarId: string) {
  const { data: sessions, error: sessionsError } = await supabaseAdmin
    .from('seminar_sessions')
    .select('*')
    .eq('seminar_id', seminarId)
    .order('session_number', { ascending: true });

  if (sessionsError) throw sessionsError;

  // Get attendance counts for each session
  const sessionsWithAttendance = await Promise.all(
    (sessions || []).map(async (session) => {
      const { count, error } = await supabaseAdmin
        .from('seminar_attendance')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', session.id);

      if (error) throw error;
      return {
        ...session,
        attendance_count: count || 0,
      };
    })
  );

  return sessionsWithAttendance;
}

// ============================================================
// SEMINAR CERTIFICATES - BI-ANNUAL GENERATION
// ============================================================

export interface SeminarCertificateData {
  registration_id: string;
  user_id: string;
  seminar_id: string;
  attendee_name: string;
  period: 'first_half' | 'second_half';
  credits_earned: number;
  pdf_url?: string;
}

/**
 * Get registrations eligible for bi-annual certificates
 * @param seminarId The seminar ID
 * @param period 'first_half' (Jan-Jun) or 'second_half' (Jul-Dec)
 * @param year The year to check
 */
export async function getEligibleForSeminarCertificates(
  seminarId: string,
  period: 'first_half' | 'second_half',
  year: number
) {
  // Determine date range
  const startDate = period === 'first_half'
    ? `${year}-01-01`
    : `${year}-07-01`;
  const endDate = period === 'first_half'
    ? `${year}-06-30`
    : `${year}-12-31`;

  // Get all active/completed registrations for this seminar
  const { data: registrations, error: regError } = await supabaseAdmin
    .from('seminar_registrations')
    .select(`
      *,
      user:users (id, email, first_name, last_name),
      seminar:seminars (*)
    `)
    .eq('seminar_id', seminarId)
    .in('status', ['active', 'completed']);

  if (regError) throw regError;

  // For each registration, get attendance in the period and check if they qualify
  const eligibleRegistrations = [];

  for (const reg of registrations || []) {
    // Get attendance in the period
    const { data: attendance, error: attError } = await supabaseAdmin
      .from('seminar_attendance')
      .select('*, session:seminar_sessions(*)')
      .eq('registration_id', reg.id)
      .gte('checked_in_at', startDate)
      .lte('checked_in_at', `${endDate}T23:59:59`);

    if (attError) throw attError;

    // Check if they already have a certificate for this period
    const { data: existingCert } = await supabaseAdmin
      .from('certificates')
      .select('id')
      .eq('user_id', reg.user_id)
      .eq('event_id', seminarId)
      .like('notes', `%${period}%${year}%`)
      .maybeSingle();

    if (existingCert) continue; // Already has certificate

    // Calculate credits earned in period
    const creditsEarned = (attendance || []).reduce(
      (sum, att) => sum + (att.credits_awarded || 0),
      0
    );

    if (creditsEarned > 0) {
      eligibleRegistrations.push({
        registration: reg,
        user: reg.user,
        seminar: reg.seminar,
        attendance: attendance || [],
        credits_earned: creditsEarned,
        sessions_in_period: (attendance || []).length,
      });
    }
  }

  return eligibleRegistrations;
}

/**
 * Create a seminar certificate
 */
export async function createSeminarCertificate(data: {
  user_id: string;
  seminar_id: string;
  attendee_name: string;
  credits: number;
  period: string;
  year: number;
  pdf_url?: string;
}) {
  // Generate unique certificate code
  const year = data.year.toString().slice(-2);
  const periodCode = data.period === 'first_half' ? 'H1' : 'H2';
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const certificateCode = `GPS-SEM-${year}${periodCode}-${randomPart}`;

  const { data: certificate, error } = await supabaseAdmin
    .from('certificates')
    .insert({
      certificate_code: certificateCode,
      ticket_id: null,
      user_id: data.user_id,
      event_id: data.seminar_id, // Using event_id to store seminar_id
      attendee_name: data.attendee_name,
      pdf_url: data.pdf_url || null,
      notes: `Seminar Certificate - ${data.period} ${data.year} - ${data.credits} CE Credits`,
    })
    .select()
    .single();

  if (error) throw error;
  return certificate as Certificate;
}

/**
 * Get user's seminar certificates
 */
export async function getUserSeminarCertificates(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('certificates')
    .select(`
      *,
      seminar:seminars (*)
    `)
    .eq('user_id', userId)
    .like('certificate_code', 'GPS-SEM-%')
    .order('generated_at', { ascending: false });

  if (error) throw error;
  return data;
}

// ============================================================
// SEMINAR ADMIN QUERIES
// ============================================================

/**
 * Get all seminar registrations for admin
 */
export async function getAllSeminarRegistrationsAdmin(seminarId?: string) {
  let query = supabaseAdmin
    .from('seminar_registrations')
    .select(`
      *,
      user:users (id, email, first_name, last_name),
      seminar:seminars (*),
      attendance:seminar_attendance (count)
    `)
    .order('created_at', { ascending: false });

  if (seminarId) {
    query = query.eq('seminar_id', seminarId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Get seminar with all its data (admin)
 */
export async function getSeminarWithFullData(seminarId: string) {
  const { data: seminar, error: seminarError } = await supabaseAdmin
    .from('seminars')
    .select(`
      *,
      sessions:seminar_sessions (*),
      moderators:seminar_moderators (
        *,
        speaker:speakers (*)
      )
    `)
    .eq('id', seminarId)
    .single();

  if (seminarError) throw seminarError;

  // Get registration count
  const { count: registrationCount } = await supabaseAdmin
    .from('seminar_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('seminar_id', seminarId)
    .in('status', ['active', 'completed']);

  return {
    ...seminar,
    registration_count: registrationCount || 0,
  };
}

/**
 * Get seminar stats for admin dashboard
 */
export async function getSeminarStats(seminarId: string) {
  // Total registrations
  const { count: totalRegistrations } = await supabaseAdmin
    .from('seminar_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('seminar_id', seminarId);

  // Active registrations
  const { count: activeRegistrations } = await supabaseAdmin
    .from('seminar_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('seminar_id', seminarId)
    .eq('status', 'active');

  // Completed registrations
  const { count: completedRegistrations } = await supabaseAdmin
    .from('seminar_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('seminar_id', seminarId)
    .eq('status', 'completed');

  // Total attendance records
  const { count: totalAttendance } = await supabaseAdmin
    .from('seminar_attendance')
    .select('*', { count: 'exact', head: true })
    .eq('seminar_id', seminarId);

  // Total credits awarded
  const { data: creditsData } = await supabaseAdmin
    .from('seminar_attendance')
    .select('credits_awarded')
    .eq('seminar_id', seminarId);

  const totalCreditsAwarded = (creditsData || []).reduce(
    (sum, row) => sum + (row.credits_awarded || 0),
    0
  );

  return {
    total_registrations: totalRegistrations || 0,
    active_registrations: activeRegistrations || 0,
    completed_registrations: completedRegistrations || 0,
    total_attendance: totalAttendance || 0,
    total_credits_awarded: totalCreditsAwarded,
  };
}

/**
 * Delete seminar attendance record (undo check-in)
 * - Reverts registration session counts
 * - Removes CE credits from ledger
 */
export async function deleteSeminarAttendance(attendanceId: string) {
  // Get attendance record first
  const { data: attendance, error: fetchError } = await supabaseAdmin
    .from('seminar_attendance')
    .select('*, registration:seminar_registrations(*)')
    .eq('id', attendanceId)
    .single();

  if (fetchError || !attendance) {
    throw new Error('Attendance record not found');
  }

  // Delete the attendance record
  const { error: deleteError } = await supabaseAdmin
    .from('seminar_attendance')
    .delete()
    .eq('id', attendanceId);

  if (deleteError) throw deleteError;

  // Update registration counters
  const registration = attendance.registration;
  if (registration) {
    const newSessionsCompleted = Math.max(0, registration.sessions_completed - 1);
    const newSessionsRemaining = Math.min(10, registration.sessions_remaining + 1);
    const updateData: any = {
      sessions_completed: newSessionsCompleted,
      sessions_remaining: newSessionsRemaining,
    };

    // Revert status if needed
    if (registration.status === 'completed' && newSessionsRemaining > 0) {
      updateData.status = 'active';
    }

    // Revert makeup_used if this was a makeup session
    if (attendance.is_makeup) {
      updateData.makeup_used = false;
    }

    await supabaseAdmin
      .from('seminar_registrations')
      .update(updateData)
      .eq('id', attendance.registration_id);
  }

  // Remove CE credits from ledger (best effort - find by user, source, and approximate time)
  await supabaseAdmin
    .from('ce_ledger')
    .delete()
    .eq('user_id', attendance.user_id)
    .eq('source', 'seminar_session')
    .gte('created_at', new Date(new Date(attendance.checked_in_at).getTime() - 60000).toISOString())
    .lte('created_at', new Date(new Date(attendance.checked_in_at).getTime() + 60000).toISOString());

  return { success: true, attendance };
}
