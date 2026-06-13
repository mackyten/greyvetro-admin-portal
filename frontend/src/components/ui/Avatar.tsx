import { CSSProperties } from 'react';

type Size  = 'xs' | 'sm' | 'md' | 'lg';
type Shape = 'circle' | 'rounded';

interface AvatarProps {
  name: string;
  size?: Size;
  shape?: Shape;
  style?: CSSProperties;
}

export default function Avatar({ name, size = 'sm', shape = 'circle', style }: AvatarProps) {
  const initial = name.trim()[0]?.toUpperCase() ?? '?';
  return (
    <div className={`gv-avatar gv-avatar-${shape} gv-avatar-${size}`} style={style}>
      {initial}
    </div>
  );
}
