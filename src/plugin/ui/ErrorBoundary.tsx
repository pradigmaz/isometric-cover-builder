import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Figma Plugin React Error]', error, errorInfo);
    this.setState({ error, errorInfo });

    try {
      fetch('http://127.0.0.1:9876/plugin-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'react-error',
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          time: Date.now(),
        }),
      }).catch(() => {});
    } catch {
      // Ignore network failure for debug bridge
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-900 text-stone-200 p-4 flex flex-col justify-center items-center font-sans">
          <div className="w-full max-w-sm bg-stone-800 border border-red-500/40 rounded-xl p-4 shadow-xl">
            <div className="flex items-center gap-2 mb-3 text-red-400 font-semibold text-sm">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Ошибка плагина</span>
            </div>
            <p className="text-xs text-stone-300 mb-2">
              Произошла ошибка при отрисовке интерфейса:
            </p>
            <div className="bg-stone-950/70 border border-stone-700/50 rounded p-2 text-[11px] font-mono text-red-300 max-h-36 overflow-auto mb-3 whitespace-pre-wrap select-text">
              {this.state.error?.message || 'Неизвестная ошибка'}
              {this.state.error?.stack && (
                <div className="text-[10px] text-stone-400 mt-2 opacity-80">
                  {this.state.error.stack}
                </div>
              )}
            </div>
            <button
              onClick={this.handleReset}
              className="w-full py-2 px-3 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Перезагрузить плагин
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
