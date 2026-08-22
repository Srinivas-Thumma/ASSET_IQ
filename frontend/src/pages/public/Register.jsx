import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Building,
  Eye,
  EyeOff,
  Package,
  Laptop,
  Shield,
  BarChart3,
  Cpu,
  ArrowRight,
  ArrowLeft,
  Info
} from 'lucide-react';
import { authApi } from '../../api/auth.api.js';
import AmongUsMascot from '../../components/ui/AmongUsMascot.jsx';
import { toast } from 'sonner';

export const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const passwordVal = watch('password', '');

  // Calculate password strength (0 to 100)
  const getPasswordStrength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 6) score += 25;
    if (pwd.length >= 10) score += 25;
    if (/[A-Z]/.test(pwd)) score += 25;
    if (/[0-9!@#$%^&*]/.test(pwd)) score += 25;
    return score;
  };

  const strengthScore = getPasswordStrength(passwordVal);

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
        organizationCode: data.organizationCode?.trim() || undefined
      });
      toast.success('Account created successfully. Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Brand Showcase (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex-col justify-center items-center p-12 relative overflow-hidden text-center">
        {/* Floating Decorative Icons */}
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

        {/* Hero Copy */}
        <div className="relative z-10 space-y-6 max-w-md">
          <Link
            to="/"
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
            <p className="text-indigo-300 text-sm font-semibold mt-1">
              Join thousands managing assets smarter
            </p>
          </div>
          <p className="text-slate-300 text-base leading-relaxed">
            Create your organization account today or join your existing company team using your organization code.
          </p>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 md:p-10 border border-slate-200 dark:border-slate-800">
            <div className="text-center mb-6">
              <Link to="/" className="inline-flex lg:hidden mb-3 hover:scale-105 transition-transform">
                <img src="/logo.png" alt="AssetOwl Logo" className="w-12 h-12 rounded-2xl object-contain shadow-md" />
              </Link>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Create an account
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                Start your free trial or connect to your workplace
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    {...register('name', { required: 'Full name is required' })}
                    type="text"
                    autoComplete="name"
                    placeholder="Alex Morgan"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {errors.name && (
                  <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.name.message}</p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    {...register('email', { required: 'Email is required' })}
                    type="email"
                    autoComplete="email"
                    placeholder="alex@company.com"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {errors.email && (
                  <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Minimum 6 characters' }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Bar */}
                {passwordVal && (
                  <div className="mt-1.5 space-y-1">
                    <div className="grid grid-cols-3 gap-1 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-colors ${
                          strengthScore > 0
                            ? strengthScore <= 30
                              ? 'bg-rose-500'
                              : strengthScore <= 60
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                      <div
                        className={`h-full rounded-full transition-colors ${
                          strengthScore > 30
                            ? strengthScore <= 60
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                      <div
                        className={`h-full rounded-full transition-colors ${
                          strengthScore > 60
                            ? 'bg-emerald-500'
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 text-right font-medium">
                      {strengthScore <= 30
                        ? 'Weak password'
                        : strengthScore <= 60
                        ? 'Medium strength'
                        : 'Strong password'}
                    </p>
                  </div>
                )}
                {errors.password && (
                  <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    {...register('confirmPassword', { required: 'Please confirm password' })}
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Organization Code (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Organization Code <span className="font-normal text-slate-400">(Optional)</span>
                  </label>
                  <span
                    title="Leave blank to create a new organization as Admin"
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    {...register('organizationCode')}
                    type="text"
                    placeholder="ORG-XXXXXX"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                {isSubmitting ? 'Creating account...' : 'Create Account'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Links */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center space-y-2.5">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                >
                  Sign In
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

      {/* Floating Bottom-Right Among Us Mascot */}
      <AmongUsMascot />
    </div>
  );
};

export default Register;
