import { ReactNode, HTMLAttributes } from 'react';

interface TableProps { children: ReactNode; }
interface ThProps extends HTMLAttributes<HTMLTableCellElement> { children: ReactNode; }
interface TdProps extends HTMLAttributes<HTMLTableCellElement> { children?: ReactNode; muted?: boolean; }
interface TrProps { children: ReactNode; onClick?: () => void; }

export function Th({ children, ...rest }: ThProps) {
  return <th className="gv-th" {...rest}>{children}</th>;
}

export function Td({ children, muted = false, className = '', ...rest }: TdProps & { className?: string }) {
  return (
    <td className={`gv-td ${muted ? 'gv-muted' : ''} ${className}`} {...rest}>
      {children}
    </td>
  );
}

export function Tr({ children, onClick }: TrProps) {
  return (
    <tr className="gv-tr" onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      {children}
    </tr>
  );
}

export default function Table({ children }: TableProps) {
  return <table className="gv-table">{children}</table>;
}
