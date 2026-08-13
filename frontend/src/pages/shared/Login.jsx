import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Package,
  Laptop,
  Shield,
  BarChart3,
  Cpu,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store.js';
import { ROLE_DEFAULT_ROUTES } from '../../utils/constants.js';
import { toast } from 'sonner';

export const Login = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const user = await login(data.email, data.password);
      toast.success('Signed in successfully');
      const destination = ROLE_DEFAULT_ROUTES[user?.role] || '/my-assets';
      navigate(destination, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sign in failed. Check your email and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Brand Showcase (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex-col justify-center items-center p-12 relative overflow-hidden text-center">
        {/* Decorative Floating Icons */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-12 left-12 opacity-15 text-indigo-400 animate-float">
            <Laptop className="w-14 h-14" />
          </div>
          <div className="absolute top-20 right-16 opacity-15 text-indigo-400 animate-float-delayed">
            <Shield className="w-12 h-12" />
          </div>
          <div className="absolute bottom-24 left-20 opacity-15 text-indigo-400 animate-float-delayed">
            <Cpu className="w-14 h-14" />
          </div>
          <div className="absolute bottom-16 right-20 opacity-15 text-indigo-400 animate-float">
            <BarChart3 className="w-12 h-12" />
          </div>
        </div>

        {/* Brand Hero Element */}
        <div className="relative z-10 space-y-6 max-w-md">
          <Link
            to="/"
            title="Back to Landing"
            className="inline-flex hover:scale-105 transition-transform cursor-pointer"
          >
            <img
              src="/logo.png"
              alt="AssetOwl Logo"
              className="w-20 h-20 rounded-3xl object-contain shadow-2xl shadow-indigo-600/40"
            />
          </Link>
          <div>
            <h2 className="text-4xl font-extrabold text-white tracking-tight">
              AssetOwl
            </h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full bg-indigo-950 border border-indigo-700/50 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Autonomous IT Governance
            </div>
          </div>
          <p className="text-slate-300 text-base leading-relaxed">
            Secure. Smart. Simple. The intelligent way to manage and track your organization's complete asset fleet.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 md:p-10 border border-slate-200 dark:border-slate-800">
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex lg:hidden mb-4 hover:scale-105 transition-transform">
                <img src="/logo.png" alt="AssetOwl Logo" className="w-12 h-12 rounded-2xl object-contain shadow-md" />
              </Link>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Welcome back
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">
                Sign in to your organization account
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    {...register('email', {
                      required: 'Email address is required'
                    })}
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {errors.email && (
                  <p className="text-rose-500 text-[11px] mt-1 font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    {...register('password', {
                      required: 'Password is required'
                    })}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-rose-500 text-[11px] mt-1 font-medium">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Links */}
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                >
                  Create one
                </Link>
              </p>

              <div>
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Homepage
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
