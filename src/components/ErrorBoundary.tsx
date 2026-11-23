import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Une erreur inattendue est survenue.',
    };
  }

  handleReload = () => {
    this.setState({ hasError: false, message: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#E6DFD3] flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#F7F3EB] border border-[#E8E0D2] p-8 shadow-xl text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FDE8D3] text-[#B45309]">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h1 className="font-display text-xl font-bold text-[#1D2A22]">
              Oups, petit imprévu technique
            </h1>
            <p className="mt-2 text-sm text-[#5E6B62] leading-relaxed">
              Tes données locales restent intactes sur ton appareil. Recharge simplement
              l&apos;application pour reprendre.
            </p>
            {this.state.message && (
              <p className="mt-3 rounded-xl bg-white/80 border border-[#E8E0D2] px-3 py-2 text-xs text-[#5E6B62] font-mono break-words">
                {this.state.message}
              </p>
            )}
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[#2B4233] px-5 py-3 text-sm font-semibold text-white hover:bg-[#203327] transition-colors cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              Recharger Career Radar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
