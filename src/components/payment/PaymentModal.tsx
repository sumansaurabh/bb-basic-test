'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { CheckoutForm } from './CheckoutForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [amount, setAmount] = useState(5);
  const [clientSecret, setClientSecret] = useState('');
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [error, setError] = useState('');

  const handleAmountSubmit = async () => {
    if (amount < 5) {
      setError('Minimum top-up amount is $5');
      return;
    }

    setError('');
    setIsCreatingIntent(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/payment/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create payment intent');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize payment');
    } finally {
      setIsCreatingIntent(false);
    }
  };

  const handleSuccess = () => {
    setClientSecret('');
    setAmount(5);
    onSuccess();
  };

  const handleClose = () => {
    setClientSecret('');
    setAmount(5);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Add Credits</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {!clientSecret ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Amount (USD)
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">$</span>
                <input
                  type="number"
                  min="5"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value))}
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500 text-lg"
                />
              </div>
              <p className="mt-2 text-sm text-gray-400">Minimum: $5</p>
            </div>

            {/* Quick amount buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 25, 50].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`py-2 rounded font-medium transition-colors ${
                    amount === preset
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  ${preset}
                </button>
              ))}
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500 rounded text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleAmountSubmit}
              disabled={isCreatingIntent || amount < 5}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded font-semibold transition-colors"
            >
              {isCreatingIntent ? 'Processing...' : 'Continue to Payment'}
            </button>
          </div>
        ) : (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm
              amount={amount}
              onSuccess={handleSuccess}
              onCancel={() => setClientSecret('')}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}
