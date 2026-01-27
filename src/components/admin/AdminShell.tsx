import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

interface AdminShellProps {
  title: string;
  subtitle?: string;
  currentPath: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export default function AdminShell({
  title,
  subtitle,
  currentPath,
  user,
  actions,
  children,
}: AdminShellProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar currentPath={currentPath} />

      {/* Main content */}
      <div className="lg:pl-64">
        <AdminHeader
          title={title}
          subtitle={subtitle}
          user={user}
          actions={actions}
        />

        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
