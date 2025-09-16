import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">發生錯誤</h1>
            <p className="text-gray-400 mb-6">
              應用程式遇到了問題。這可能是因為 Tauri 後端服務未運行。
            </p>
            <div className="space-y-4">
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary flex items-center gap-2 mx-auto"
              >
                <RefreshCw size={16} />
                重新載入
              </button>
              <details className="text-left bg-gray-900 rounded-lg p-4">
                <summary className="cursor-pointer text-gray-300 font-medium">
                  錯誤詳情
                </summary>
                <pre className="text-xs text-gray-500 mt-2 overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}