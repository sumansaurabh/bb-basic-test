'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-red-900 border border-red-600 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="text-4xl mr-4">⚠️</div>
                <div>
                  <h2 className="text-2xl font-bold text-red-300">
                    Component Error
                  </h2>
                  <p className="text-red-200">
                    Something went wrong in this component
                  </p>
                </div>
              </div>

              {this.state.error && (
                <div className="mb-4">
                  <h3 className="font-bold text-red-300 mb-2">Error Message:</h3>
                  <pre className="bg-red-950 p-3 rounded text-sm overflow-x-auto text-red-200">
                    {this.state.error.toString()}
                  </pre>
                </div>
              )}

              {this.state.errorInfo && (
                <div className="mb-4">
                  <h3 className="font-bold text-red-300 mb-2">Component Stack:</h3>
                  <pre className="bg-red-950 p-3 rounded text-xs overflow-x-auto text-red-200 max-h-48">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={this.handleReset}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-white transition-colors"
                >
                  🔄 Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-bold text-white transition-colors"
                >
                  ↻ Reload Page
                </button>
              </div>

              <p className="text-red-400 text-sm mt-4">
                This error was caught by the Error Boundary to prevent the entire app from crashing.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
