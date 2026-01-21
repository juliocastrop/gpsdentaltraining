/**
 * GPS Dental Training - Database Types
 * These types mirror the PostgreSQL schema in Supabase
 */

// User roles
export type UserRole = 'customer' | 'admin' | 'staff';

// Ticket types
export type TicketType = 'early_bird' | 'general' | 'vip' | 'group';

// Order status
export type OrderStatus = 'pending' | 'completed' | 'cancelled' | 'refunded';

// Payment status
export type PaymentStatus = 'unpaid' | 'paid' | 'partially_refunded' | 'refunded';

// Ticket status
export type TicketStatus = 'valid' | 'used' | 'cancelled';

// Waitlist status
export type WaitlistStatus = 'waiting' | 'notified' | 'converted' | 'expired' | 'removed';

// Check-in method
export type CheckInMethod = 'qr_scan' | 'manual' | 'search';

// CE Credit transaction type
export type CreditTransactionType = 'earned' | 'adjustment' | 'revoked';

// CE Credit source
export type CreditSource = 'course_attendance' | 'seminar_session' | 'manual';

// Seminar registration status
export type SeminarRegistrationStatus = 'active' | 'completed' | 'cancelled' | 'on_hold';

// Event/content status
export type ContentStatus = 'draft' | 'published' | 'archived';

// ============================================================
// Database Row Types
// ============================================================

export interface User {
  id: string;
  clerk_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  strapi_id: number | null;
  title: string;
  slug: string;
  description: string | null;
  excerpt: string | null;
  start_date: string;
  end_date: string | null;
  venue: string | null;
  address: string | null;
  ce_credits: number;
  capacity: number | null;
  schedule_topics: ScheduleTopic[] | null;
  featured_image_url: string | null;
  video_url: string | null;
  gallery_images: string[] | null;
  learning_objectives: string[] | null;
  includes: string[] | null;
  prerequisites: string[] | null;
  target_audience: string[] | null;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export interface Speaker {
  id: string;
  strapi_id: number | null;
  name: string;
  slug: string;
  title: string | null;
  bio: string | null;
  photo_url: string | null;
  social_links: SocialLinks | null;
  created_at: string;
  updated_at: string;
}

export interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  researchgate?: string;
}

export interface EventWithSpeakers extends Event {
  speakers: Speaker[];
}

export interface ScheduleTopic {
  day: number;
  time: string;
  topic: string;
  description?: string;
}

export interface TicketTypeRow {
  id: string;
  event_id: string;
  name: string;
  ticket_type: TicketType;
  price: number;
  quantity: number | null; // null = unlimited
  sale_start: string | null;
  sale_end: string | null;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  manual_sold_out: boolean;
  features: string[] | null;
  internal_label: string | null;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  billing_email: string;
  billing_name: string | null;
  subtotal: number | null;
  total: number;
  currency: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  completed_at: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  ticket_type_id: string;
  event_id: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}

export interface Ticket {
  id: string;
  ticket_code: string;
  ticket_type_id: string;
  event_id: string;
  order_id: string;
  user_id: string | null;
  attendee_name: string;
  attendee_email: string;
  qr_code_data: QRCodeData | null;
  qr_code_url: string | null;
  status: TicketStatus;
  created_at: string;
}

export interface QRCodeData {
  ticket_code: string;
  event_id: string;
  hash: string;
}

export interface Attendance {
  id: string;
  ticket_id: string;
  event_id: string;
  user_id: string | null;
  checked_in_at: string;
  check_in_method: CheckInMethod;
  checked_in_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface CELedger {
  id: string;
  user_id: string;
  event_id: string | null;
  credits: number;
  source: CreditSource;
  transaction_type: CreditTransactionType;
  notes: string | null;
  awarded_at: string;
}

export interface Waitlist {
  id: string;
  ticket_type_id: string;
  event_id: string;
  user_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  position: number;
  status: WaitlistStatus;
  notified_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface Certificate {
  id: string;
  certificate_code: string;
  ticket_id: string | null;
  user_id: string;
  event_id: string;
  attendee_name: string;
  pdf_url: string | null;
  generated_at: string;
  sent_at: string | null;
}

export interface SeminarAgendaItem {
  time: string;
  title: string;
  description?: string;
}

export interface Seminar {
  id: string;
  strapi_id: number | null;
  title: string;
  subtitle: string | null;
  slug: string;
  year: number;
  description: string | null;
  price: number;
  capacity: number | null;
  total_sessions: number;
  credits_per_session: number;
  total_credits: number;
  session_duration: string | null;
  featured_image_url: string | null;
  hero_image_url: string | null;
  program_description: string | null;
  benefits: string[] | null;
  membership_policy: string | null;
  refund_policy: string | null;
  makeup_policy: string | null;
  venue: string | null;
  address: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  agenda_items: SeminarAgendaItem[] | null;
  certificate_dates: string[] | null;
  accreditation_text: string | null;
  accreditation_logo_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  status: 'draft' | 'active' | 'completed' | 'archived';
  created_at: string;
}

export interface SeminarWithModerators extends Seminar {
  moderators: Speaker[];
}

export interface SeminarSession {
  id: string;
  seminar_id: string;
  session_number: number;
  session_date: string;
  session_time_start: string | null;
  session_time_end: string | null;
  topic: string | null;
  description: string | null;
  capacity: number | null;
  created_at: string;
}

export interface SeminarRegistration {
  id: string;
  user_id: string;
  seminar_id: string;
  order_id: string | null;
  registration_date: string;
  start_session_date: string | null;
  sessions_completed: number;
  sessions_remaining: number;
  makeup_used: boolean;
  status: SeminarRegistrationStatus;
  qr_code: string | null;
  qr_code_url: string | null;
  created_at: string;
}

export interface SeminarAttendance {
  id: string;
  registration_id: string;
  session_id: string;
  user_id: string;
  seminar_id: string;
  is_makeup: boolean;
  credits_awarded: number;
  checked_in_at: string;
  checked_in_by: string | null;
  notes: string | null;
}

// ============================================================
// API Response Types
// ============================================================

export interface EventAvailability {
  success: boolean;
  event: {
    id: string;
    title: string;
    url: string;
    start_date: string;
    start_date_formatted: string;
  };
  availability: {
    is_available: boolean;
    is_sold_out: boolean;
    has_active_tickets: boolean;
    reason: 'available' | 'sold_out' | 'manual_override' | 'no_tickets';
  };
  tickets: TicketAvailabilityInfo[];
  waitlist_enabled: boolean;
}

export interface TicketAvailabilityInfo {
  id: string;
  name: string;
  price: number;
  is_sold_out: boolean;
  is_manual_sold_out: boolean;
  stock: {
    total: number;
    sold: number;
    available: number;
    unlimited: boolean;
  };
}

export interface WaitlistEntry {
  id: string;
  event_id: string;
  event_title: string;
  ticket_id: string;
  ticket_title: string;
  position: number;
  status: WaitlistStatus;
  created_at: string;
  notified_at: string | null;
  expires_at: string | null;
}

// ============================================================
// Insert Types (for creating new records)
// ============================================================

export interface InsertUser {
  clerk_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: UserRole;
}

export interface InsertOrder {
  user_id?: string;
  stripe_session_id?: string;
  billing_email: string;
  billing_name?: string;
  total: number;
}

export interface InsertTicket {
  ticket_type_id: string;
  event_id: string;
  order_id: string;
  user_id?: string;
  attendee_name: string;
  attendee_email: string;
}

export interface InsertWaitlist {
  ticket_type_id?: string | null;
  event_id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
}

export interface InsertAttendance {
  ticket_id: string;
  event_id: string;
  user_id?: string;
  check_in_method: CheckInMethod;
  checked_in_by?: string;
  notes?: string;
}

export interface InsertCECredit {
  user_id: string;
  event_id?: string;
  credits: number;
  source: CreditSource;
  transaction_type?: CreditTransactionType;
  notes?: string;
}
