'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { authApi } from '../../../services/api/auth';
import { useAuth } from '../../../hooks/useAuth';
import { Toast } from '../../../components/common/Toast';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mock OTP Modal state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('123456');

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !displayName || !password) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await authApi.register(username.trim(), password, displayName.trim(), phone.trim() || undefined);
      if (phone.trim()) {
        setShowOtpModal(true);
      } else {
        await login(username.trim(), password);
        router.push('/chat');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsSubmitting(true);
    try {
      await authApi.verifyOtp(phone, otpCode);
      await login(username.trim(), password);
      router.push('/chat');
    } catch (err: any) {
      setErrorMessage(err.message || 'OTP Verification failed.');
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create Signal Account</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Register to experience Signal secure messaging.
          </p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Username *
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. johndoe"
              className="w-full px-4 py-2.5 bg-gray-100 dark:bg-signal-dark-surface border border-transparent focus:border-signal-blue rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Display Name *
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-4 py-2.5 bg-gray-100 dark:bg-signal-dark-surface border border-transparent focus:border-signal-blue rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Phone Number (Optional - triggers OTP)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+14155550199"
              className="w-full px-4 py-2.5 bg-gray-100 dark:bg-signal-dark-surface border border-transparent focus:border-signal-blue rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-gray-100 dark:bg-signal-dark-surface border border-transparent focus:border-signal-blue rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !username || !displayName || !password}
            className="w-full py-3 bg-signal-blue hover:bg-signal-blue-hover text-white text-sm font-semibold rounded-xl shadow-lg disabled:opacity-50 transition-all flex items-center justify-center space-x-2 mt-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Register</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-signal-blue hover:underline">
            Sign In
          </Link>
        </div>
      </div>

      {/* Mock OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-signal-dark-panel rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-signal-dark-border text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-signal-dark-surface text-signal-blue flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Mock SMS OTP Verification</h3>
            <p className="text-xs text-gray-400">
              An SMS code was simulated for <span className="font-medium text-gray-200">{phone}</span>.
            </p>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="123456"
              className="w-full text-center tracking-widest text-lg font-mono py-2.5 bg-gray-100 dark:bg-signal-dark-surface border border-signal-blue rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none"
            />
            <button
              onClick={handleVerifyOtp}
              disabled={isSubmitting}
              className="w-full py-3 bg-signal-blue hover:bg-signal-blue-hover text-white text-sm font-semibold rounded-xl"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Verify & Continue'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
