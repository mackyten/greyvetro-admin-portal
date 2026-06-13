import { ReactNode } from 'react';

type Variant = 'green' | 'red' | 'yellow' | 'gray' | 'brand' | 'indigo';

interface BadgeProps {
  variant?: Variant;
  children: ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export default function Badge({ variant = 'gray', children, style, className = '' }: BadgeProps) {
  return (
    <span className={`gv-badge gv-badge-${variant} ${className}`} style={style}>
      {children}
    </span>
  );
}
