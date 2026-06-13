import { CSSProperties } from 'react';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
  className?: string;
  style?: CSSProperties;
}

export default function ErrorBanner({ message, onDismiss, className = '', style }: ErrorBannerProps) {
  return (
    <div className={`gv-error-banner ${className}`} style={style}>
      {message}
      <button className="gv-btn-close" onClick={onDismiss} style={{ fontSize: 14, color: 'var(--gv-bad)' }}>✕</button>
    </div>
  );
}
