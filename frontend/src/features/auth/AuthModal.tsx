import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Icons } from '../../components/icons';
import { BrandLogo } from '../../components/BrandLogo';

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
};

export const AuthModal: React.FC<AuthModalProps> = ({ open, onClose, onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    setError('');
    setMessage('');
    setSubmitting(true);

    if (mode === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      setSubmitting(false);

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!data.session) {
        setMessage('Account created. Check your email to confirm signup.');
        return;
      }

      onAuthenticated();
      onClose();
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    onAuthenticated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-md">
      <div className="w-full max-w-md glass-panel p-8 relative border border-white/70">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-700" aria-label="Close auth dialog">
          <Icons.X className="w-5 h-5" />
        </button>

        <BrandLogo className="h-12 w-auto rounded-md shadow-sm mb-3" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs tracking-[0.1em] uppercase border border-amber-200 mb-4">
          Secure Access
        </div>

        <h2 className="text-3xl auth-title text-slate-900 mb-1">{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
        <p className="text-sm text-slate-600 mb-6">Unlock your personal learning resources and generate tailored course content.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-400"
            autoComplete="email"
            disabled={submitting}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-400"
            autoComplete="current-password"
            disabled={submitting}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}
          <button type="submit" disabled={submitting} className="w-full rounded-xl gold-btn text-slate-900 py-3 font-semibold disabled:opacity-60">
            {submitting ? 'Please wait...' : mode === 'login' ? 'Login' : 'Sign up'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError('');
            setMessage('');
          }}
          className="w-full mt-4 text-sm text-slate-700 hover:text-slate-900 font-medium"
        >
          {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  );
};
