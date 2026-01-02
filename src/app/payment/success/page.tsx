'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      // Optionally fetch session details
      fetch(`/api/checkout-session?session_id=${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          setSession(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching session:', err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 to-black p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-white"
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
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">Payment Successful!</h1>

        <p className="text-gray-300 mb-6">
          Thank you for your payment. Your transaction has been completed successfully.
        </p>

        {sessionId && (
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400 mb-1">Session ID:</p>
            <p className="text-xs text-gray-300 font-mono break-all">{sessionId}</p>
          </div>
        )}

        {loading && (
          <div className="text-gray-400 mb-6">Loading payment details...</div>
        )}

        {session && (
          <div className="bg-gray-700 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-lg font-semibold text-white mb-3">Payment Details</h3>
            {session.amount_total && (
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Amount:</span>
                <span className="text-white font-semibold">
                  ${(session.amount_total / 100).toFixed(2)}
                </span>
              </div>
            )}
            {session.customer_details?.email && (
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Email:</span>
                <span className="text-white">{session.customer_details.email}</span>
              </div>
            )}
            {session.payment_status && (
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-green-400 capitalize">{session.payment_status}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
          >
            Return to Home
          </Link>
          <p className="text-gray-400 text-sm">
            You will receive a confirmation email shortly.
          </p>
        </div>
      </div>
    </div>
  );
}
