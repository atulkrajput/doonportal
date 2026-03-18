'use client';

import React from 'react';
import Link from 'next/link';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <div className="text-5xl">⚠️</div>
          <h2 className="mt-4 text-2xl font-semibold text-neutral-900">
            Something went wrong
          </h2>
          <p className="mt-3 max-w-md text-lg text-neutral-600">
            An unexpected error occurred. Please try refreshing the page or
            return to the homepage.
          </p>
          <div className="mt-8 flex gap-4">
            <button
              onClick={() => this.setState({ hasError: false })}
              className="inline-flex items-center rounded-lg border border-brand-300 px-6 py-3 text-base font-medium text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center rounded-lg bg-brand-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Return to Home
            </Link>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
