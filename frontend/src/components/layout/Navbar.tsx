import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const links = [
    { label: 'Features', href: '/#features' },
    { label: 'Templates', href: '/templates' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm group-hover:bg-brand-600 transition-colors">
            <FileText className="w-5 h-5" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-slate-900">
            Invoizmo<span className="text-brand-600">.</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className={`text-sm font-medium transition-colors ${
                location.pathname === link.href
                  ? 'text-brand-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/invoices">
              <Button variant="primary" size="sm">
                Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary" size="sm">
                  Get Started Free
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
