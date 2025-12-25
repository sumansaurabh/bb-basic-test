'use client';

import { useState } from 'react';
import { SUBSCRIPTION_PLANS, formatAmount } from '@/lib/stripe';

interface SubscriptionPlansProps {
  onSelectPlan: (planKey: string, priceId: string) => void;
}

export function SubscriptionPlans({ onSelectPlan }: SubscriptionPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSelectPlan = (planKey: string) => {
    setSelectedPlan(planKey);
    // In a real app, you would fetch the price ID from your backend
    // For now, we'll pass a placeholder that needs to be created
    onSelectPlan(planKey, `price_${planKey}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
      {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
        const isSelected = selectedPlan === key;
        const isPopular = key === 'pro';

        return (
          <div
            key={key}
            className={`relative bg-gray-800 rounded-lg p-8 border-2 transition-all ${
              isSelected
                ? 'border-blue-500 shadow-lg shadow-blue-500/50'
                : 'border-gray-700 hover:border-gray-600'
            } ${isPopular ? 'ring-2 ring-yellow-500' : ''}`}
          >
            {isPopular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-500 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">
                  MOST POPULAR
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                {plan.name}
              </h3>
              <div className="text-4xl font-bold text-blue-400 mb-2">
                {formatAmount(plan.price)}
              </div>
              <p className="text-gray-400">per {plan.interval}</p>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
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
              onClick={() => handleSelectPlan(key)}
              className={`w-full py-3 px-6 rounded-lg font-bold transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {isSelected ? 'Selected' : 'Select Plan'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
