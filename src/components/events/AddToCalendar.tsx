import { useState } from 'react';

interface AddToCalendarProps {
  title: string;
  description?: string;
  location?: string;
  startDate: string;  // ISO date string (YYYY-MM-DD or full ISO)
  endDate?: string;    // ISO date string
  startTime?: string;  // HH:MM format
  endTime?: string;    // HH:MM format
  url?: string;        // Event URL
  className?: string;
  variant?: 'button' | 'link' | 'icon';
}

type CalendarService = 'google' | 'yahoo' | 'outlook' | 'outlookcom' | 'apple';

interface ServiceInfo {
  label: string;
  icon: JSX.Element;
}

function formatDateForCalendar(dateStr: string, timeStr?: string): string {
  if (!dateStr) return '';
  const datePart = dateStr.split('T')[0].replace(/-/g, '');
  if (timeStr) {
    const timePart = timeStr.replace(/:/g, '').substring(0, 4) + '00';
    return `${datePart}T${timePart}`;
  }
  return datePart;
}

function formatDateForOutlook(dateStr: string, timeStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (timeStr) {
    const [hours, minutes] = timeStr.split(':');
    date.setHours(parseInt(hours), parseInt(minutes), 0);
  }
  return date.toISOString().replace(/[-:]/g, '').split('.')[0];
}

function generateICS(props: AddToCalendarProps): string {
  const start = formatDateForCalendar(props.startDate, props.startTime);
  const end = props.endDate
    ? formatDateForCalendar(props.endDate, props.endTime)
    : formatDateForCalendar(props.startDate, props.endTime);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GPS Dental Training//Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${start}`,
    `DTEND:${end || start}`,
    `SUMMARY:${props.title}`,
  ];

  if (props.description) {
    lines.push(`DESCRIPTION:${props.description.replace(/\n/g, '\\n')}`);
  }
  if (props.location) {
    lines.push(`LOCATION:${props.location}`);
  }
  if (props.url) {
    lines.push(`URL:${props.url}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
}

function generateCalendarUrl(service: CalendarService, props: AddToCalendarProps): string {
  const start = formatDateForCalendar(props.startDate, props.startTime);
  const end = props.endDate
    ? formatDateForCalendar(props.endDate, props.endTime)
    : formatDateForCalendar(props.startDate, props.endTime);
  const desc = props.description || '';
  const loc = props.location || '';

  switch (service) {
    case 'google': {
      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: props.title,
        dates: `${start}/${end || start}`,
        details: desc,
        location: loc,
      });
      if (props.url) params.set('sprop', `website:${props.url}`);
      return `https://calendar.google.com/calendar/render?${params.toString()}`;
    }

    case 'yahoo': {
      const params = new URLSearchParams({
        v: '60',
        title: props.title,
        st: start,
        et: end || start,
        desc: desc,
        in_loc: loc,
      });
      return `https://calendar.yahoo.com/?${params.toString()}`;
    }

    case 'outlookcom': {
      const outStart = formatDateForOutlook(props.startDate, props.startTime);
      const outEnd = props.endDate
        ? formatDateForOutlook(props.endDate, props.endTime)
        : formatDateForOutlook(props.startDate, props.endTime);
      const params = new URLSearchParams({
        path: '/calendar/action/compose',
        rru: 'addevent',
        subject: props.title,
        startdt: outStart,
        enddt: outEnd || outStart,
        body: desc,
        location: loc,
      });
      return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
    }

    default:
      return '';
  }
}

const serviceInfo: Record<CalendarService, ServiceInfo> = {
  google: {
    label: 'Google Calendar',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.628 0 12 0zm6.28 17.68h-3.36v-1.2h1.08V11.2h-1.08v-.96h2.28v6.24h1.08v1.2zm-4.56 0H7.72v-1.2h1.08v-5.28H7.72v-.96h2.28v6.24h.96v.48h.48v.72h2.28v.0zm-4.56-8.16c-.66 0-1.2-.54-1.2-1.2s.54-1.2 1.2-1.2 1.2.54 1.2 1.2-.54 1.2-1.2 1.2z"/>
      </svg>
    ),
  },
  yahoo: {
    label: 'Yahoo Calendar',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.4 17.2h-2.4l-2-4-2 4H7.6l3.2-6.4L8.4 6h2.4l1.6 3.2L14 6h2.4l-2.4 4.8 2.4 6.4z"/>
      </svg>
    ),
  },
  outlook: {
    label: 'Outlook (ICS)',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.35.2-.84.2-.45 0-.82-.2-.35-.18-.58-.52-.22-.33-.33-.74-.1-.42-.1-.87t.1-.87q.1-.43.33-.76.22-.33.58-.52.37-.2.82-.2.49 0 .84.2.36.19.58.52.23.33.33.76.11.42.11.87zm-1.98 0q0-.39-.04-.7-.04-.31-.13-.55-.09-.24-.24-.37-.15-.14-.38-.14t-.38.14q-.15.13-.24.37-.09.24-.13.55-.04.31-.04.7 0 .39.04.7.04.31.13.54.09.24.24.38.15.14.38.14t.38-.14q.15-.14.24-.38.09-.23.13-.54.04-.31.04-.7zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H8.21q0-.01 0 0H2.53q-.41 0-.72-.3-.3-.3-.3-.72V3.42q0-.41.3-.72.3-.3.72-.3h4.79v-.02h15.04q.47 0 .8.33.33.34.33.8v3.3L24 12zm-6 0l4.7-3.3H18v3.3zM7.5 3.5h-4v16h4v-16zm1.5 7.3V6.5h13V4H9v6.8h.01z"/>
      </svg>
    ),
  },
  outlookcom: {
    label: 'Outlook.com',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.35.2-.84.2-.45 0-.82-.2-.35-.18-.58-.52-.22-.33-.33-.74-.1-.42-.1-.87t.1-.87q.1-.43.33-.76.22-.33.58-.52.37-.2.82-.2.49 0 .84.2.36.19.58.52.23.33.33.76.11.42.11.87zm16.17 0l-4.43 3.1V8.93l4.43 3.11zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H8.21q0-.01 0 0H2.53q-.41 0-.72-.3-.3-.3-.3-.72V3.42q0-.41.3-.72.3-.3.72-.3h4.79v-.02h15.04q.47 0 .8.33.33.34.33.8V12z"/>
      </svg>
    ),
  },
  apple: {
    label: 'Apple Calendar',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
  },
};

export default function AddToCalendar({
  title,
  description,
  location,
  startDate,
  endDate,
  startTime,
  endTime,
  url,
  className = '',
  variant = 'button',
}: AddToCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleServiceClick = (service: CalendarService) => {
    if (service === 'outlook' || service === 'apple') {
      // Download ICS file
      const ics = generateICS({ title, description, location, startDate, endDate, startTime, endTime, url });
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const calUrl = generateCalendarUrl(service, { title, description, location, startDate, endDate, startTime, endTime, url });
      if (calUrl) window.open(calUrl, '_blank', 'noopener,noreferrer');
    }
    setIsOpen(false);
  };

  const services: CalendarService[] = ['google', 'outlook', 'outlookcom', 'yahoo', 'apple'];

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      {variant === 'button' && (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 bg-[#0B52AC] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#0C2044] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Add to Calendar
        </button>
      )}

      {variant === 'link' && (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 text-[#0B52AC] text-sm font-semibold hover:text-[#0C2044] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Add to Calendar
        </button>
      )}

      {variant === 'icon' && (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30 transition-colors"
          title="Add to Calendar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      )}

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-[#0C2044]">Add to Your Calendar</h3>
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{title}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Calendar Options */}
            <div className="p-4 space-y-2">
              {services.map((service) => (
                <button
                  key={service}
                  onClick={() => handleServiceClick(service)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-[#0C2044] hover:bg-[#F0F4FF] transition-colors group"
                >
                  <span className="text-[#0B52AC] group-hover:text-[#0C2044] transition-colors">
                    {serviceInfo[service].icon}
                  </span>
                  <span className="font-medium text-sm">{serviceInfo[service].label}</span>
                  <svg className="w-4 h-4 ml-auto text-gray-300 group-hover:text-[#0B52AC] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
