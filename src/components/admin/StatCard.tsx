interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: React.ReactNode;
  iconBgColor?: string;
  href?: string;
}

export default function StatCard({
  title,
  value,
  change,
  icon,
  iconBgColor = 'bg-blue-100',
  href,
}: StatCardProps) {
  const content = (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-semibold text-[#0C2044]">{value}</p>
          {change && (
            <div className="mt-2 flex items-center gap-1">
              {change.type === 'increase' ? (
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              <span className={`text-sm font-medium ${change.type === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                {change.value}%
              </span>
              <span className="text-sm text-gray-500">vs last month</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return <a href={href} className="block">{content}</a>;
  }

  return content;
}
