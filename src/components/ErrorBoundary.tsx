import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full glass-panel rounded-2xl p-6 border-2 border-red-500/50 shadow-2xl text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3 animate-bounce" />
            <h2 className="text-xl font-serif font-black text-white mb-2">
              Game Display Error
            </h2>
            <p className="text-xs text-gray-300 mb-4 leading-relaxed">
              An unexpected visual error occurred on the board. The error was
              caught safely without crashing the app.
            </p>

            {this.state.error && (
              <div className="p-3 bg-black/60 rounded-xl border border-white/10 text-left font-mono text-[10px] text-red-300 mb-4 overflow-x-auto max-h-32">
                <p className="font-bold">{this.state.error.toString()}</p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-gray-400 mt-1 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-gradient-to-r from-amber-500 via-casino-gold to-yellow-400 text-black font-bold text-xs rounded-xl shadow-gold-glow hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Recover Game
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
