'use client';

import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          {/* Cancel Icon */}
          <div className="mb-6">
            <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center mx-auto">
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          {/* Cancel Message */}
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Payment Cancelled
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Your payment was cancelled. No charges have been made to your account.
          </p>

          {/* Info Message */}
          <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-6 mb-8">
            <p className="text-yellow-200">
              If you experienced any issues during checkout, please try again or contact our support team for assistance.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link
              href="/payment"
              className="block w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all transform hover:scale-105"
            >
              Try Again
            </Link>
            <Link
              href="/"
              className="block w-full py-4 px-6 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
            >
              Return to Home
            </Link>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-center">Need Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="font-bold mb-2 text-blue-400">Common Issues</h3>
              <ul className="text-gray-300 space-y-1">
                <li>• Card declined</li>
                <li>• Insufficient funds</li>
                <li>• Incorrect card details</li>
              </ul>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="font-bold mb-2 text-green-400">What to Try</h3>
              <ul className="text-gray-300 space-y-1">
                <li>• Check card information</li>
                <li>• Try a different card</li>
                <li>• Contact your bank</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
