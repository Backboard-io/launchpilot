"use client";

import { useState } from "react";

export function ConfirmDialog({
  label,
  onConfirm
}: {
  label: string;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-md border border-slate-300 px-3 py-1 text-xs">
        {label}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-4">
            <h4 className="text-sm font-medium">Confirm action</h4>
            <p className="mt-1 text-sm text-slate-600">This action may trigger a sensitive workflow.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded-md border px-3 py-1 text-xs" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                className="rounded-md bg-brand-600 px-3 py-1 text-xs text-white"
                onClick={() => {
                  onConfirm();
                  setOpen(false);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
