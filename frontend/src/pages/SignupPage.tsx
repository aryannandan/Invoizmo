import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await signup(name, email, password);
      setIsSuccess(true);
    } catch (err: any) {
      const message =
        err.response?.data?.error?.message ||
        'Failed to create account. Please check your inputs.';
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
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h2>
        <p className="mt-2 text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-elevated border border-slate-200/80">
          {isSuccess ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Check your email</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                We sent a verification link to{' '}
                <strong className="text-slate-900">{email}</strong>. Click the link in the email to
                verify your account and get started.
              </p>
              <Link to="/login">
                <Button variant="secondary" className="w-full">
                  Return to Sign in
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 text-sm font-medium">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Name or Studio
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Asha Rao"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-slate-900"
                  />
                </div>

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
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters (letters + numbers)"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-slate-900"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  className="w-full py-2.5 font-medium shadow-sm"
                >
                  Create Free Account
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
