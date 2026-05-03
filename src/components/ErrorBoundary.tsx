import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertCircle, RefreshCcw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  // @ts-ignore
  public props: Props;
  // @ts-ignore
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  handleReload = () => {
    window.location.reload();
  };

  public render() {
    const { hasError, error } = this.state as State;
    if (hasError) {
      return (
        <div className="min-h-screen bg-rose-50 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-rose-100 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm">
            <AlertCircle className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-rose-900 mb-4 italic">Something went wrong</h2>
          <p className="text-rose-700/70 font-bold mb-8 max-w-xs uppercase text-[10px] tracking-widest leading-relaxed">
            The application encountered an unexpected error. This might be due to corrupted local data.
          </p>
          
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button 
              onClick={this.handleReload}
              className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-200 flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Try Reloading
            </button>
            <button 
              onClick={this.handleReset}
              className="w-full py-4 bg-white text-rose-500 border-2 border-rose-100 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Reset & Clear Data
            </button>
          </div>
          
          <details className="mt-12 text-left bg-white/50 p-4 rounded-2xl w-full max-w-sm border border-rose-100">
            <summary className="text-[10px] font-black uppercase text-rose-400 cursor-pointer mb-2">Error Details</summary>
            <p className="text-[10px] font-mono text-rose-600 break-all leading-tight opacity-70">
              {error?.toString()}
            </p>
          </details>
        </div>
      );
    }

    return (this.props as Props).children;
  }
}
