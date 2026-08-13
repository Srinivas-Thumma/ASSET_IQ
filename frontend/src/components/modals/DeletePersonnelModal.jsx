import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';

export const DeletePersonnelModal = ({
  isOpen,
  onClose,
  personnel,
  onConfirm,
  isDeleting = false
}) => {
  if (!personnel) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Personnel Account"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            icon={Trash2}
            onClick={onConfirm}
            loading={isDeleting}
          >
            Confirm Delete
          </Button>
        </>
      }
    >
      <div className="space-y-3.5 text-xs">
        <div className="flex items-start gap-3 p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800/60">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-rose-900 dark:text-rose-200">
              Permanent Account Offboarding
            </p>
            <p className="text-rose-700 dark:text-rose-300/90 leading-relaxed">
              Are you sure you want to delete <strong>{personnel.fullName}</strong> ({personnel.email})?
              This will immediately revoke their platform credentials, delete their profile, and clear routing mappings.
            </p>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Note: If this employee holds assigned hardware custody or has open claimed support tickets, you will need to reassign those items before deletion can proceed.
        </p>
      </div>
    </Modal>
  );
};

export default DeletePersonnelModal;
