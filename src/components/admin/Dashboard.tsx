import AdminShell from './AdminShell';
import StatCard from './StatCard';
import QuickActions from './QuickActions';
import RecentActivity from './RecentActivity';
import UpcomingEvents from './UpcomingEvents';

interface DashboardStats {
  totalUsers: number;
  totalEvents: number;
  ticketsSold: number;
  totalRevenue: number;
  ceCreditsAwarded: number;
  waitlistCount: number;
  abandonedCarts: number;
  recoveredCarts: number;
}

interface DashboardProps {
  currentPath: string;
  user?: {
    name: string;
    email: string;
  };
  stats: DashboardStats;
  recentActivity: Array<{
    id: string;
    type: 'check_in' | 'certificate' | 'order' | 'waitlist' | 'registration';
    title: string;
    description: string;
    timestamp: string;
    user?: string;
  }>;
  upcomingEvents: Array<{
    id: string;
    title: string;
    date: string;
    ticketsSold: number;
    capacity: number;
    type: 'course' | 'seminar';
  }>;
  loading?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Dashboard({
  currentPath,
  user,
  stats,
  recentActivity,
  upcomingEvents,
  loading = false,
}: DashboardProps) {
  return (
    <AdminShell
      title="Dashboard"
      subtitle="Welcome back! Here's what's happening."
      currentPath={currentPath}
      user={user}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Events"
          value={stats.totalEvents}
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          iconBgColor="bg-blue-100"
          href="/admin/events"
        />
        <StatCard
          title="Tickets Sold"
          value={stats.ticketsSold}
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          }
          iconBgColor="bg-green-100"
          href="/admin/orders"
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBgColor="bg-purple-100"
          href="/admin/reports"
        />
        <StatCard
          title="CE Credits"
          value={stats.ceCreditsAwarded}
          icon={
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
          iconBgColor="bg-yellow-100"
          href="/admin/credits"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          iconBgColor="bg-indigo-100"
        />
        <StatCard
          title="Waitlist"
          value={stats.waitlistCount}
          icon={
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          iconBgColor="bg-orange-100"
          href="/admin/waitlist"
        />
        <StatCard
          title="Abandoned Carts"
          value={stats.abandonedCarts}
          icon={
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          iconBgColor="bg-red-100"
          href="/admin/cart-recovery"
        />
        <StatCard
          title="Recovered Carts"
          value={stats.recoveredCarts}
          icon={
            <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBgColor="bg-teal-100"
          href="/admin/cart-recovery"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <QuickActions />
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        <UpcomingEvents events={upcomingEvents} loading={loading} />
        <RecentActivity activities={recentActivity} loading={loading} />
      </div>
    </AdminShell>
  );
}
