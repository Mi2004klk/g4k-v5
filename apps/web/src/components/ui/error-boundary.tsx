"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./button";

interface Props {
  children?: ReactNode;
  fallbackTitle?: string;
  name?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Widget Error Boundary caught an error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20 text-center min-h-[160px]">
          <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
          <h4 className="text-sm font-semibold text-red-900 dark:text-red-300">
            {this.props.fallbackTitle || "Something went wrong in this section"}
          </h4>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1 max-w-xs">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleReset}
            className="mt-4 gap-1.5 text-xs border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundary = WidgetErrorBoundary;
