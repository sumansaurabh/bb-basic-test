'use client';

import { useEffect, useState } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [errorDetails, setErrorDetails] = useState<{
    message: string;
    stack?: string;
    timestamp: string;
  } | null>(null);

  useEffect(() => {
    // Log error with structured format
    const details = {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    };

    console.error('Application error:', JSON.stringify(details, null, 2));
    
    setErrorDetails({
      message: error.message,
      stack: error.stack,
      timestamp: details.timestamp,
    });

    // In production, you would send this to an error tracking service
    // Example: Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // sendToErrorTracking(details);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="text-6xl mb-4">💥</div>
          <h1 className="text-4xl font-bold mb-4 text-red-500">
            Load Test Error
          </h1>
          <p className="text-xl text-gray-400 mb-6">
            The heavy load caused a system error
          </p>
        </div>
        
        <div className="bg-red-900 border border-red-600 rounded-lg p-4 mb-6">
          <h2 className="font-bold text-red-300 mb-2">Error Details:</h2>
          <p className="text-red-200 text-sm font-mono break-words">
            {error.message}
          </p>
          {error.digest && (
            <p className="text-red-400 text-xs mt-2">
              Error ID: {error.digest}
            </p>
          )}
          {errorDetails && (
            <p className="text-red-400 text-xs mt-2">
              Occurred at: {new Date(errorDetails.timestamp).toLocaleString()}
            </p>
          )}
          {process.env.NODE_ENV === 'development' && errorDetails?.stack && (
            <details className="mt-4">
              <summary className="cursor-pointer text-red-300 text-sm hover:text-red-200">
                Stack Trace (Development Only)
              </summary>
              <pre className="mt-2 text-xs text-red-200 overflow-x-auto bg-red-950 p-2 rounded">
                {errorDetails.stack}
              </pre>
            </details>
          )}
        </div>
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-white transition-colors"
          >
            🔄 Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-bold text-white transition-colors"
          >
            🏠 Go Home
          </button>
        </div>
        
        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <h3 className="font-bold text-gray-300 mb-2">What happened?</h3>
          <p className="text-gray-400 text-sm">
            An unexpected error occurred while processing your request. 
            This could be due to heavy load, network issues, or a temporary service disruption.
          </p>
          {process.env.NODE_ENV === 'production' && (
            <p className="text-gray-500 text-xs mt-2">
              Our team has been notified and is investigating the issue.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
