'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const paymentIntentId = searchParams.get('payment_intent');
    
    if (paymentIntentId) {
      fetchPaymentStatus(paymentIntentId);
    } else {
      setIsLoading(false);
    }
  }, [searchParams]);

  const fetchPaymentStatus = async (paymentIntentId: string) => {
    try {
      const response = await fetch(
        `/api/stripe/payment-status?paymentIntentId=${paymentIntentId}`
      );
      const data = await response.json();
      
      if (data.success) {
        setPaymentDetails(data.payment);
      }
    } catch (error) {
      console.error('Error fetching payment status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          {isLoading ? (
            <div className="py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading payment details...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-12 h-12 text-green-600"
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
                <h1 className="text-4xl font-bold text-gray-800 mb-2">
                  Payment Successful!
                </h1>
                <p className="text-gray-600">
                  Thank you for your payment. Your transaction has been completed successfully.
                </p>
              </div>

              {paymentDetails && (
                <div className="bg-gray-50 p-6 rounded-lg mb-6 text-left">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Details</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-semibold text-gray-800">
                        ${paymentDetails.amount.toFixed(2)} {paymentDetails.currency.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-semibold text-green-600 capitalize">
                        {paymentDetails.status}
                      </span>
                    </div>
                    {paymentDetails.customerName && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Customer:</span>
                        <span className="font-semibold text-gray-800">
                          {paymentDetails.customerName}
                        </span>
                      </div>
                    )}
                    {paymentDetails.customerEmail && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-semibold text-gray-800">
                          {paymentDetails.customerEmail}
                        </span>
                      </div>
                    )}
                    {paymentDetails.description && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Description:</span>
                        <span className="font-semibold text-gray-800">
                          {paymentDetails.description}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="font-mono text-sm text-gray-800">
                        {paymentDetails.stripePaymentIntentId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-semibold text-gray-800">
                        {new Date(paymentDetails.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  A confirmation email has been sent to your email address.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/payment"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    Make Another Payment
                  </Link>
                  <Link
                    href="/"
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Need help? Contact our support team</p>
        </div>
      </div>
    </div>
  );
}
