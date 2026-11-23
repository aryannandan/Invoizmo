import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Trash2,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Invoices', href: '/invoices', icon: FileText },
    { label: 'Trash', href: '/trash', icon: Trash2 },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top App Header */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-8">
            <Link to="/invoices" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm">
                <FileText className="w-4 h-4" />
              </div>
              <span className="font-semibold text-base tracking-tight text-slate-900">
                Invoizmo<span className="text-brand-600">.</span>
              </span>
            </Link>

            <nav className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            <Link to="/invoices/new">
              <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
                New Invoice
              </Button>
            </Link>

            {/* User pill & plan badge */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-slate-900 leading-none">
                  {user?.name || user?.email}
                </div>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase tracking-wider ${
                      user?.plan === 'pro'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {user?.plan === 'pro' ? (
                      <>
                        <Sparkles className="w-2.5 h-2.5 mr-0.5" /> PRO
                      </>
                    ) : (
                      'FREE'
                    )}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Sign out"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
