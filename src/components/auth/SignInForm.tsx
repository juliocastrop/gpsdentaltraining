import { useState } from 'react';

interface SignInFormProps {
  redirectUrl?: string;
}

export default function SignInForm({ redirectUrl = '/account' }: SignInFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid email or password');
        return;
      }

      window.location.href = data.redirectUrl || redirectUrl;
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setForgotSent(true);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (showForgot) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white shadow-xl rounded-xl p-8">
          {forgotSent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#13326A] mb-2">Check your email</h3>
              <p className="text-[#4E6E82] mb-6">
                If an account exists with <strong>{email}</strong>, we've sent a password reset link.
              </p>
              <button
                onClick={() => { setShowForgot(false); setForgotSent(false); }}
                className="text-[#13326A] font-semibold hover:text-[#EA4C22] transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword}>
              <h3 className="text-xl font-bold text-[#13326A] mb-2">Reset Password</h3>
              <p className="text-[#4E6E82] mb-6 text-sm">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
              )}

              <div className="mb-4">
                <label htmlFor="forgot-email" className="block text-[#293647] font-medium mb-1 text-sm">
                  Email Address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-gray-300 focus:border-[#13326A] focus:ring-1 focus:ring-[#13326A] rounded-lg py-3 px-4 outline-none transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#13326A] hover:bg-[#0C2044] text-white font-semibold py-3 rounded-lg transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="w-full mt-3 text-[#13326A] font-semibold hover:text-[#EA4C22] transition-colors text-sm"
              >
                Back to Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-xl rounded-xl p-8">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-[#293647] font-medium mb-1 text-sm">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 focus:border-[#13326A] focus:ring-1 focus:ring-[#13326A] rounded-lg py-3 px-4 outline-none transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div className="mb-2">
            <label htmlFor="password" className="block text-[#293647] font-medium mb-1 text-sm">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 focus:border-[#13326A] focus:ring-1 focus:ring-[#13326A] rounded-lg py-3 px-4 outline-none transition-colors"
              placeholder="Enter your password"
            />
          </div>

          <div className="mb-6 text-right">
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-[#13326A] hover:text-[#EA4C22] text-sm font-medium transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#13326A] hover:bg-[#0C2044] text-white font-semibold py-3 rounded-lg transition-all duration-300 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
