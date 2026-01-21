import { genAI, MODELS, GPS_SYSTEM_PROMPT, buildContextPrompt, type CourseContext, type SeminarContext, type ChatMessage } from './client';
import { supabase } from '../supabase/client';

interface AssistantResponse {
  success: boolean;
  response: string;
  sources?: {
    type: 'course' | 'seminar';
    title: string;
    url: string;
  }[];
}

// Fetch relevant courses from database
async function fetchCourseContext(): Promise<CourseContext[]> {
  const { data: events } = await supabase
    .from('events')
    .select(`
      id,
      title,
      slug,
      description,
      start_date,
      end_date,
      venue,
      ce_credits,
      ticket_types (
        id,
        name,
        price,
        quantity,
        sold_count,
        manual_sold_out
      )
    `)
    .eq('status', 'published')
    .gte('start_date', new Date().toISOString().split('T')[0])
    .order('start_date', { ascending: true })
    .limit(10);

  if (!events) return [];

  return events.map(event => ({
    id: event.id,
    title: event.title,
    slug: event.slug,
    description: event.description || undefined,
    startDate: event.start_date,
    endDate: event.end_date || undefined,
    venue: event.venue || undefined,
    ceCredits: event.ce_credits,
    ticketTypes: event.ticket_types?.map((ticket: any) => ({
      name: ticket.name,
      price: ticket.price,
      available: ticket.quantity - (ticket.sold_count || 0),
      soldOut: ticket.manual_sold_out || (ticket.quantity - (ticket.sold_count || 0)) <= 0
    }))
  }));
}

// Fetch seminar context from database
async function fetchSeminarContext(): Promise<SeminarContext[]> {
  const { data: seminars } = await supabase
    .from('seminars')
    .select(`
      id,
      title,
      slug,
      year,
      price,
      total_sessions,
      seminar_sessions (
        id,
        session_number,
        session_date,
        topic
      )
    `)
    .eq('status', 'active')
    .order('year', { ascending: false })
    .limit(2);

  if (!seminars) return [];

  const today = new Date().toISOString().split('T')[0];

  return seminars.map(seminar => ({
    id: seminar.id,
    title: seminar.title,
    year: seminar.year,
    price: seminar.price,
    totalSessions: seminar.total_sessions,
    upcomingSessions: seminar.seminar_sessions
      ?.filter((s: any) => s.session_date >= today)
      .sort((a: any, b: any) => a.session_date.localeCompare(b.session_date))
      .slice(0, 5)
      .map((s: any) => ({
        sessionNumber: s.session_number,
        date: s.session_date,
        topic: s.topic || undefined
      }))
  }));
}

// Main function to generate assistant response
export async function generateAssistantResponse(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<AssistantResponse> {
  // If Gemini is not configured, fall back to rule-based responses
  if (!genAI) {
    return generateFallbackResponse(userMessage);
  }

  try {
    // Fetch context from database
    const [courses, seminars] = await Promise.all([
      fetchCourseContext(),
      fetchSeminarContext()
    ]);

    // Build context-enriched prompt
    const contextPrompt = buildContextPrompt(courses, seminars, userMessage);

    // Get the Gemini model
    const model = genAI.getGenerativeModel({
      model: MODELS.FLASH,
      systemInstruction: GPS_SYSTEM_PROMPT,
    });

    // Start or continue chat
    const chat = model.startChat({
      history: conversationHistory,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
        topP: 0.9,
      },
    });

    // Send message with context
    const result = await chat.sendMessage(contextPrompt);
    const response = result.response.text();

    // Extract sources from the response context
    const sources: AssistantResponse['sources'] = [];

    // Check which courses were mentioned
    courses.forEach(course => {
      if (response.toLowerCase().includes(course.title.toLowerCase())) {
        sources.push({
          type: 'course',
          title: course.title,
          url: `/courses/${course.slug}`
        });
      }
    });

    // Check which seminars were mentioned
    seminars.forEach(seminar => {
      if (response.toLowerCase().includes(seminar.title.toLowerCase()) ||
          response.toLowerCase().includes('monthly seminar')) {
        sources.push({
          type: 'seminar',
          title: seminar.title,
          url: `/monthly-seminars/${seminar.title.toLowerCase().replace(/\s+/g, '-')}`
        });
      }
    });

    return {
      success: true,
      response,
      sources: sources.length > 0 ? sources : undefined
    };

  } catch (error) {
    console.error('Gemini API error:', error);
    // Fall back to rule-based responses on error
    return generateFallbackResponse(userMessage);
  }
}

// Fallback responses when Gemini is not available
async function generateFallbackResponse(userMessage: string): Promise<AssistantResponse> {
  const lowerMessage = userMessage.toLowerCase();

  // Fetch some data for context-aware fallback
  const { data: events } = await supabase
    .from('events')
    .select('title, slug, start_date, venue, ce_credits')
    .eq('status', 'published')
    .gte('start_date', new Date().toISOString().split('T')[0])
    .order('start_date', { ascending: true })
    .limit(5);

  // Course-related questions
  if (lowerMessage.includes('course') || lowerMessage.includes('upcoming') || lowerMessage.includes('event')) {
    if (events && events.length > 0) {
      let response = "Here are our upcoming courses:\n\n";
      events.forEach((event, i) => {
        const date = new Date(event.start_date).toLocaleDateString('en-US', {
          month: 'long', day: 'numeric', year: 'numeric'
        });
        response += `**${i + 1}. ${event.title}**\n`;
        response += `- Date: ${date}\n`;
        response += `- Location: ${event.venue || 'GPS Training Center'}\n`;
        response += `- CE Credits: ${event.ce_credits}\n\n`;
      });
      response += "Would you like more details about any of these courses?";
      return { success: true, response };
    }
  }

  // Monthly seminars
  if (lowerMessage.includes('seminar') || lowerMessage.includes('monthly')) {
    return {
      success: true,
      response: `**GPS Monthly Seminars** is our signature continuing education program:\n\n` +
        `- **Investment:** $750 (one-time enrollment)\n` +
        `- **Format:** 10 monthly sessions per cycle\n` +
        `- **CE Credits:** 2 credits per session (20 total)\n` +
        `- **Location:** GPS Training Center, Duluth, GA\n` +
        `- **Led by:** Dr. Carlos Castro, DDS, Prosthodontist\n\n` +
        `Topics include literature reviews, case discussions, and treatment planning seminars.\n\n` +
        `Would you like to learn more or register?`
    };
  }

  // Pricing questions
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('fee')) {
    return {
      success: true,
      response: `**GPS Dental Training Pricing:**\n\n` +
        `**Courses:**\n` +
        `- Early Bird: Starting at $1,299 - $1,499\n` +
        `- Regular: $1,599 - $1,999\n` +
        `- VIP packages available with additional benefits\n\n` +
        `**Monthly Seminars:**\n` +
        `- $750 for complete 10-session program\n\n` +
        `Prices vary by course. Would you like pricing for a specific course?`
    };
  }

  // CE Credits
  if (lowerMessage.includes('credit') || lowerMessage.includes('ce ')) {
    return {
      success: true,
      response: `**About CE Credits at GPS:**\n\n` +
        `- All courses are **PACE-approved** (Academy of General Dentistry)\n` +
        `- Credits range from 2-16 depending on the course\n` +
        `- Monthly Seminars: 2 CE credits per session\n` +
        `- Certificates issued upon completion\n\n` +
        `Your credits are tracked in your account dashboard. Which course are you interested in?`
    };
  }

  // Contact information
  if (lowerMessage.includes('contact') || lowerMessage.includes('email') || lowerMessage.includes('phone') || lowerMessage.includes('address')) {
    return {
      success: true,
      response: `**Contact GPS Dental Training:**\n\n` +
        `📧 **Email:** gpsdentaltraining@gaprostho.com\n\n` +
        `📍 **Address:**\n` +
        `6320 Sugarloaf Parkway\n` +
        `Duluth, GA 30097\n\n` +
        `🕐 **Hours:** Monday-Friday, 9 AM - 5 PM EST\n\n` +
        `How else can I help you?`
    };
  }

  // PRF courses
  if (lowerMessage.includes('prf') || lowerMessage.includes('choukroun') || lowerMessage.includes('platelet')) {
    return {
      success: true,
      response: `**PRF (Platelet-Rich Fibrin) Courses:**\n\n` +
        `Our PRF courses are taught by **Dr. Joseph Choukroun**, the inventor of PRF!\n\n` +
        `**You'll Learn:**\n` +
        `- A-PRF and i-PRF protocols\n` +
        `- Membrane and plug applications\n` +
        `- "Sticky bone" technique\n` +
        `- Sinus lift procedures\n\n` +
        `**Format:** 2-day intensive workshop with up to 16 CE credits\n\n` +
        `Would you like to know when the next PRF course is scheduled?`
    };
  }

  // Greetings
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return {
      success: true,
      response: `Hello! Welcome to GPS Dental Training! 👋\n\n` +
        `I can help you with:\n` +
        `- 📚 Course information and schedules\n` +
        `- 💰 Pricing and availability\n` +
        `- 🎓 CE credit details\n` +
        `- 📅 Monthly Seminars program\n` +
        `- 📝 Registration assistance\n\n` +
        `What would you like to know?`
    };
  }

  // Default response
  return {
    success: true,
    response: `I'm here to help you with GPS Dental Training! I can assist with:\n\n` +
      `- **Upcoming courses** - schedules, instructors, locations\n` +
      `- **Pricing** - ticket types and costs\n` +
      `- **CE Credits** - how many credits per course\n` +
      `- **Monthly Seminars** - our 10-session program\n` +
      `- **Registration** - how to enroll\n` +
      `- **Contact info** - how to reach us\n\n` +
      `What would you like to know more about?`
  };
}

// Export types
export type { AssistantResponse };
