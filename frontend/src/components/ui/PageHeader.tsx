import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  sub?: string;
  action?: ReactNode;
}

export default function PageHeader({ title, sub, action }: PageHeaderProps) {
  return (
    <div className="gv-page-header">
      <div>
        <h1 className="gv-page-title">{title}</h1>
        {sub && <p className="gv-page-sub">{sub}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
