import React from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

// Reusable destructive-action confirm — replaces the browser's native confirm()
// so deletes/revokes match the app's dark surface instead of a jarring OS dialog.
// Backdrop click and the Cancel button both dismiss (disabled while busy).
export default function ConfirmDialog({
  open, title, message, onConfirm, onCancel, busy,
  confirmLabel = "Delete", icon: Icon = Trash2,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={busy ? undefined : onCancel}>
      <div className="card w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <div className="w-11 h-11 rounded-xl grid place-items-center mb-4"
          style={{ backgroundColor: "rgb(var(--danger) / 0.12)", color: "rgb(var(--danger))" }}>
          <AlertTriangle size={20} />
        </div>
        <h3 className="font-bold text-content text-lg">{title}</h3>
        <p className="text-sm text-muted mt-1.5 leading-relaxed">{message}</p>
        <div className="flex gap-3 pt-5">
          <button type="button" className="btn-ghost flex-1" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="button" className="btn-brand flex-1" onClick={onConfirm} disabled={busy}
            style={{ backgroundImage: "none", backgroundColor: "rgb(var(--danger))" }}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <><Icon size={16} /> {confirmLabel}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
