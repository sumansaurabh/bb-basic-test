'use client';

import { useState } from 'react';
import { formatAmount } from '@/lib/stripe';

interface Subscription {
  _id: string;
  stripeSubscriptionId: string;
  planType: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  amount: number;
  currency: string;
}

interface SubscriptionCardProps {
  subscription: Subscription;
  onCancel: (subscriptionId: string) => void;
}

export function SubscriptionCard({ subscription, onCancel }: SubscriptionCardProps) {
  const [isCanceling, setIsCanceling] = useState(false);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this subscription?')) {
      return;
    }

    setIsCanceling(true);
    try {
      await onCancel(subscription.stripeSubscriptionId);
    } finally {
      setIsCanceling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-900 text-green-200 border-green-600';
      case 'canceled':
        return 'bg-red-900 text-red-200 border-red-600';
      case 'past_due':
        return 'bg-yellow-900 text-yellow-200 border-yellow-600';
      default:
        return 'bg-gray-900 text-gray-200 border-gray-600';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white capitalize">
            {subscription.planType} Plan
          </h3>
          <p className="text-2xl font-bold text-blue-400 mt-2">
            {formatAmount(subscription.amount)}
            <span className="text-sm text-gray-400">/month</span>
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-bold border ${getStatusColor(
            subscription.status
          )}`}
        >
          {subscription.status.toUpperCase()}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Subscription ID:</span>
          <span className="text-gray-300 font-mono text-xs">
            {subscription.stripeSubscriptionId.slice(0, 20)}...
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Current Period Ends:</span>
          <span className="text-gray-300">
            {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </span>
        </div>
        {subscription.cancelAtPeriodEnd && (
          <div className="bg-yellow-900 border border-yellow-600 text-yellow-200 p-3 rounded mt-2">
            <p className="text-sm">
              ⚠️ This subscription will be canceled at the end of the current period.
            </p>
          </div>
        )}
      </div>

      {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
        <button
          onClick={handleCancel}
          disabled={isCanceling}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          {isCanceling ? 'Canceling...' : 'Cancel Subscription'}
        </button>
      )}
    </div>
  );
}
