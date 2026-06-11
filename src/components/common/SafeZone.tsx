import * as React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface SafeZoneProps {
  children: React.ReactNode;
  name?: string;
}

interface SafeZoneState {
  hasError: boolean;
  error: Error | null;
}

export class SafeZone extends React.Component<SafeZoneProps, SafeZoneState> {
  constructor(props: SafeZoneProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): SafeZoneState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error in SafeZone [${(this.props as any).name || 'Unknown'}]:`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const state = this.state as SafeZoneState;
    const props = this.props as SafeZoneProps;
    
    if (state.hasError) {
      return (
        <div className="p-6 bg-rose-50 border-2 border-rose-100 rounded-[2rem] text-rose-800 my-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
             <div className="w-10 h-10 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-100">
                <AlertTriangle className="w-5 h-5 text-white" />
             </div>
             <div>
                <h4 className="text-sm font-black uppercase tracking-widest italic">Wait, something went wrong here</h4>
                <p className="text-[10px] font-bold opacity-60 uppercase">Section: {props.name || 'Component-Level Error'}</p>
             </div>
          </div>
          
          <div className="p-4 bg-white/50 rounded-2xl border border-rose-100 mb-4">
             <p className="text-[11px] font-mono font-bold leading-relaxed break-words">
                {state.error?.message || 'An unexpected error occurred in this step.'}
             </p>
          </div>

          <button 
            onClick={this.handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-2xl text-xs font-bold uppercase tracking-wider active:scale-95 transition-all shadow-md shadow-rose-100"
          >
            <RefreshCcw className="w-4 h-4" />
            Try Fixing this Step
          </button>
          
          <p className="mt-4 text-[10px] font-bold italic opacity-40 uppercase tracking-normal">
            * Rest of the app is still running smoothly. Only this step is paused.
          </p>
        </div>
      );
    }

    return props.children;
  }
}
