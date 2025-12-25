'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SandboxStatus {
  isRunning: boolean;
  sandbox: {
    id: string;
    startTime: string;
    currentCost: number;
    duration: string;
    billingRate: {
      hourly: number;
      daily: number;
    };
  } | null;
}

export function SandboxControl() {
  const { user, token, refreshUser } = useAuth();
  const [status, setStatus] = useState<SandboxStatus>({ isRunning: false, sandbox: null });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      loadStatus();
      const interval = setInterval(loadStatus, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/sandbox/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to load sandbox status:', error);
    }
  };

  const handleStart = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/sandbox/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start sandbox');
      }

      await loadStatus();
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start sandbox');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/sandbox/stop', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to stop sandbox');
      }

      const data = await response.json();
      await loadStatus();
      await refreshUser();
      
      // Show billing summary
      alert(`Sandbox stopped!\nTotal cost: $${data.billing.totalCost}\nRemaining credits: $${data.billing.remainingCredits}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop sandbox');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <span className="mr-2">🖥️</span>
        Sandbox Control
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      {status.isRunning && status.sandbox ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-900/30 border border-green-700 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-400 font-semibold">● Running</span>
              <span className="text-sm text-gray-400">{status.sandbox.duration}</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              ${status.sandbox.currentCost.toFixed(4)}
            </div>
            <div className="text-xs text-gray-400">
              Current charges (updates every 5s)
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-gray-900 rounded">
              <p className="text-gray-400">Hourly Rate</p>
              <p className="font-semibold">${status.sandbox.billingRate.hourly}/hr</p>
            </div>
            <div className="p-3 bg-gray-900 rounded">
              <p className="text-gray-400">Daily Rate</p>
              <p className="font-semibold">${status.sandbox.billingRate.daily}/day</p>
            </div>
          </div>

          <button
            onClick={handleStop}
            disabled={isLoading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded font-semibold transition-colors"
          >
            {isLoading ? 'Stopping...' : 'Stop Sandbox'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-gray-900 border border-gray-700 rounded text-center">
            <p className="text-gray-400 mb-2">Sandbox is not running</p>
            <p className="text-sm text-gray-500">
              Start a sandbox to begin using compute resources
            </p>
          </div>

          <div className="p-3 bg-blue-500/20 border border-blue-500 rounded text-sm text-blue-200">
            <p className="font-semibold mb-1">💡 Billing Info:</p>
            <p>• $0.85/hour or $2/day (whichever is lower)</p>
            <p>• 1 CPU, 2GB RAM, 8GB Storage</p>
            <p>• Your credits: ${user.credits.toFixed(2)}</p>
          </div>

          <button
            onClick={handleStart}
            disabled={isLoading || user.credits < 0.1}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded font-semibold transition-colors"
          >
            {isLoading ? 'Starting...' : 'Start Sandbox'}
          </button>

          {user.credits < 0.1 && (
            <p className="text-sm text-red-400 text-center">
              Insufficient credits. Please add credits to start.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
