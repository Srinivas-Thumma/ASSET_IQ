import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Shield,
  Activity,
  QrCode,
  ArrowRight,
  Cpu,
  MessageSquare,
  RefreshCw,
  Bell,
  UserPlus,
  Link as LinkIcon,
  Archive,
  Laptop,
  BarChart3,
  Star,
  Quote
} from 'lucide-react';
import Button from '../../components/ui/Button.jsx';

export const LandingPage = () => {
  const navigate = useNavigate();

  // Animated stats counters
  const [orgCount, setOrgCount] = useState(0);
  const [assetCount, setAssetCount] = useState(0);
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 30;
    const intervalTime = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setOrgCount(Math.round(progress * 500));
      setAssetCount(Math.round(progress * 50));
      setUptime(Number((progress * 99.9).toFixed(1)));

      if (step >= steps) {
        clearInterval(timer);
        setOrgCount(500);
        setAssetCount(50);
        setUptime(99.9);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: Cpu,
      title: 'AI Health Scoring',
      description: 'Predict equipment failures before they happen with automated hardware diagnostics.'
    },
    {
      icon: QrCode,
      title: 'QR Asset Tracking',
      description: 'Scan, assign, inspect, and track device custody in seconds using Smart QR tags.'
    },
    {
      icon: Shield,
      title: 'Role-Based Access',
      description: 'Granular permissions, strict tenant boundary isolation, and audit trail compliance.'
    },
    {
      icon: MessageSquare,
      title: 'Real-time Chat',
      description: 'Communicate inside tickets instantly with live WebSocket updates and status triggers.'
    },
    {
      icon: RefreshCw,
      title: 'Lifecycle Management',
      description: 'From procurement purchase orders to grading, repair, and authorized decommissioning.'
    },
    {
      icon: Bell,
      title: 'Smart Notifications',
      description: 'Never miss a warranty expiration, maintenance window, or custody inspection alert.'
    }
  ];

  const steps = [
    {
      number: '1',
      icon: UserPlus,
      title: 'Register',
      description: 'Create your multi-tenant organization in seconds with secure isolation.'
    },
    {
      number: '2',
      icon: LinkIcon,
      title: 'Assign',
      description: 'Distribute hardware to your team with seamless digital custody records.'
    },
    {
      number: '3',
      icon: Activity,
      title: 'Monitor',
      description: 'AI algorithms continuously monitor failure risk, warranty terms, and tickets.'
    },
    {
      number: '4',
      icon: Archive,
      title: 'Retire',
      description: 'Condemn and safely dispose of depreciated assets with complete audit history.'
    }
  ];

  const testimonials = [
    {
      quote:
        'AssetOwl eliminated ghost inventory and cut our device loss rate to absolute zero within 90 days.',
      name: 'Marcus Vance',
      role: 'Head of Global IT',
      company: 'TechCorp International'
    },
    {
      quote:
        'The real-time WebSocket ticket chat and automated return grading transformed our hardware desk.',
      name: 'Samantha Reed',
      role: 'VP Infrastructure',
      company: 'OmniGlobal Systems'
    },
    {
      quote:
        'AI health scoring saved us thousands by pinpointing dying laptop batteries months before catastrophic failures.',
      name: 'David Chen',
      role: 'IT Operations Lead',
      company: 'Starlight Media'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="AssetOwl Logo"
              className="w-10 h-10 rounded-xl object-contain shadow-lg shadow-indigo-600/30"
            />
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white">
                AssetOwl
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                v2.0
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="md"
              className="text-slate-300 hover:text-white hover:bg-slate-800"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={ArrowRight}
              onClick={() => navigate('/register')}
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-6 py-20 overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        {/* Floating Decorative Lucide Icons with Keyframe Animations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-16 left-12 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400/40 animate-float">
            <Laptop className="w-12 h-12" />
          </div>
          <div className="absolute top-28 right-16 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400/40 animate-float-delayed">
            <Shield className="w-10 h-10" />
          </div>
          <div className="absolute bottom-20 left-20 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400/30 animate-float-delayed">
            <BarChart3 className="w-12 h-12" />
          </div>
          <div className="absolute bottom-24 right-24 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400/30 animate-float">
            <Cpu className="w-14 h-14" />
          </div>
        </div>

        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-xs font-semibold shadow-inner">
            <span>🚀 v2.0 Now Live</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight">
            Manage Assets{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-300">
              Intelligently
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            AI-powered asset lifecycle management for modern organizations. Complete custody governance, instant QR tagging, and real-time support.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 flex items-center justify-center gap-2 cursor-pointer"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl text-lg font-semibold backdrop-blur transition-all border border-white/10 hover:border-white/20 cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="py-24 px-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Everything you need to manage assets
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base">
              Autonomous workflows designed from the ground up for IT, Operations, and Finance leaders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, idx) => {
              const Icon = f.icon;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 group"
                >
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl w-fit group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-4">
                    {f.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 leading-relaxed">
                    {f.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              How AssetOwl Works
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Four streamlined steps to complete hardware lifecycle orchestration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div key={idx} className="relative flex flex-col items-center text-center space-y-3">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 dark:bg-slate-800 text-indigo-400 text-xs font-bold rounded-full flex items-center justify-center border-2 border-indigo-600">
                      {s.number}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {s.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-indigo-600 py-12 px-6 text-white shadow-xl">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-indigo-500/50">
          <div className="space-y-1">
            <div className="text-4xl font-extrabold tracking-tight">
              {orgCount}+
            </div>
            <div className="text-sm text-indigo-100 font-medium">
              Organizations Worldwide
            </div>
          </div>
          <div className="space-y-1 pt-6 md:pt-0">
            <div className="text-4xl font-extrabold tracking-tight">
              {assetCount}K+
            </div>
            <div className="text-sm text-indigo-100 font-medium">
              Assets Monitored
            </div>
          </div>
          <div className="space-y-1 pt-6 md:pt-0">
            <div className="text-4xl font-extrabold tracking-tight">
              {uptime}%
            </div>
            <div className="text-sm text-indigo-100 font-medium">
              Platform Uptime SLA
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Trusted by Teams Worldwide
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Discover how enterprise leaders scale IT operations with AssetOwl.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <Quote className="w-6 h-6 text-indigo-400 opacity-60" />
                  <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                    "{t.quote}"
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {t.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {t.role} • {t.company}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-slate-900 text-white text-center relative overflow-hidden border-t border-slate-800">
        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Ready to streamline your assets?
          </h2>
          <p className="text-slate-400 text-base">
            Join hundreds of organizations already using AssetOwl to automate custody, support, and compliance.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-2xl shadow-indigo-600/40 transition-all hover:scale-105 cursor-pointer"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-6 bg-slate-950 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="AssetOwl Logo" className="w-5 h-5 rounded-md object-contain" />
            <span className="font-semibold text-slate-400">AssetOwl Platform</span>
            <span>• © {new Date().getFullYear()} AssetOwl Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-slate-300 transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-slate-300 transition-colors">
              Register
            </Link>
            <a href="#privacy" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:text-slate-300 transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
