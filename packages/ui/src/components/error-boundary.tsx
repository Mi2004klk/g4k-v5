"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "./button"

interface Props {
  children?: ReactNode
  fallbackTitle?: string
  name?: string
  onRetry?: () => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `ErrorBoundary caught an error in ${this.props.name || "Widget"}:`,
      error,
      errorInfo
    )
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined })
    if (this.props.onRetry) {
      this.props.onRetry()
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center">
          <AlertTriangle className="mb-2 h-8 w-8 text-destructive" />
          <h4 className="text-sm font-semibold text-destructive">
            {this.props.fallbackTitle || "Something went wrong in this section"}
          </h4>
          <p className="mt-1 max-w-xs text-xs text-destructive/80">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleReset}
            className="mt-4 gap-1.5 text-xs text-destructive hover:bg-destructive/20"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
