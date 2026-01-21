import { useState } from 'react';
import Button from '../ui/Button';

interface WaitlistFormProps {
  eventId: string;
  ticketTypeId?: string;
  eventTitle: string;
}

export default function WaitlistForm({ eventId, ticketTypeId, eventTitle }: WaitlistFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/waitlist/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          ticketTypeId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      setPosition(data.position);
      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  if (isSubmitted) {
    return (
      <div id="waitlist-section" className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-green-800 mb-2">
          You're on the Waitlist!
        </h3>
        <p className="text-green-700 mb-2">
          Your position: <span className="font-bold">#{position}</span>
        </p>
        <p className="text-sm text-green-600">
          We'll email you at <strong>{formData.email}</strong> when a spot becomes available.
          You'll have 48 hours to complete your purchase.
        </p>
      </div>
    );
  }

  return (
    <div id="waitlist-section" className="bg-gray-50 border border-gray-200 rounded-xl p-6">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-gps-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-gps-gold-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gps-navy-dark mb-2">
          Join the Waitlist
        </h3>
        <p className="text-sm text-gray-600">
          Get notified when a spot opens up for <strong>{eventTitle}</strong>
        </p>
      </div>

      {error && (
        <div className="alert-error mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="form-label">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="form-input"
            placeholder="your@email.com"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="form-label">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="form-input"
              placeholder="John"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="form-label">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="form-input"
              placeholder="Doe"
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="form-label">
            Phone <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="form-input"
            placeholder="(555) 123-4567"
          />
        </div>

        <Button
          type="submit"
          variant="secondary"
          className="w-full"
          isLoading={isSubmitting}
        >
          Join Waitlist
        </Button>

        <p className="text-xs text-gray-500 text-center">
          By joining the waitlist, you agree to receive email notifications about ticket availability.
        </p>
      </form>
    </div>
  );
}
