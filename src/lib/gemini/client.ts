import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
const apiKey = import.meta.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('GEMINI_API_KEY not found. AI features will be limited.');
}

export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Model configurations
export const MODELS = {
  // Use Gemini 2.0 Flash for fast responses
  FLASH: 'gemini-2.0-flash',
  // Use Gemini 1.5 Pro for complex reasoning
  PRO: 'gemini-1.5-pro',
} as const;

// System prompt for GPS Dental Training assistant
export const GPS_SYSTEM_PROMPT = `You are the GPS Dental Training AI Assistant - a helpful, knowledgeable guide for dental professionals interested in continuing education.

## Your Role
- Help users find the right courses for their professional development
- Answer questions about course content, schedules, CE credits, and pricing
- Provide information about monthly seminars, speakers, and facilities
- Assist with registration and enrollment inquiries
- Be professional yet friendly, reflecting GPS's commitment to excellence

## Key Information About GPS Dental Training
- Location: 6320 Sugarloaf Parkway, Duluth, GA 30097
- Email: gpsdentaltraining@gaprostho.com
- All courses are PACE-approved (Academy of General Dentistry)
- Specializes in implant dentistry, PRF protocols, and digital workflows

## Monthly Seminars Program
- 10-session program at $750 total
- 2 CE credits per session (20 total)
- Led by Dr. Carlos Castro
- One makeup session allowed per calendar year
- Bi-annual certificates issued (June 30 and December 31)

## Response Guidelines
- Keep responses concise but informative (2-4 paragraphs max)
- Always mention specific CE credit amounts when discussing courses
- Encourage users to visit the website or contact for registration
- If you don't have specific information, recommend contacting GPS directly
- Use markdown formatting for better readability
- Be enthusiastic about dental education while remaining professional

## Important
- Never make up course dates, prices, or availability - always defer to the database information provided
- If the context doesn't contain the answer, say so and suggest contacting GPS
- Always prioritize accuracy over completeness`;

// Types for the assistant
export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface CourseContext {
  id: string;
  title: string;
  slug: string;
  description?: string;
  startDate: string;
  endDate?: string;
  venue?: string;
  ceCredits: number;
  ticketTypes?: {
    name: string;
    price: number;
    available: number;
    soldOut: boolean;
  }[];
}

export interface SeminarContext {
  id: string;
  title: string;
  year: number;
  price: number;
  totalSessions: number;
  upcomingSessions?: {
    sessionNumber: number;
    date: string;
    topic?: string;
  }[];
}

// Build context from database data
export function buildContextPrompt(
  courses: CourseContext[],
  seminars: SeminarContext[],
  userQuestion: string
): string {
  let context = '## Current Course & Seminar Data\n\n';

  if (courses.length > 0) {
    context += '### Upcoming Courses\n';
    courses.forEach((course, i) => {
      const startDate = new Date(course.startDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      context += `\n**${i + 1}. ${course.title}**\n`;
      context += `- Date: ${startDate}${course.endDate ? ` - ${new Date(course.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}` : ''}\n`;
      context += `- Location: ${course.venue || 'GPS Training Center, Duluth, GA'}\n`;
      context += `- CE Credits: ${course.ceCredits}\n`;
      if (course.description) {
        context += `- Description: ${course.description.substring(0, 200)}...\n`;
      }
      if (course.ticketTypes && course.ticketTypes.length > 0) {
        context += `- Tickets:\n`;
        course.ticketTypes.forEach(ticket => {
          const status = ticket.soldOut ? 'SOLD OUT' :
                        ticket.available <= 5 ? `Only ${ticket.available} left!` :
                        `${ticket.available} available`;
          context += `  - ${ticket.name}: $${ticket.price} (${status})\n`;
        });
      }
    });
  }

  if (seminars.length > 0) {
    context += '\n### Monthly Seminars\n';
    seminars.forEach(seminar => {
      context += `\n**${seminar.title} (${seminar.year})**\n`;
      context += `- Price: $${seminar.price} for ${seminar.totalSessions} sessions\n`;
      context += `- CE Credits: 2 per session (${seminar.totalSessions * 2} total)\n`;
      if (seminar.upcomingSessions && seminar.upcomingSessions.length > 0) {
        context += `- Upcoming Sessions:\n`;
        seminar.upcomingSessions.slice(0, 3).forEach(session => {
          context += `  - Session ${session.sessionNumber}: ${new Date(session.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}${session.topic ? ` - ${session.topic}` : ''}\n`;
        });
      }
    });
  }

  context += `\n---\n\n## User Question\n${userQuestion}`;

  return context;
}
