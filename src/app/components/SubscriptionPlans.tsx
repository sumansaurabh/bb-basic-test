'use client';

import { useState } from 'react';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe';

interface SubscriptionPlansProps {
  onSelectPlan?: (priceId: string, planName: string) => void;
}

export function SubscriptionPlans({ onSelectPlan }: SubscriptionPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectPlan = async (priceId: string, planName: string) => {
    setSelectedPlan(priceId);
    setIsLoading(true);

    try {
      if (onSelectPlan) {
        await onSelectPlan(priceId, planName);
      } else {
        // Default behavior: redirect to checkout
        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            priceId,
            successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${window.location.origin}/payment/cancel`,
          }),
        });

        const data = await response.json();

        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('Failed to create checkout session');
        }
      }
    } catch (error) {
      console.error('Error selecting plan:', error);
      alert('Failed to process subscription. Please try again.');
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
      {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
        const isPopular = key === 'pro';
        const isProcessing = selectedPlan === plan.priceId && isLoading;

        return (
          <div
            key={key}
            className={`relative bg-gray-800 rounded-lg p-8 border-2 transition-all transform hover:scale-105 ${
              isPopular
                ? 'border-purple-500 shadow-lg shadow-purple-500/50'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            {isPopular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                  MOST POPULAR
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="flex items-baseline justify-center">
                <span className="text-5xl font-bold text-white">${plan.price}</span>
                <span className="text-gray-400 ml-2">/{plan.interval}</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-400 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectPlan(plan.priceId, plan.name)}
              disabled={isProcessing}
              className={`w-full py-3 px-6 rounded-lg font-bold transition-all ${
                isPopular
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Get Started'
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
