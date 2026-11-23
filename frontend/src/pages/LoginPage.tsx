import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await login(email, password);
      success('Welcome back!');
      navigate('/invoices');
    } catch (err: any) {
      const message =
        err.response?.data?.error?.message ||
        'Failed to sign in. Please check your credentials.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 group mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm group-hover:bg-brand-600 transition-colors">
            <FileText className="w-5 h-5" />
          </div>
          <span className="font-semibold text-xl tracking-tight text-slate-900">
            Invoizmo<span className="text-brand-600">.</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to your account</h2>
        <p className="mt-2 text-sm text-slate-500">
          Or{' '}
          <Link to="/signup" className="font-medium text-brand-600 hover:text-brand-500">
            create a new account for free
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-elevated border border-slate-200/80">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-slate-900"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-brand-600 hover:text-brand-500"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-slate-900"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full py-2.5 font-medium shadow-sm"
              icon={<ArrowRight className="w-4 h-4 ml-1" />}
            >
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
