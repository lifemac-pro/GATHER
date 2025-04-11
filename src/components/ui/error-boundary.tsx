"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "./button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        this.props.fallback ?? (
          <div className="flex min-h-[200px] w-full flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-semibold text-red-600">
              Something went wrong
            </h2>
            <p className="mb-4 text-gray-600">
              {this.state.error?.message ?? "An unexpected error occurred"}
            </p>
            <div className="flex space-x-4">
              <Button
                onClick={this.handleReset}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Try Again
              </Button>
              <Button
                onClick={this.handleReload}
                className="bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                Reload Page
              </Button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
