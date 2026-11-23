import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Check,
  Download,
  Palette,
  Clock,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { formatMoney } from '../lib/utils';

export const LandingPage: React.FC = () => {
  // Interactive mini demo state
  const [demoClient, setDemoClient] = useState('Acme Studio');
  const [demoHours, setDemoHours] = useState(15);
  const [demoRate, setDemoRate] = useState(120);

  const demoTotal = demoHours * demoRate;

  const features = [
    {
      icon: Zap,
      title: 'Real-time Integer Math',
      description:
        'Stored as minor currency units with round_half_up precision. Eliminates floating-point rounding errors completely.',
    },
    {
      icon: Palette,
      title: 'Artisanal Templates',
      description:
        'Four handcrafted layouts: Classic, Modern, Minimal, and Bold. Tuned for readability and high typographic craft.',
    },
    {
      icon: ShieldCheck,
      title: 'Atomic Sequential Numbers',
      description:
        'Never duplicate an invoice number. Numbers like INV-0001 are guaranteed unique and incremented atomically on send.',
    },
    {
      icon: Clock,
      title: '30-Day Auto-Purge Trash',
      description:
        'Accidentally deleted an invoice? Restore it anytime within 30 days before automated background purges.',
    },
    {
      icon: Download,
      title: 'Headless Chromium PDFs',
      description:
        'Pixel-perfect vector PDF generation via serverless Puppeteer engines. Looks identical on paper and screen.',
    },
    {
      icon: Sparkles,
      title: 'Zero Bloat',
      description:
        'No clunky accounting suites or complex chart-of-accounts. Just pure, focused invoicing that gets you paid faster.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-brand-500 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-20 pb-16 sm:pt-28 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200/80 mb-8 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>Invoizmo v1.0 — Craft invoicing for modern creators</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-6">
          The invoice tool built for people who{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-500">
            care about design.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Create, customize, and download gorgeous client invoices in seconds. Clean typography,
          flawless calculations, and zero bloat.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/signup">
            <Button size="lg" variant="primary" icon={<ArrowRight className="w-4 h-4 ml-1" />}>
              Start Creating for Free
            </Button>
          </Link>
          <Link to="/templates">
            <Button size="lg" variant="secondary" icon={<FileText className="w-4 h-4" />}>
              Explore Templates
            </Button>
          </Link>
        </div>

        {/* Interactive Live Hero Widget */}
        <div className="mt-16 sm:mt-20 max-w-3xl mx-auto bg-white rounded-2xl shadow-elevated border border-slate-200/80 p-6 sm:p-8 text-left transition-all">
          <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Live Interactive Preview
              </div>
              <div className="text-base font-bold text-slate-900 mt-0.5">Try editing below:</div>
            </div>
            <div className="text-xs font-mono px-2.5 py-1 bg-slate-100 rounded-md text-slate-600">
              INV-0042
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
            <div>
              <label className="text-xs font-medium text-slate-500">Client Name</label>
              <input
                type="text"
                value={demoClient}
                onChange={(e) => setDemoClient(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Hours Billed</label>
              <input
                type="number"
                min="1"
                value={demoHours}
                onChange={(e) => setDemoHours(parseInt(e.target.value) || 0)}
                className="mt-1 w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Hourly Rate ($)</label>
              <input
                type="number"
                min="1"
                value={demoRate}
                onChange={(e) => setDemoRate(parseInt(e.target.value) || 0)}
                className="mt-1 w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white tabular-nums"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 flex items-center justify-between border border-slate-200/60">
            <div>
              <span className="text-xs text-slate-500 font-medium">Billed to: </span>
              <span className="text-sm font-semibold text-slate-800">{demoClient || 'Client'}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-medium block">Total Payable:</span>
              <span className="text-xl font-bold font-mono text-brand-600 tracking-tight">
                {formatMoney(demoTotal * 100, 'USD')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Engineered with meticulous craft
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Every detail built from first principles for fast, reliable, beautiful invoicing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:border-brand-200 hover:bg-white transition-all shadow-subtle group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-sm mb-5 group-hover:text-brand-600 group-hover:border-brand-200 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Simple, honest pricing
          </h2>
          <p className="mt-4 text-base text-slate-600">
            Start completely free. Upgrade to Pro when your studio grows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Free Plan */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Free Forever
              </div>
              <div className="text-4xl font-bold text-slate-900 mb-6">$0</div>
              <p className="text-sm text-slate-600 mb-8">
                Ideal for solo freelancers and newcomers starting their client journey.
              </p>
              <ul className="space-y-3.5 text-sm text-slate-600 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>5 new invoices per calendar month</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Classic & Modern templates</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Download vector PDFs</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>30-day trash auto-recovery</span>
                </li>
              </ul>
            </div>
            <Link to="/signup">
              <Button variant="secondary" className="w-full">
                Get Started Free
              </Button>
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="p-8 rounded-2xl bg-slate-900 text-white border border-slate-900 shadow-elevated flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-500 text-white">
              Recommended
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-wider text-brand-400 mb-2">
                Pro Studio
              </div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-bold text-white">$12</span>
                <span className="text-sm text-slate-400">/ month</span>
              </div>
              <p className="text-sm text-slate-300 mb-8">
                For active freelancers, agencies, and consultancies wanting zero limits.
              </p>
              <ul className="space-y-3.5 text-sm text-slate-300 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-brand-400 shrink-0" />
                  <span><strong>Unlimited</strong> invoices every month</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-brand-400 shrink-0" />
                  <span>All 4 templates (Minimal & Bold included)</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-brand-400 shrink-0" />
                  <span>Zero &ldquo;Made with Invoizmo&rdquo; watermark</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-brand-400 shrink-0" />
                  <span>Multi-currency & custom invoice prefixes</span>
                </li>
              </ul>
            </div>
            <Link to="/signup">
              <Button variant="primary" className="w-full bg-brand-600 hover:bg-brand-500 border-brand-600">
                Upgrade to Pro
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
