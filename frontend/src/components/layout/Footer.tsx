import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white">
              <FileText className="w-4 h-4" />
            </div>
            <span className="font-semibold text-slate-900 tracking-tight">Invoizmo</span>
            <span className="text-xs text-slate-400 ml-2">
              © {new Date().getFullYear()} Invoizmo Inc. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link to="/templates" className="hover:text-slate-900 transition-colors">
              Templates
            </Link>
            <Link to="/contact" className="hover:text-slate-900 transition-colors">
              Support
            </Link>
            <Link to="/#pricing" className="hover:text-slate-900 transition-colors">
              Pricing
            </Link>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for freelancers & modern studios
          </div>
        </div>
      </div>
    </footer>
  );
};
