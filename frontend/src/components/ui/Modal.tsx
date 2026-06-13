import { ReactNode } from 'react';

type Size = 'sm' | 'md' | 'lg';

interface ModalProps {
  children: ReactNode;
  size?: Size;
  onClose?: () => void;
}

interface HeadProps { title: string; onClose?: () => void; }
interface BodyProps { children: ReactNode; }
interface FootProps { children: ReactNode; }

export function ModalHead({ title, onClose }: HeadProps) {
  return (
    <div className="gv-modal-head">
      <span className="gv-modal-title">{title}</span>
      {onClose && (
        <button className="gv-btn-close" onClick={onClose}>✕</button>
      )}
    </div>
  );
}

export function ModalBody({ children }: BodyProps) {
  return <div className="gv-modal-body">{children}</div>;
}

export function ModalFoot({ children }: FootProps) {
  return <div className="gv-modal-foot">{children}</div>;
}

export default function Modal({ children, size = 'md', onClose }: ModalProps) {
  const sizeClass = size === 'sm' ? 'gv-modal-sm' : size === 'lg' ? 'gv-modal-lg' : '';
  return (
    <div
      className="gv-overlay"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className={`gv-modal ${sizeClass}`}>
        {children}
      </div>
    </div>
  );
}
