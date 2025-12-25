'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentModal } from '../payment/PaymentModal';

interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Transaction {
  _id: string;
  amount: number;
  type: 'topup' | 'debit' | 'refund';
  description: string;
  status: string;
  createdAt: string;
}

export function ProfileSidebar({ isOpen, onClose }: ProfileSidebarProps) {
  const { user, logout, refreshUser } = useAuth();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadTransactions();
    }
  }, [isOpen, user]);

  const loadTransactions = async () => {
    setIsLoadingTransactions(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/credits/history?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setIsPaymentModalOpen(false);
    await refreshUser();
    await loadTransactions();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-900 border-l border-gray-700 z-50 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Profile</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          {/* User Info */}
          <div className="mb-6 p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-xl font-bold">
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{user?.name || 'User'}</p>
                <p className="text-sm text-gray-400">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Credits Display */}
          <div className="mb-6 p-6 bg-gradient-to-r from-green-900 to-blue-900 rounded-lg border border-green-700">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm text-gray-300">Available Credits</p>
                <p className="text-3xl font-bold text-white">
                  ${user?.credits?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="w-full py-2 bg-green-600 hover:bg-green-700 rounded font-semibold transition-colors"
            >
              Add Credits
            </button>
          </div>

          {/* Pricing Info */}
          <div className="mb-6 p-4 bg-gray-800 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center">
              <span className="mr-2">💵</span>
              Pricing
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Hourly Rate:</span>
                <span className="font-semibold">$0.85/hour</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Daily Rate:</span>
                <span className="font-semibold">$2.00/day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Machine:</span>
                <span className="font-semibold">1 CPU, 2GB RAM</span>
              </div>
            </div>
            <div className="mt-3 p-2 bg-blue-500/20 border border-blue-500 rounded text-xs text-blue-200">
              💡 You&apos;re charged the lower of hourly or daily rate
            </div>
          </div>

          {/* Transaction History */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 flex items-center">
              <span className="mr-2">📊</span>
              Recent Transactions
            </h3>
            {isLoadingTransactions ? (
              <div className="text-center py-4 text-gray-400">Loading...</div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-4 text-gray-400">No transactions yet</div>
            ) : (
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div
                    key={transaction._id}
                    className="p-3 bg-gray-800 rounded flex justify-between items-center"
                  >
                    <div>
                      <p className="text-sm font-medium">{transaction.description}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div
                      className={`font-semibold ${
                        transaction.type === 'topup'
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {transaction.type === 'topup' ? '+' : '-'}$
                      {Math.abs(transaction.amount).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="w-full py-3 bg-red-600 hover:bg-red-700 rounded font-semibold transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}
