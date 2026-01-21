import { useState, useEffect, useCallback } from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  slug: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  ceCredits?: number;
  type: 'course' | 'seminar-session';
  url: string;
}

interface EventCalendarProps {
  initialEvents?: CalendarEvent[];
  showSidebar?: boolean;
  eventTypeFilter?: 'all' | 'courses' | 'seminars';
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function EventCalendar({
  initialEvents = [],
  showSidebar = true,
  eventTypeFilter = 'all',
}: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [loading, setLoading] = useState(false);

  // Fetch events for current month
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const response = await fetch(`/api/events/calendar?year=${year}&month=${month}&type=${eventTypeFilter}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
    } finally {
      setLoading(false);
    }
  }, [currentDate, eventTypeFilter]);

  useEffect(() => {
    if (initialEvents.length === 0) {
      fetchEvents();
    }
  }, [fetchEvents, initialEvents.length]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = formatDate(date);
    return events.filter(event => {
      if (event.startDate === dateStr) return true;
      if (event.endDate && event.endDate !== event.startDate) {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        return date >= eventStart && date <= eventEnd;
      }
      return false;
    });
  };

  const getEventsForMonth = (): CalendarEvent[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;
      return eventStart <= lastDay && eventEnd >= firstDay;
    }).sort((a, b) => a.startDate.localeCompare(b.startDate));
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];

    // Previous month days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      days.push(
        <div key={`prev-${day}`} className="calendar-day other-month">
          <span className="day-number">{day}</span>
        </div>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = getEventsForDate(date);
      const isToday = date.getTime() === today.getTime();
      const isSelected = selectedDate && date.getTime() === selectedDate.getTime();

      days.push(
        <div
          key={day}
          className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayEvents.length > 0 ? 'has-events' : ''}`}
          onClick={() => setSelectedDate(date)}
        >
          <span className="day-number">{day}</span>
          {dayEvents.length > 0 && (
            <div className="day-events">
              {dayEvents.slice(0, 2).map(event => (
                <div
                  key={event.id}
                  className={`calendar-event ${event.type}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = event.url;
                  }}
                >
                  <span className="event-title">{event.title.length > 20 ? event.title.substring(0, 20) + '...' : event.title}</span>
                </div>
              ))}
              {dayEvents.length > 2 && (
                <div className="more-events">+{dayEvents.length - 2} more</div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(
        <div key={`next-${i}`} className="calendar-day other-month">
          <span className="day-number">{i}</span>
        </div>
      );
    }

    return days;
  };

  const formatEventDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const sidebarEvents = selectedDate ? getEventsForDate(selectedDate) : getEventsForMonth();
  const sidebarTitle = selectedDate
    ? `Events for ${selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
    : `Upcoming Events - ${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  return (
    <section className="section">
      <div className="container-wide">
        <div className="calendar-wrapper">
          {/* Calendar Header */}
          <div className="calendar-header">
            <div className="calendar-navigation">
              <button
                onClick={goToPreviousMonth}
                className="nav-btn"
                aria-label="Previous month"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="calendar-title">
                <select
                  value={currentDate.getMonth()}
                  onChange={(e) => setCurrentDate(new Date(currentDate.getFullYear(), parseInt(e.target.value), 1))}
                  className="month-selector"
                >
                  {MONTH_NAMES.map((name, index) => (
                    <option key={name} value={index}>{name}</option>
                  ))}
                </select>
                <select
                  value={currentDate.getFullYear()}
                  onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), currentDate.getMonth(), 1))}
                  className="year-selector"
                >
                  {Array.from({ length: 8 }, (_, i) => currentDate.getFullYear() - 2 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={goToNextMonth}
                className="nav-btn"
                aria-label="Next month"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button onClick={goToToday} className="today-btn">
                Today
              </button>
            </div>
          </div>

          <div className="calendar-content">
            {/* Calendar Grid */}
            <div className="calendar-body">
              {loading && (
                <div className="calendar-loading">
                  <div className="spinner" />
                </div>
              )}

              <div className="calendar-grid">
                {/* Day Headers */}
                {DAY_NAMES.map(day => (
                  <div key={day} className="calendar-day-header">{day}</div>
                ))}

                {/* Days */}
                {renderCalendarDays()}
              </div>
            </div>

            {/* Sidebar */}
            {showSidebar && (
              <div className="calendar-sidebar">
                <div className="sidebar-header">
                  <h3 className="sidebar-title">{selectedDate ? 'Events for' : 'Upcoming Events'}</h3>
                  <p className="selected-date">
                    {selectedDate
                      ? selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                      : `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                    }
                  </p>
                </div>

                <div className="sidebar-content">
                  {sidebarEvents.length === 0 ? (
                    <p className="no-events">No events scheduled.</p>
                  ) : (
                    sidebarEvents.map(event => (
                      <div key={event.id} className={`sidebar-event ${event.type}`}>
                        <h4 className="sidebar-event-title">
                          <a href={event.url}>{event.title}</a>
                        </h4>
                        <div className="sidebar-event-meta">
                          {!selectedDate && (
                            <div className="meta-item">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{formatEventDate(event.startDate)}</span>
                            </div>
                          )}
                          {event.startTime && (
                            <div className="meta-item">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}</span>
                            </div>
                          )}
                          {event.venue && (
                            <div className="meta-item">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{event.venue}</span>
                            </div>
                          )}
                          {event.ceCredits && event.ceCredits > 0 && (
                            <div className="meta-item">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                              </svg>
                              <span>{event.ceCredits} CE Credits</span>
                            </div>
                          )}
                        </div>
                        <a href={event.url} className="sidebar-event-link">
                          {event.type === 'seminar-session' ? 'Register for Seminars' : 'View Details'}
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .calendar-wrapper {
          position: relative;
          width: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .calendar-header {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 20px;
        }

        .calendar-navigation {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
        }

        .calendar-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .month-selector,
        .year-selector {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }

        .month-selector {
          min-width: 140px;
        }

        .year-selector {
          min-width: 90px;
        }

        .nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .nav-btn:hover {
          background: #f5f5f5;
          border-color: #173D84;
          color: #173D84;
        }

        .today-btn {
          padding: 8px 20px;
          background: #173D84;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .today-btn:hover {
          background: #13326A;
        }

        .calendar-content {
          display: flex;
          gap: 24px;
        }

        .calendar-body {
          flex: 1;
          position: relative;
        }

        .calendar-loading {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          border-radius: 8px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #173D84;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          background: white;
        }

        .calendar-day-header {
          padding: 12px;
          text-align: center;
          font-weight: 600;
          font-size: 14px;
          text-transform: uppercase;
          background: #f9fafb;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
        }

        .calendar-day {
          min-height: 100px;
          padding: 8px;
          border: 1px solid #e5e7eb;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .calendar-day:hover {
          background: #f9fafb;
        }

        .calendar-day.other-month {
          background: #fafafa;
        }

        .calendar-day.other-month .day-number {
          color: #9ca3af;
        }

        .calendar-day.today .day-number {
          background: #173D84;
          color: white;
          border-radius: 50%;
        }

        .calendar-day.selected {
          background: #e0f2ff;
          border-color: #173D84;
        }

        .day-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .day-events {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .calendar-event {
          padding: 2px 6px;
          font-size: 11px;
          border-radius: 4px;
          cursor: pointer;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .calendar-event.course {
          background: #0B52AC;
          color: white;
        }

        .calendar-event.course:hover {
          background: #094291;
        }

        .calendar-event.seminar-session {
          background: #DDC89D;
          color: #13326A;
        }

        .calendar-event.seminar-session:hover {
          background: #d4bc8a;
        }

        .more-events {
          font-size: 11px;
          color: #173D84;
          font-weight: 600;
          cursor: pointer;
          padding: 2px 0;
        }

        .more-events:hover {
          text-decoration: underline;
        }

        /* Sidebar Styles */
        .calendar-sidebar {
          flex-shrink: 0;
          width: 350px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          padding: 24px;
          max-height: 700px;
          overflow-y: auto;
        }

        .sidebar-header {
          padding-bottom: 16px;
          border-bottom: 2px solid #e5e7eb;
          margin-bottom: 16px;
        }

        .sidebar-title {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
        }

        .selected-date {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #111827;
        }

        .sidebar-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .no-events {
          text-align: center;
          padding: 40px 20px;
          color: #9ca3af;
          font-style: italic;
        }

        .sidebar-event {
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .sidebar-event:hover {
          border-color: #173D84;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .sidebar-event.course {
          border-left: 4px solid #0B52AC;
        }

        .sidebar-event.seminar-session {
          border-left: 4px solid #DDC89D;
        }

        .sidebar-event-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #111827;
        }

        .sidebar-event-title a {
          color: inherit;
          text-decoration: none;
        }

        .sidebar-event-title a:hover {
          color: #173D84;
        }

        .sidebar-event-meta {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 12px;
          font-size: 13px;
          color: #6b7280;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .meta-item svg {
          flex-shrink: 0;
          color: #173D84;
        }

        .sidebar-event-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #173D84;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .sidebar-event-link:hover {
          background: #13326A;
        }

        .sidebar-event.seminar-session .sidebar-event-link {
          background: #13326A;
        }

        .sidebar-event.seminar-session .sidebar-event-link:hover {
          background: #0d2347;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .calendar-sidebar {
            width: 280px;
          }
        }

        @media (max-width: 768px) {
          .calendar-content {
            flex-direction: column;
          }

          .calendar-sidebar {
            width: 100%;
            max-height: 400px;
          }

          .calendar-day {
            min-height: 70px;
            padding: 4px;
          }

          .day-number {
            width: 24px;
            height: 24px;
            font-size: 12px;
          }

          .calendar-event {
            font-size: 10px;
            padding: 2px 4px;
          }

          .calendar-navigation {
            gap: 10px;
            flex-wrap: wrap;
          }

          .month-selector,
          .year-selector {
            font-size: 14px;
            padding: 6px 10px;
          }
        }
      `}</style>
    </section>
  );
}
