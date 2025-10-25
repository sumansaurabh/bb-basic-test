'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ClientErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error details
    logger.error('Client Error Boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    }, error);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[200px] bg-red-50 border border-red-200 rounded-lg p-6 m-4">
          <div className="flex items-center mb-4">
            <div className="text-red-600 text-2xl mr-3">⚠️</div>
            <h2 className="text-lg font-bold text-red-800">
              Component Error Occurred
            </h2>
          </div>
          
          <div className="text-red-700 mb-4">
            Something went wrong in this component. The error has been logged for investigation.
          </div>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-4">
              <details className="bg-red-100 p-4 rounded border border-red-300">
                <summary className="font-bold text-red-800 cursor-pointer mb-2">
                  Error Details (Development Mode)
                </summary>
                <div className="text-sm font-mono text-red-700 whitespace-pre-wrap">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="mt-1 text-xs overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 text-xs overflow-auto max-h-32">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}
          
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
