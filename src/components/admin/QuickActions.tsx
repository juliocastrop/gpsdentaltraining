interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  iconBgColor: string;
}

const defaultActions: QuickAction[] = [
  {
    title: 'Check-in Attendees',
    description: 'Scan QR codes or search attendees',
    href: '/admin/attendance',
    icon: (
      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    ),
    iconBgColor: 'bg-blue-100',
  },
  {
    title: 'Generate Certificates',
    description: 'Create and send CE certificates',
    href: '/admin/certificates',
    icon: (
      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    iconBgColor: 'bg-green-100',
  },
  {
    title: 'Manage Waitlist',
    description: 'Notify users of available spots',
    href: '/admin/waitlist',
    icon: (
      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    iconBgColor: 'bg-yellow-100',
  },
  {
    title: 'View Reports',
    description: 'Analyze attendance and revenue',
    href: '/admin/reports',
    icon: (
      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    iconBgColor: 'bg-purple-100',
  },
];

interface QuickActionsProps {
  actions?: QuickAction[];
}

export default function QuickActions({ actions = defaultActions }: QuickActionsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-[#0C2044] mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => (
          <a
            key={action.href}
            href={action.href}
            className="p-4 rounded-xl border border-gray-200 hover:border-[#0B52AC]/50 hover:shadow-md transition-all group"
          >
            <div className={`w-12 h-12 ${action.iconBgColor} rounded-xl flex items-center justify-center mb-3`}>
              {action.icon}
            </div>
            <h3 className="font-medium text-[#0C2044] group-hover:text-[#0B52AC] transition-colors">
              {action.title}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{action.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
