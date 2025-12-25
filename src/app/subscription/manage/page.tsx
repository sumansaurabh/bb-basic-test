'use client';

import { useState } from 'react';
import { SubscriptionCard } from '../../components/SubscriptionCard';
import { PaymentHistory } from '../../components/PaymentHistory';
import Link from 'next/link';

interface SubscriptionData {
  _id: string;
  stripeSubscriptionId: string;
  planType: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  amount: number;
  currency: string;
}

export default function ManageSubscriptionPage() {
  const [email, setEmail] = useState('');
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch(
        `/api/stripe/get-subscription?email=${encodeURIComponent(email)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch subscriptions');
      }

      setSubscriptions(data.subscriptions);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          cancelAtPeriodEnd: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      // Refresh subscriptions
      const submitEvent = new Event('submit') as unknown as React.FormEvent;
      handleSearch(submitEvent);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to cancel subscription');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-400 hover:text-blue-300 flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to home
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-white mb-4">
          Manage Subscriptions
        </h1>
        <p className="text-gray-400 mb-8">
          View and manage your active subscriptions and payment history
        </p>

        <form onSubmit={handleSearch} className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email address"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-900 border border-red-600 text-red-200 p-4 rounded-lg mb-8">
            {error}
          </div>
        )}

        {hasSearched && !isLoading && (
          <>
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">
                Your Subscriptions
              </h2>
              {subscriptions.length === 0 ? (
                <div className="bg-gray-800 rounded-lg p-8 text-center">
                  <p className="text-gray-400 mb-4">No subscriptions found for this email.</p>
                  <Link
                    href="/subscription"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    Browse Plans
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subscriptions.map((subscription) => (
                    <SubscriptionCard
                      key={subscription._id}
                      subscription={subscription}
                      onCancel={handleCancelSubscription}
                    />
                  ))}
                </div>
              )}
            </div>

            {email && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">
                  Payment History
                </h2>
                <PaymentHistory email={email} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
