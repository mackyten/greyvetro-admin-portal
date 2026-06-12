interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(14,23,33,.45)', display: 'grid', placeItems: 'center', zIndex: 200 }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: 'var(--gv-shadow-lg)', width: 380, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--gv-line-soft)' }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--gv-ink)' }}>{title}</div>
        </div>
        <div style={{ padding: '14px 20px 18px' }}>
          <p style={{ fontSize: 13, color: 'var(--gv-ink-2)', margin: 0, lineHeight: 1.5 }}>{message}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '0 20px 18px' }}>
          <button
            onClick={onCancel}
            style={{ height: 34, padding: '0 16px', border: '1px solid var(--gv-line)', borderRadius: 'var(--gv-r-ctrl)', fontSize: 13, fontWeight: 600, color: 'var(--gv-ink-2)', background: 'var(--gv-card)', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ height: 34, padding: '0 16px', border: '1px solid var(--gv-bad)', borderRadius: 'var(--gv-r-ctrl)', fontSize: 13, fontWeight: 600, color: '#fff', background: 'var(--gv-bad)', cursor: 'pointer' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
