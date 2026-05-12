import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import LoginForm from '../components/ui/login-form';
import toast from 'react-hot-toast';

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
    if (!email) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Enter a valid email address';
    }
    if (!password) {
      errs.password = 'Password is required';
    } else if (!isLogin && password.length < MIN_PASSWORD_LENGTH) {
      errs.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLocked) {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      toast.error(`Too many attempts. Try again in ${remaining}s.`);
      return;
    }

    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      Object.values(errs).forEach(msg => toast.error(msg));
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

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
        const lockTime = Date.now() + 15000;
        setLockedUntil(lockTime);
        toast.error('Security Lockout: 15 seconds.');
        setTimeout(() => setLockedUntil(null), 15000);
      } else {
        toast.error(`Auth failed. ${3 - newAttempts} attempts left.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginForm 
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      handleSubmit={handleSubmit}
      isLoading={isLoading}
      isLogin={isLogin}
      setIsLogin={setIsLogin}
      isLocked={isLocked}
    />
  );
}
