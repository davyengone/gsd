"use client";

import { useState, useTransition } from "react";
import { deleteActionFromBoard } from "./actions";

export function DeleteAction({ id, title }: { id: string; title: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function remove() {
    setError("");
    startTransition(async () => {
      try { await deleteActionFromBoard(id); }
      catch { setError("Could not delete this action. Try again."); }
    });
  }

  return <div className="actions-delete actions-card-controls">
    {confirming ? <div className="actions-delete-confirm">
      <span>Delete “{title}”?</span>
      <button type="button" className="actions-delete-yes" disabled={isPending} onClick={remove}>{isPending ? "Deleting…" : "Delete"}</button>
      <button type="button" disabled={isPending} onClick={() => { setConfirming(false); setError(""); }}>Cancel</button>
    </div> : <button type="button" className="actions-delete-open" onClick={() => setConfirming(true)}>Delete action</button>}
    {error && <p role="alert" className="actions-tag-error">{error}</p>}
  </div>;
}
