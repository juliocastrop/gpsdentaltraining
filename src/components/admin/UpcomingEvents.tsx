interface Event {
  id: string;
  title: string;
  date: string;
  ticketsSold: number;
  capacity: number;
  type: 'course' | 'seminar';
}

interface UpcomingEventsProps {
  events: Event[];
  loading?: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getDaysUntil(dateStr: string): number {
  const eventDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  return Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function UpcomingEvents({ events, loading = false }: UpcomingEventsProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-[#0C2044] mb-4">Upcoming Events</h2>
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-[#0C2044] mb-4">Upcoming Events</h2>
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500">No upcoming events</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#0C2044]">Upcoming Events</h2>
        <a href="/admin/events" className="text-sm text-[#0B52AC] hover:underline">
          View all
        </a>
      </div>
      <div className="space-y-3">
        {events.map((event) => {
          const daysUntil = getDaysUntil(event.date);
          const occupancy = event.capacity > 0 ? Math.round((event.ticketsSold / event.capacity) * 100) : 0;
          const isSoldOut = event.capacity > 0 && event.ticketsSold >= event.capacity;

          return (
            <a
              key={event.id}
              href={`/admin/events/${event.id}`}
              className="block p-4 border border-gray-200 rounded-lg hover:border-[#0B52AC]/50 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${event.type === 'course' ? 'bg-[#0B52AC]' : 'bg-[#DDC89D]'}`} />
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      {event.type}
                    </span>
                  </div>
                  <h3 className="font-medium text-[#0C2044] truncate">{event.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{formatDate(event.date)}</p>
                </div>
                <div className="text-right">
                  {daysUntil === 0 ? (
                    <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                      Today
                    </span>
                  ) : daysUntil === 1 ? (
                    <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                      Tomorrow
                    </span>
                  ) : daysUntil <= 7 ? (
                    <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                      {daysUntil} days
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">{daysUntil} days</span>
                  )}
                </div>
              </div>
              {event.capacity > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">
                      {event.ticketsSold} / {event.capacity} tickets
                    </span>
                    {isSoldOut ? (
                      <span className="text-red-600 font-medium">Sold Out</span>
                    ) : (
                      <span className="text-gray-500">{occupancy}%</span>
                    )}
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isSoldOut ? 'bg-red-500' : occupancy >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(occupancy, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
