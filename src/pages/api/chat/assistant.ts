import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase/client';

// This endpoint will be enhanced to use an LLM (Claude/OpenAI) with RAG
// For now, it provides intelligent responses based on database queries

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { message, history } = await request.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const lowerMessage = message.toLowerCase();
    let response = '';

    // Detect intent and gather relevant data
    if (lowerMessage.includes('course') || lowerMessage.includes('upcoming') || lowerMessage.includes('event')) {
      // Fetch upcoming courses
      const { data: events } = await supabase
        .from('events')
        .select('title, slug, start_date, end_date, venue, ce_credits')
        .eq('status', 'published')
        .gte('start_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true })
        .limit(5);

      if (events && events.length > 0) {
        response = "Here are our upcoming courses:\n\n";
        events.forEach((event, index) => {
          const startDate = new Date(event.start_date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          });
          response += `${index + 1}. **${event.title}**\n`;
          response += `   - Date: ${startDate}\n`;
          response += `   - Location: ${event.venue || 'TBA'}\n`;
          response += `   - CE Credits: ${event.ce_credits || 'N/A'}\n\n`;
        });
        response += "Would you like more details on any of these courses?";
      } else {
        response = "We're currently updating our course schedule. Please check back soon or contact us at gpsdentaltraining@gaprostho.com for the latest information.";
      }
    }
    else if (lowerMessage.includes('seminar') || lowerMessage.includes('monthly')) {
      // Fetch seminar info
      const { data: seminars } = await supabase
        .from('seminars')
        .select('*')
        .eq('status', 'active')
        .order('year', { ascending: false })
        .limit(1);

      response = "**GPS Monthly Seminars** is our signature 10-session program:\n\n";
      response += "- **Price:** $750 (one-time enrollment)\n";
      response += "- **Sessions:** 10 monthly sessions per cycle\n";
      response += "- **CE Credits:** 2 credits per session (20 total)\n";
      response += "- **Format:** In-person at our Duluth, GA facility\n";
      response += "- **Topics:** Literature reviews, case discussions, treatment planning\n\n";
      response += "The program is moderated by Dr. Carlos Castro and provides excellent opportunities for professional development and networking.\n\n";
      response += "Would you like to register or learn more about upcoming sessions?";
    }
    else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('fee')) {
      // Fetch ticket prices
      const { data: ticketTypes } = await supabase
        .from('ticket_types')
        .select(`
          name,
          price,
          events!inner(title)
        `)
        .eq('status', 'active')
        .order('price', { ascending: true })
        .limit(5);

      response = "Here's some pricing information:\n\n";
      response += "**Course Pricing:**\n";
      response += "- Early Bird tickets typically start at $1,299 - $1,499\n";
      response += "- Regular admission ranges from $1,599 - $1,999\n";
      response += "- VIP packages with additional benefits available\n\n";
      response += "**Monthly Seminars:**\n";
      response += "- $750 for the complete 10-session program\n\n";
      response += "Prices vary by course. Would you like pricing for a specific course?";
    }
    else if (lowerMessage.includes('credit') || lowerMessage.includes('ce ') || lowerMessage.includes('continuing education')) {
      response = "**About CE Credits at GPS Dental Training:**\n\n";
      response += "- All courses are **PACE-approved** (Academy of General Dentistry)\n";
      response += "- Credits range from 2-16 depending on the course\n";
      response += "- Monthly Seminars: 2 CE credits per session\n";
      response += "- Credits are awarded upon course completion and attendance verification\n";
      response += "- Certificates are issued with your name and credit hours\n\n";
      response += "Your CE credits are tracked in your account dashboard. Is there a specific course you'd like to know about?";
    }
    else if (lowerMessage.includes('available') || lowerMessage.includes('sold out') || lowerMessage.includes('spot') || lowerMessage.includes('seat')) {
      // Check availability
      const { data: ticketTypes } = await supabase
        .from('ticket_types')
        .select(`
          name,
          quantity,
          sold_count,
          manual_sold_out,
          events!inner(title, start_date)
        `)
        .eq('status', 'active')
        .limit(10);

      response = "I can check availability for any course. Here's the current status for upcoming events:\n\n";

      if (ticketTypes && ticketTypes.length > 0) {
        ticketTypes.forEach(ticket => {
          const available = ticket.quantity - (ticket.sold_count || 0);
          const status = ticket.manual_sold_out ? 'SOLD OUT' :
                        available <= 0 ? 'SOLD OUT' :
                        available <= 5 ? `Only ${available} spots left!` :
                        `${available} spots available`;
          response += `- **${(ticket.events as any).title}** (${ticket.name}): ${status}\n`;
        });
      }

      response += "\nWould you like me to check a specific course?";
    }
    else if (lowerMessage.includes('register') || lowerMessage.includes('enroll') || lowerMessage.includes('sign up') || lowerMessage.includes('book')) {
      response = "**How to Register:**\n\n";
      response += "1. Browse our courses at gpsdentaltraining.com/courses\n";
      response += "2. Select your desired course and ticket type\n";
      response += "3. Add to cart and proceed to checkout\n";
      response += "4. Complete payment via credit card\n";
      response += "5. Receive confirmation email with your ticket and QR code\n\n";
      response += "**Need Help?**\n";
      response += "- Email: gpsdentaltraining@gaprostho.com\n";
      response += "- Call our office during business hours\n\n";
      response += "Which course would you like to register for?";
    }
    else if (lowerMessage.includes('contact') || lowerMessage.includes('phone') || lowerMessage.includes('email') || lowerMessage.includes('address') || lowerMessage.includes('location')) {
      response = "**Contact GPS Dental Training:**\n\n";
      response += "📧 **Email:** gpsdentaltraining@gaprostho.com\n\n";
      response += "📍 **Address:**\n";
      response += "6320 Sugarloaf Parkway\n";
      response += "Duluth, GA 30097\n\n";
      response += "🌐 **Website:** gpsdentaltraining.com\n\n";
      response += "**Social Media:**\n";
      response += "- Facebook: /gpsdentaltraining\n";
      response += "- Instagram: @gpsdentaltraining\n";
      response += "- LinkedIn: GPS Dental Training\n\n";
      response += "How else can I help you?";
    }
    else if (lowerMessage.includes('prf') || lowerMessage.includes('choukroun') || lowerMessage.includes('platelet')) {
      response = "**PRF (Platelet-Rich Fibrin) Courses:**\n\n";
      response += "Our PRF courses are taught by **Dr. Joseph Choukroun**, the inventor of the PRF protocol!\n\n";
      response += "**What you'll learn:**\n";
      response += "- A-PRF and i-PRF protocols\n";
      response += "- Membrane and plug applications\n";
      response += "- \"Sticky bone\" technique\n";
      response += "- Clinical applications in implantology\n";
      response += "- Sinus lift procedures\n\n";
      response += "**Course Format:**\n";
      response += "- 2-day intensive workshop\n";
      response += "- Hands-on practice\n";
      response += "- Up to 16 CE credits\n\n";
      response += "Would you like to know when the next PRF course is scheduled?";
    }
    else if (lowerMessage.includes('thank')) {
      response = "You're welcome! I'm here to help anytime. Feel free to ask me about courses, seminars, CE credits, or anything else about GPS Dental Training. Have a great day! 😊";
    }
    else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      response = "Hello! Welcome to GPS Dental Training. I'm here to help you with:\n\n";
      response += "- 📚 Course information and schedules\n";
      response += "- 💰 Pricing and availability\n";
      response += "- 🎓 CE credit details\n";
      response += "- 📅 Monthly Seminars\n";
      response += "- 📝 Registration assistance\n\n";
      response += "What would you like to know?";
    }
    else {
      // Default response
      response = "I'm here to help you with information about GPS Dental Training courses and seminars. I can assist with:\n\n";
      response += "- **Upcoming courses** - schedules, locations, instructors\n";
      response += "- **Pricing** - ticket types and costs\n";
      response += "- **CE Credits** - how many credits per course\n";
      response += "- **Availability** - check if courses are sold out\n";
      response += "- **Monthly Seminars** - our 10-session program\n";
      response += "- **Registration** - how to enroll\n";
      response += "- **Contact info** - how to reach us\n\n";
      response += "What would you like to know more about?";
    }

    return new Response(JSON.stringify({
      success: true,
      response
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Chat assistant error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process message',
      response: "I apologize, but I'm having trouble processing your request. Please try again or contact us directly at gpsdentaltraining@gaprostho.com"
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
