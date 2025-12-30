'use client';

import { useState, useEffect } from 'react';
import { StripeProvider } from '@/components/StripeProvider';
import { CheckoutForm } from '@/components/CheckoutForm';
import { useRouter } from 'next/navigation';

export default function PaymentPage() {
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(50);
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const createPaymentIntent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          customerEmail,
          customerName,
          description: description || 'Payment',
          metadata: {
            source: 'web',
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.clientSecret) {
        setClientSecret(data.clientSecret);
        setShowCheckout(true);
      } else {
        setError(data.error || 'Failed to create payment intent');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error creating payment intent:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    router.push('/payment/success');
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (showCheckout && clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Complete Your Payment</h1>
            <p className="text-gray-600">Secure checkout powered by Stripe</p>
          </div>

          <StripeProvider clientSecret={clientSecret}>
            <CheckoutForm
              amount={amount}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </StripeProvider>

          <button
            onClick={() => setShowCheckout(false)}
            className="mt-4 text-blue-600 hover:text-blue-800 underline"
          >
            ← Back to payment details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">💳 Stripe Payment Gateway</h1>
          <p className="text-gray-600">Enter your payment details to proceed</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment Information</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount (USD)
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                min="1"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                placeholder="50.00"
              />
            </div>

            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="customerEmail"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                placeholder="Payment for services"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-100 text-red-800 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={createPaymentIntent}
              disabled={isLoading || amount <= 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              {isLoading ? (
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
                  Creating Payment...
                </span>
              ) : (
                `Proceed to Checkout - $${amount.toFixed(2)}`
              )}
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Test Card Numbers:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✅ Success: 4242 4242 4242 4242</li>
              <li>❌ Decline: 4000 0000 0000 0002</li>
              <li>🔐 3D Secure: 4000 0027 6000 3184</li>
              <li className="text-xs text-blue-600 mt-2">Use any future expiry date and any 3-digit CVC</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
