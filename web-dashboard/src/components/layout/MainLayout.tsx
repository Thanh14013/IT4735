import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Bell, Settings, LogOut, LucideIcon, Activity } from 'lucide-react';
import clsx from 'clsx';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  to: string;
  active: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, to, active }) => (
  <Link
    to={to}
    className={clsx(
      'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
      active
        ? 'bg-blue-50 text-blue-600'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

const MainLayout = () => {
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <LayoutDashboard />
            AirMonitor
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard"
            to="/"
            active={location.pathname === '/'}
          />
          <SidebarItem
            icon={Bell}
            label="Alerts"
            to="/alerts"
            active={location.pathname === '/alerts'}
          />
          <SidebarItem
            icon={Activity}
            label="Simulation"
            to="/simulation"
            active={location.pathname === '/simulation'}
          />
          <SidebarItem
            icon={Settings}
            label="Settings"
            to="/settings"
            active={location.pathname === '/settings'}
          />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              {location.pathname === '/' ? 'Dashboard Overview' : 
               location.pathname === '/alerts' ? 'Alerts' : 
               location.pathname.startsWith('/stations') ? 'Station Details' : 'Page'}
            </h2>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                Welcome, User
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                U
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
