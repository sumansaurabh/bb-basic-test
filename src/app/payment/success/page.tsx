'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('session_id');
    setSessionId(id);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Payment Successful! 🎉
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Thank you for your payment. Your transaction has been completed successfully.
          </p>

          {/* Session Details */}
          {sessionId && (
            <div className="bg-gray-700 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-bold mb-2 text-gray-300">Transaction Details</h2>
              <p className="text-sm text-gray-400 break-all">
                Session ID: {sessionId}
              </p>
            </div>
          )}

          {/* Confirmation Message */}
          <div className="bg-blue-900 border border-blue-600 rounded-lg p-6 mb-8">
            <p className="text-blue-200">
              A confirmation email has been sent to your email address with the payment details.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link
              href="/"
              className="block w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all transform hover:scale-105"
            >
              Return to Home
            </Link>
            <Link
              href="/payment"
              className="block w-full py-4 px-6 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
            >
              Make Another Payment
            </Link>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>
            If you have any questions about your payment, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}
