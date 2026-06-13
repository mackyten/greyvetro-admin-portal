import { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'ghost-danger' | 'icon';
type Size    = 'xs' | 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export default function Button({ variant = 'secondary', size = 'md', className = '', children, ...rest }: ButtonProps) {
  const classes = [
    variant === 'icon' ? 'gv-btn-icon' : 'gv-btn',
    variant !== 'icon' ? `gv-btn-${variant}` : '',
    size !== 'md' ? `gv-btn-${size}` : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
