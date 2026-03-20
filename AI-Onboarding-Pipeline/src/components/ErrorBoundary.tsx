import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 font-inter">
        <div className="w-full max-w-md rounded-2xl border border-border/50 bg-card/50 px-4 sm:px-8 py-10 text-center backdrop-blur-xl">
          <h1 className="font-outfit text-lg sm:text-xl font-semibold text-foreground">
            Something went wrong
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            An unexpected error occurred. Please refresh the page to try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 min-h-[48px] rounded-full bg-gradient-to-r from-primary to-primary-glow px-6 py-2.5 font-inter text-sm font-medium text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.25)] transition-shadow hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)]"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
