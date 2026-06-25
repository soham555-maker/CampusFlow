"use client";

import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} className="max-w-sm">
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={16} className="text-red-400" />
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{description}</p>
        </div>
        <div className="flex gap-3 pt-1">
          <Button variant="ghost" onClick={onClose} className="flex-1" disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading} className="flex-1">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
