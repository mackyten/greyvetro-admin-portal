import Modal, { ModalHead, ModalBody, ModalFoot } from './ui/Modal';
import Button from './ui/Button';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <Modal size="sm" onClose={onCancel}>
      <ModalHead title={title} onClose={onCancel} />
      <ModalBody>
        <p style={{ fontSize: 13, color: 'var(--gv-ink-2)', margin: 0, lineHeight: 1.5 }}>{message}</p>
      </ModalBody>
      <ModalFoot>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
      </ModalFoot>
    </Modal>
  );
}
