'use client';

import { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { PaymentForm } from '../components/PaymentForm';
import { SubscriptionPlans } from '../components/SubscriptionPlans';
import Link from 'next/link';

// Load Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

export default function PaymentPage() {
  const [activeTab, setActiveTab] = useState<'custom' | 'subscription'>('subscription');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [amount, setAmount] = useState<number>(50);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);

  const createPaymentIntent = async () => {
    setIsCreatingIntent(true);
    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'usd',
          description: 'Custom payment',
        }),
      });

      const data = await response.json();

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        throw new Error(data.error || 'Failed to create payment intent');
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
      alert('Failed to initialize payment. Please try again.');
    } finally {
      setIsCreatingIntent(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            💳 Stripe Payment Gateway
          </h1>
          <p className="text-xl text-gray-400">
            Choose between custom payments or subscription plans
          </p>
          <Link
            href="/"
            className="inline-block mt-4 text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800 rounded-lg p-1 inline-flex">
            <button
              onClick={() => setActiveTab('subscription')}
              className={`px-8 py-3 rounded-lg font-bold transition-all ${
                activeTab === 'subscription'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Subscription Plans
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`px-8 py-3 rounded-lg font-bold transition-all ${
                activeTab === 'custom'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Custom Payment
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mt-8">
          {activeTab === 'subscription' ? (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Choose Your Plan</h2>
                <p className="text-gray-400">
                  Select a subscription plan that fits your needs
                </p>
              </div>
              <SubscriptionPlans />
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <div className="bg-gray-800 rounded-lg p-8 mb-8">
                <h2 className="text-3xl font-bold mb-6">Custom Payment</h2>
                <p className="text-gray-400 mb-6">
                  Enter an amount and complete your one-time payment
                </p>

                {!clientSecret ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-2">
                        Payment Amount (USD)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl text-gray-400">
                          $
                        </span>
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={amount}
                          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                          className="w-full pl-10 pr-4 py-4 bg-gray-700 text-white text-2xl rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="50.00"
                        />
                      </div>
                    </div>

                    <button
                      onClick={createPaymentIntent}
                      disabled={isCreatingIntent || amount <= 0}
                      className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                    >
                      {isCreatingIntent ? (
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
                          Initializing...
                        </span>
                      ) : (
                        'Continue to Payment'
                      )}
                    </button>
                  </div>
                ) : (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'night',
                        variables: {
                          colorPrimary: '#8b5cf6',
                          colorBackground: '#1f2937',
                          colorText: '#ffffff',
                          colorDanger: '#ef4444',
                          fontFamily: 'system-ui, sans-serif',
                          borderRadius: '8px',
                        },
                      },
                    }}
                  >
                    <PaymentForm
                      amount={amount}
                      onSuccess={() => {
                        window.location.href = '/payment/success';
                      }}
                      onError={(error) => {
                        console.error('Payment error:', error);
                      }}
                    />
                  </Elements>
                )}
              </div>

              {clientSecret && (
                <button
                  onClick={() => {
                    setClientSecret('');
                    setAmount(50);
                  }}
                  className="w-full py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
                >
                  Change Amount
                </button>
              )}
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold mb-2">Secure Payments</h3>
            <p className="text-gray-400">
              All payments are processed securely through Stripe
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-2">Instant Processing</h3>
            <p className="text-gray-400">
              Fast and reliable payment processing
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <div className="text-4xl mb-4">💳</div>
            <h3 className="text-xl font-bold mb-2">Multiple Methods</h3>
            <p className="text-gray-400">
              Support for cards, wallets, and more
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
