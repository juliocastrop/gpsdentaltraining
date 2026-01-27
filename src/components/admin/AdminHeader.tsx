import { useState } from 'react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  actions?: React.ReactNode;
}

export default function AdminHeader({ title, subtitle, user, actions }: AdminHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8">
        {/* Title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-[#0C2044] truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-500 truncate">{subtitle}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {actions}

          {/* Notifications */}
          <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {/* Notification dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-[#0B52AC] rounded-full flex items-center justify-center text-white font-medium text-sm">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-[#0C2044]">{user?.name || 'Admin User'}</p>
                    <p className="text-xs text-gray-500">{user?.email || 'admin@gpsdentaltraining.com'}</p>
                  </div>
                  <a
                    href="/admin/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Settings
                  </a>
                  <a
                    href="/api/auth/sign-out"
                    className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
