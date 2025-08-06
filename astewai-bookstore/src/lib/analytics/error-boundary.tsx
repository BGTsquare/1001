/**
 * Analytics Error Boundary
 * Prevents analytics failures from breaking the application
 */

'use client';

import React, { Component, ReactNode } from 'react';
import { trackError } from './index';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AnalyticsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Track the error but don't let it propagate
    try {
      trackError(error, {
        component: 'AnalyticsErrorBoundary',
        errorInfo: errorInfo.componentStack,
      });
    } catch (trackingError) {
      console.error('Failed to track analytics error:', trackingError);
    }
  }

  render() {
    if (this.state.hasError) {
      // Return fallback UI or null to hide analytics components
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}