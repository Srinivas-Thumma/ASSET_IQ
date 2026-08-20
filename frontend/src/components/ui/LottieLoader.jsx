import React, { Component, useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Loader2 } from 'lucide-react';

class LottieErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('Lottie player error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const LottieLoader = ({
  src = '/Loading 40 _ Paperplane.lottie',
  loop = true,
  autoplay = true,
  className = 'w-40 h-40',
  message = 'Loading...',
  fullPage = false
}) => {
  const [loadError, setLoadError] = useState(false);

  const fallbackSpinner = (
    <div className="w-full h-full flex flex-col items-center justify-center space-y-2">
      <Loader2 className="w-10 h-10 text-purple-600 dark:text-purple-400 animate-spin" />
    </div>
  );

  const loaderContent = (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className={className}>
        {loadError ? (
          fallbackSpinner
        ) : (
          <LottieErrorBoundary fallback={fallbackSpinner}>
            <DotLottieReact
              src={src}
              loop={loop}
              autoplay={autoplay}
              onError={() => setLoadError(true)}
            />
          </LottieErrorBoundary>
        )}
      </div>
      {message && (
        <p className="text-xs font-bold tracking-wide text-purple-600 dark:text-purple-400 uppercase tracking-widest mt-2 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center w-full">
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
};

export default LottieLoader;
