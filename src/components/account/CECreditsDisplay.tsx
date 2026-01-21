import { useState, useEffect } from 'react';

interface CreditEntry {
  id: string;
  credits: number;
  source: string;
  transactionType: string;
  eventTitle: string | null;
  eventDate: string | null;
  notes: string | null;
  awardedAt: string;
}

interface CECreditsDisplayProps {
  userId: string;
  showLedger?: boolean;
}

export default function CECreditsDisplay({ userId, showLedger = true }: CECreditsDisplayProps) {
  const [totalCredits, setTotalCredits] = useState<number>(0);
  const [ledger, setLedger] = useState<CreditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCredits();
  }, [userId]);

  async function fetchCredits() {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/user/credits?userId=${userId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch credits');
      }

      setTotalCredits(data.totalCredits);
      setLedger(data.ledger);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function getSourceLabel(source: string): string {
    const labels: Record<string, string> = {
      course_attendance: 'Course Attendance',
      seminar_session: 'Seminar Session',
      manual: 'Manual Adjustment',
    };
    return labels[source] || source;
  }

  function getTransactionIcon(type: string) {
    if (type === 'earned') {
      return (
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      );
    }
    if (type === 'revoked') {
      return (
        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="bg-gray-200 rounded-xl h-32 mb-6"></div>
        {showLedger && (
          <>
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert-error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Total Credits Card */}
      <div className="bg-gradient-to-br from-gps-navy to-gps-navy-dark rounded-xl p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm mb-1">Total CE Credits</p>
            <p className="text-4xl font-bold">{totalCredits.toFixed(1)}</p>
          </div>
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gps-gold" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
              <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
            </svg>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-white/70 text-sm">
            Credits earned from course attendance and seminar sessions
          </p>
        </div>
      </div>

      {/* Credit Ledger */}
      {showLedger && (
        <div>
          <h3 className="text-lg font-semibold text-gps-navy-dark mb-4">Credit History</h3>

          {ledger.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>No credit history yet</p>
              <p className="text-sm">Attend courses to earn CE credits</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ledger.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200"
                >
                  {getTransactionIcon(entry.transactionType)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gps-navy-dark truncate">
                      {entry.eventTitle || getSourceLabel(entry.source)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(entry.awardedAt)}
                      {entry.notes && ` • ${entry.notes}`}
                    </p>
                  </div>
                  <div className={`text-lg font-bold ${
                    entry.transactionType === 'revoked'
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}>
                    {entry.transactionType === 'revoked' ? '-' : '+'}
                    {entry.credits}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
