import { useState } from 'react';

interface NewsletterSignupProps {
  title?: string;
  subtitle?: string;
  description?: string;
  variant?: 'default' | 'inline' | 'dark';
}

export default function NewsletterSignup({
  title = "Stay Updated",
  subtitle = "Join Our Newsletter",
  description = "Get notified about new courses, special offers, and the latest in dental education.",
  variant = 'default'
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      // TODO: Integrate with actual newsletter service (Elastic Email or similar)
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        setStatus('success');
        setMessage('Thank you! You have been subscribed successfully.');
        setEmail('');
      } else {
        throw new Error('Subscription failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  if (variant === 'inline') {
    return (
      <div className="bg-[#F2F2F2] rounded-xl p-6">
        <h4 className="text-lg font-bold text-[#0C2044] mb-2">{subtitle}</h4>
        <p className="text-gray-600 text-sm mb-4">{description}</p>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent text-sm"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-4 py-2 bg-[#0B52AC] hover:bg-[#0C2044] text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {status === 'loading' ? '...' : 'Subscribe'}
          </button>
        </form>

        {status !== 'idle' && (
          <p className={`mt-2 text-sm ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'dark') {
    return (
      <section className="py-16 bg-[#0C2044]">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-[#DDC89D] font-semibold text-lg mb-2 uppercase tracking-wide">
              {title}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white font-heading mb-4">
              {subtitle}
            </h2>
            <p className="text-white/80 text-lg mb-8">
              {description}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="flex-1 px-6 py-4 rounded-lg border-2 border-white/20 bg-white/10 text-white placeholder-white/50 focus:outline-none focus:border-[#DDC89D] focus:bg-white/20 transition-all"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-8 py-4 bg-[#DDC89D] hover:bg-white text-[#0C2044] rounded-lg font-bold transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl"
              >
                {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>

            {status !== 'idle' && (
              <p className={`mt-4 ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {message}
              </p>
            )}

            <p className="text-white/50 text-sm mt-6">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Default variant
  return (
    <section className="py-20 bg-gradient-to-br from-[#173D84] to-[#0C2044] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#DDC89D]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#26ACF5]/10 rounded-full blur-3xl" />
      </div>

      <div className="container-wide relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <p className="text-[#DDC89D] font-semibold text-lg mb-2 uppercase tracking-wide">
              {title}
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-heading mb-4">
              {subtitle}
            </h2>
            <p className="text-white/80 text-lg leading-relaxed">
              {description}
            </p>

            <div className="mt-8 flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#DDC89D]/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#DDC89D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-white/80">New course alerts</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#DDC89D]/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#DDC89D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-white/80">Exclusive offers</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#DDC89D]/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#DDC89D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-white/80">Industry insights</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl p-8 md:p-10 shadow-2xl">
            <h3 className="text-2xl font-bold text-[#0C2044] mb-6">Subscribe Now</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-4 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B52AC] focus:border-transparent transition-all text-lg"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-4 bg-[#0B52AC] hover:bg-[#0C2044] text-white rounded-lg font-bold text-lg transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl"
              >
                {status === 'loading' ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Subscribing...
                  </span>
                ) : (
                  'Subscribe to Newsletter'
                )}
              </button>

              {status !== 'idle' && (
                <div className={`p-4 rounded-lg ${status === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {message}
                </div>
              )}
            </form>

            <p className="text-gray-500 text-sm mt-6 text-center">
              By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
