'use client';

import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 to-black p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">Payment Cancelled</h1>

        <p className="text-gray-300 mb-6">
          Your payment has been cancelled. No charges have been made to your account.
        </p>

        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-300">
            If you experienced any issues or have questions, please contact our support team.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/checkout"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="block w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
