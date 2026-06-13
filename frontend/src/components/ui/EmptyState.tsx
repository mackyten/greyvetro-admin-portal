import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  message?: string;
}

export default function EmptyState({ icon, title, message }: EmptyStateProps) {
  return (
    <div className="gv-empty">
      <div className="gv-empty-icon">{icon}</div>
      <p className="gv-empty-title">{title}</p>
      {message && <p className="gv-empty-message">{message}</p>}
    </div>
  );
}
