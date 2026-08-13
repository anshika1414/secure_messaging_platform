'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { Toast } from '../../../components/common/Toast';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginInput || !passwordInput) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await login(loginInput.trim(), passwordInput);
      router.push('/chat');
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickLogin = async (username: string) => {
    setLoginInput(username);
    setPasswordInput('password123');
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await login(username, 'password123');
      router.push('/chat');
    } catch (err: any) {
      setErrorMessage(err.message || 'Quick login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-100 dark:bg-signal-dark p-4">
      {errorMessage && (
        <Toast message={errorMessage} type="error" onClose={() => setErrorMessage(null)} />
      )}

      <div className="w-full max-w-md bg-white dark:bg-signal-dark-panel rounded-3xl shadow-2xl border border-gray-200 dark:border-signal-dark-border p-8 animate-fade-in">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-signal-dark-surface border border-blue-100 dark:border-signal-dark-border flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Shield className="w-9 h-9 text-signal-blue" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome to Signal</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Enter your credentials or pick a demo user to get started.
          </p>
        </div>

        {/* Quick Demo Login Pills */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 text-center">
            Instant Demo Logins (Click to test)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: 'Alice', user: 'alice' },
              { name: 'Bob', user: 'bob' },
              { name: 'Charlie', user: 'charlie' },
              { name: 'Grace', user: 'grace' },
            ].map((u) => (
              <button
                key={u.user}
                onClick={() => quickLogin(u.user)}
                disabled={isSubmitting}
                className="py-2 px-3 bg-blue-50 hover:bg-blue-100 dark:bg-signal-dark-surface dark:hover:bg-gray-800 text-signal-blue dark:text-blue-400 text-xs font-semibold rounded-xl border border-blue-100 dark:border-signal-dark-border/60 transition-all text-center"
              >
                Login as {u.name}
              </button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Username or Phone
            </label>
            <input
              type="text"
              required
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder="e.g. alice or +14155550101"
              className="w-full px-4 py-3 bg-gray-100 dark:bg-signal-dark-surface border border-transparent focus:border-signal-blue rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-gray-100 dark:bg-signal-dark-surface border border-transparent focus:border-signal-blue rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !loginInput || !passwordInput}
            className="w-full py-3.5 bg-signal-blue hover:bg-signal-blue-hover text-white text-sm font-semibold rounded-xl shadow-lg disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer link */}
        <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-signal-blue hover:underline">
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
}
