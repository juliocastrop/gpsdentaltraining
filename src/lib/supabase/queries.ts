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

export async function getEventBySlug(slug: string) {
  const { data, error } = await supabaseAdmin
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) throw error;
  return data as Event;
}

export async function getEventWithSpeakers(slug: string): Promise<EventWithSpeakers> {
  // Get the event
  const { data: event, error: eventError } = await supabaseAdmin
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

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

export async function getOrderById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Order;
}

export async function getOrderByStripeSession(sessionId: string) {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('stripe_session_id', sessionId)
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

export async function getUserOrders(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Order[];
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

export async function getTicketByCode(code: string) {
  const { data, error } = await supabaseAdmin
    .from('tickets')
    .select('*, events(*), ticket_types(*)')
    .eq('ticket_code', code)
    .single();

  if (error) throw error;
  return data;
}

export async function getUserTickets(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('tickets')
    .select('*, events(*), ticket_types(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
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
  ticket_id?: string;
  user_id: string;
  event_id: string;
  attendee_name: string;
  ce_credits?: number;
}) {
  const { data, error } = await supabaseAdmin
    .from('certificates')
    .insert(certificateData)
    .select()
    .single();

  if (error) throw error;
  return data as Certificate;
}

export async function getCertificateByCode(code: string) {
  const { data, error } = await supabaseAdmin
    .from('certificates')
    .select('*, events(*), users(*)')
    .eq('certificate_code', code)
    .single();

  if (error) throw error;
  return data;
}

export async function getUserCertificates(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('certificates')
    .select('*, events(*)')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false });

  if (error) throw error;
  return data;
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

export async function getUserSeminarRegistrations(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('seminar_registrations')
    .select('*, seminars(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
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
      if (!result.description) result.description = event.description;
      if (!result.image_url) result.image_url = event.featured_image_url;
      if (!result.cta_link) result.cta_link = `/courses/${event.slug}`;
      if (result.ce_credits === null || result.ce_credits === undefined) {
        result.ce_credits = event.ce_credits;
      }
    }

    // If linked to a seminar, use seminar data as fallback
    if (slide.linked_seminar && slide.linked_seminar_id) {
      const seminar = slide.linked_seminar as Seminar;
      if (!result.title) result.title = seminar.title;
      if (!result.description) result.description = seminar.description;
      if (!result.image_url) result.image_url = seminar.featured_image_url;
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
 * Get user by Clerk ID
 */
export async function getUserByClerkId(clerkId: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('clerk_id', clerkId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

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
