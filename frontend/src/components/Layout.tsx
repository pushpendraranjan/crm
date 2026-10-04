import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Users, LogOut, Building2, CircleUserRound } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/leads', icon: Users, label: 'Leads' },
    ...(user?.role === 'ADMIN' ? [{ to: '/account', icon: CircleUserRound, label: 'Account' }] : []),
  ];

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50">
      <header className="sticky top-0 z-40 w-full bg-blue-900 text-white shadow-sm">
        <div className="flex min-h-16 w-full flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6 lg:flex-nowrap">
          <div className="flex shrink-0 items-center gap-3">
            <Building2 className="h-7 w-7 text-blue-300" />
            <div>
              <h1 className="font-bold leading-tight">CRM System</h1>
              <p className="hidden text-xs text-blue-300 sm:block">Lead Management</p>
            </div>
          </div>

          <nav aria-label="Main navigation" className="order-3 flex w-full items-center gap-1 overflow-x-auto lg:order-none lg:w-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-sm font-bold">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="max-w-36 overflow-hidden">
                <p className="truncate text-sm font-medium">{user?.name}</p>
                <p className="truncate text-xs text-blue-300">{user?.role}</p>
              </div>
            </div>
            <span className="rounded-full bg-blue-800 px-2.5 py-1 text-xs font-medium text-blue-100 sm:hidden">
              {user?.role}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-blue-100 transition-colors hover:bg-blue-800 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>
      <main className="w-full flex-1 p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
