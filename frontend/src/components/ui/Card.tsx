import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  open?: boolean;
}

export default function Card({ children, open = false, className = '', ...rest }: CardProps) {
  return (
    <div className={`${open ? 'gv-card-open' : 'gv-card'} ${className}`} {...rest}>
      {children}
    </div>
  );
}
