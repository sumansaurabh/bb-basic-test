'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export function StripeCheckoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: 4999, currency: 'usd', quantity: 1 }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Failed to initiate checkout');
      }

      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error('Stripe initialization failed');
      }

      window.location.href = data.url;
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-black bg-opacity-60 p-6 rounded-lg border border-yellow-500 shadow-lg">
      <h3 className="text-2xl font-bold text-yellow-300 mb-2">Upgrade to Extreme Tier</h3>
      <p className="text-yellow-100 mb-4">
        Unlock priority access to SSR + CSR load testing presets and premium benchmarking reports.
      </p>
      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 text-black font-bold rounded-lg transition-colors"
      >
        {isLoading ? 'Launching Stripe...' : 'Buy Extreme Load Tester Pro - $49.99'}
      </button>
      {error && (
        <p className="mt-3 text-red-400 text-sm" role="alert">
          {error}
        </p>
      )}
      {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? null : (
        <p className="mt-3 text-orange-400 text-sm">
          Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable checkout in production.
        </p>
      )}
    </div>
  );
}
