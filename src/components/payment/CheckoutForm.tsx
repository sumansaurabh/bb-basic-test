'use client';

import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

interface CheckoutFormProps {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CheckoutForm({ amount, onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      });

      if (submitError) {
        setError(submitError.message || 'Payment failed');
        setIsProcessing(false);
      } else {
        // Payment succeeded
        onSuccess();
      }
    } catch {
      setError('An unexpected error occurred');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-blue-500/20 border border-blue-500 rounded">
        <p className="text-sm text-blue-200">
          You&apos;re adding <span className="font-bold text-lg">${amount}</span> to your account
        </p>
      </div>

      <div className="bg-gray-800 p-4 rounded">
        <PaymentElement />
      </div>

      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded font-semibold transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded font-semibold transition-colors"
        >
          {isProcessing ? 'Processing...' : `Pay $${amount}`}
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Powered by Stripe. Your payment information is secure.
      </p>
    </form>
  );
}
