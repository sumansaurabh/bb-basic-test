'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from './auth/LoginForm';
import { SignupForm } from './auth/SignupForm';
import { ProfileSidebar } from './profile/ProfileSidebar';
import { SandboxControl } from './sandbox/SandboxControl';

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [showAuth, setShowAuth] = useState<'login' | 'signup' | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {showAuth === 'signup' ? (
            <SignupForm
              onSuccess={() => setShowAuth(null)}
              onSwitchToLogin={() => setShowAuth('login')}
            />
          ) : (
            <LoginForm
              onSuccess={() => setShowAuth(null)}
              onSwitchToSignup={() => setShowAuth('signup')}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 bg-gray-900 border-b border-gray-700 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Sandbox Platform</h1>
            <div className="px-3 py-1 bg-green-900/30 border border-green-700 rounded text-sm">
              💰 ${user.credits.toFixed(2)}
            </div>
          </div>
          <button
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold">
              {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
            </div>
            <span className="hidden sm:inline">{user.name || 'Profile'}</span>
          </button>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="pt-16 flex">
        {/* Sidebar for Sandbox Control */}
        <div className="hidden lg:block w-80 fixed left-0 top-16 bottom-0 bg-gray-900 border-r border-gray-700 overflow-y-auto p-4">
          <SandboxControl />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-80">
          {children}
        </div>

        {/* Mobile Sandbox Control - Fixed Bottom */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4 z-20">
          <SandboxControl />
        </div>
      </div>

      {/* Profile Sidebar */}
      <ProfileSidebar isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
}
