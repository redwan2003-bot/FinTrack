import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, Wallet, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Waves } from '../components/ui/Waves';
import toast from 'react-hot-toast';

/**
 * FIX #1 — Enhanced authentication with:
 * - Proper email format validation
 * - Password strength meter (length, uppercase, number, special char)
 * - Password visibility toggle
 * - Login attempt rate-limiting (3 attempts → 15-second lockout)
 * - Accessible form labels with id/for associations
 * - Error feedback via aria-describedby
 */
const MIN_PASSWORD_LENGTH = 8;

function getPasswordStrength(pwd) {
  let score = 0;
  if (pwd.length >= MIN_PASSWORD_LENGTH) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];
  return { score, label: labels[score] || '', color: colors[score] || '' };
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const strength = getPasswordStrength(password);
  const isLocked = lockedUntil && Date.now() < lockedUntil;

  const validate = () => {
    const errs = {};
    // Email validation
    if (!email) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Enter a valid email address';
    }
    // Password validation
    if (!password) {
      errs.password = 'Password is required';
    } else if (!isLogin && password.length < MIN_PASSWORD_LENGTH) {
      errs.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    } else if (!isLogin && strength.score < 2) {
      errs.password = 'Password is too weak. Add uppercase, numbers, or symbols.';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // FIX #1: Rate limiting — lockout after 3 failed attempts
    if (isLocked) {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      toast.error(`Too many attempts. Try again in ${remaining}s.`);
      return;
    }

    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 700));

      // FIX #1: Demo credentials check (in production, this would be a real API call)
      if (isLogin) {
        const validDemoEmail = email.includes('@') && email.length > 3;
        const validDemoPassword = password.length >= 1;
        if (!validDemoEmail || !validDemoPassword) {
          throw new Error('Invalid credentials');
        }
      }

      login(email, password);
      toast.success(isLogin ? 'Welcome back!' : 'Account created!');
      navigate('/dashboard');
      setAttempts(0);
    } catch {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        const lockTime = Date.now() + 15000; // 15 second lockout
        setLockedUntil(lockTime);
        toast.error('Too many failed attempts. Locked for 15 seconds.');
        setTimeout(() => setLockedUntil(null), 15000);
      } else {
        toast.error(`Authentication failed. ${3 - newAttempts} attempt${3 - newAttempts !== 1 ? 's' : ''} remaining.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <Waves
        strokeColor="rgba(124, 58, 237, 0.2)"
        backgroundColor="transparent"
        style={{ position: 'absolute', zIndex: 0 }}
      />

      <motion.div
        className="w-full max-w-md relative z-10 p-8 rounded-2xl border backdrop-blur-xl shadow-2xl"
        style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-[var(--primary-glow)]" style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)' }}>
            <Wallet color="white" size={24} aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-1)]">
            {isLogin ? 'Welcome Back' : 'Join FinTrack'}
          </h1>
          <p className="text-[var(--text-2)] text-sm mt-2 text-center">
            {isLogin
              ? 'Enter your credentials to access your financial dashboard.'
              : 'Create an account to start mastering your finances today.'}
          </p>
        </div>

        {isLocked && (
          <div
            className="flex items-center gap-2 p-3 rounded-lg mb-4 text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
            role="alert"
          >
            <AlertCircle size={16} aria-hidden="true" />
            Account temporarily locked due to multiple failed attempts.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email */}
          <div className="space-y-1">
            <label htmlFor="auth-email" className="text-xs font-medium text-[var(--text-2)] uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                size={16}
                aria-hidden="true"
              />
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                aria-describedby={errors.email ? 'auth-email-error' : undefined}
                aria-invalid={!!errors.email}
                className={`w-full rounded-lg py-2.5 pl-10 pr-4 text-[var(--text-1)] outline-none transition-all border ${
                  errors.email
                    ? 'border-red-500/50 bg-red-500/5 focus:border-red-500'
                    : 'border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] focus:border-primary focus:ring-1 focus:ring-primary/30'
                }`}
                placeholder="you@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                disabled={isLoading || !!isLocked}
              />
            </div>
            {errors.email && (
              <p id="auth-email-error" className="text-xs text-red-400 flex items-center gap-1" role="alert">
                <AlertCircle size={11} aria-hidden="true" /> {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label htmlFor="auth-password" className="text-xs font-medium text-[var(--text-2)] uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                size={16}
                aria-hidden="true"
              />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                aria-describedby={errors.password ? 'auth-password-error' : 'auth-password-hint'}
                aria-invalid={!!errors.password}
                className={`w-full rounded-lg py-2.5 pl-10 pr-10 text-[var(--text-1)] outline-none transition-all border ${
                  errors.password
                    ? 'border-red-500/50 bg-red-500/5 focus:border-red-500'
                    : 'border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] focus:border-primary focus:ring-1 focus:ring-primary/30'
                }`}
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
                disabled={isLoading || !!isLocked}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-1)] transition-colors"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>

            {/* FIX #1: Password strength meter (sign-up only) */}
            {!isLogin && password.length > 0 && (
              <div>
                <div className="auth-strength">
                  <div
                    className="auth-strength-fill"
                    style={{ width: `${(strength.score / 4) * 100}%`, background: strength.color }}
                    aria-hidden="true"
                  />
                </div>
                <p id="auth-password-hint" className="text-xs mt-1" style={{ color: strength.color }} aria-live="polite">
                  Strength: {strength.label}
                  {strength.score === 4 && <CheckCircle2 size={11} className="inline ml-1" aria-hidden="true" />}
                </p>
              </div>
            )}

            {errors.password && (
              <p id="auth-password-error" className="text-xs text-red-400 flex items-center gap-1" role="alert">
                <AlertCircle size={11} aria-hidden="true" /> {errors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full btn btn-primary py-2.5 flex items-center justify-center gap-2 mt-6"
            disabled={isLoading || !!isLocked}
            aria-busy={isLoading}
          >
            {isLoading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
              : null}
            {isLogin ? 'Sign In' : 'Create Account'}
            {!isLoading && <ArrowRight size={16} aria-hidden="true" />}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setErrors({}); setPassword(''); }}
            className="text-sm text-[var(--text-2)] hover:text-primary transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        {/* Demo hint */}
        <div className="mt-4 p-3 rounded-xl text-center" style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.15)' }}>
          <p className="text-xs text-[var(--text-2)]">Demo: any email + any password to log in.</p>
        </div>
      </motion.div>
    </div>
  );
}
