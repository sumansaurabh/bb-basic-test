'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Load test page error:', error);
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
          <p className="text-red-200 text-sm font-mono">
            {error.message}
          </p>
          {error.digest && (
            <p className="text-red-400 text-xs mt-2">
              Digest: {error.digest}
            </p>
          )}
        </div>
        
        <button
          onClick={reset}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-white transition-colors"
        >
          🔄 Try Again
        </button>
        
        <p className="text-gray-500 text-sm mt-4">
          This is expected behavior during extreme load testing
        </p>
      </div>
    </div>
  );
}
