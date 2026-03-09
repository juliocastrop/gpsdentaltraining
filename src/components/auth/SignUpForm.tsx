import { useState } from 'react';

interface SignUpFormProps {
  redirectUrl?: string;
}

export default function SignUpForm({ redirectUrl = '/account' }: SignUpFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create account');
        return;
      }

      if (data.confirmEmail) {
        setConfirmEmail(true);
      } else {
        window.location.href = redirectUrl;
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (confirmEmail) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-white shadow-xl rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-[#13326A] mb-2">Check your email</h3>
          <p className="text-[#4E6E82]">
            We've sent a confirmation link to <strong>{email}</strong>.
            Please check your inbox and click the link to activate your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-white shadow-xl rounded-xl p-8">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label htmlFor="firstName" className="block text-[#293647] font-medium mb-1 text-sm">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-gray-300 focus:border-[#13326A] focus:ring-1 focus:ring-[#13326A] rounded-lg py-3 px-4 outline-none transition-colors"
                placeholder="John"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="lastName" className="block text-[#293647] font-medium mb-1 text-sm">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-gray-300 focus:border-[#13326A] focus:ring-1 focus:ring-[#13326A] rounded-lg py-3 px-4 outline-none transition-colors"
                placeholder="Doe"
              />
            </div>
          </div>

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

          <div className="mb-6">
            <label htmlFor="password" className="block text-[#293647] font-medium mb-1 text-sm">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-gray-300 focus:border-[#13326A] focus:ring-1 focus:ring-[#13326A] rounded-lg py-3 px-4 outline-none transition-colors"
              placeholder="At least 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#13326A] hover:bg-[#0C2044] text-white font-semibold py-3 rounded-lg transition-all duration-300 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
