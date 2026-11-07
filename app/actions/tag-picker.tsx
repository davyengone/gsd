"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import type { ActionTag } from "@/lib/actions/store";
import { setActionTags } from "./actions";

export function TagPicker({ id, selected, available }: { id: string; selected: string[]; available: ActionTag[] }) {
  const canonical = (name: string) => available.find((tag) => tag.name.toLocaleLowerCase("en") === name.toLocaleLowerCase("en"))?.name ?? name;
  const current = selected.map(canonical);
  const [draft, setDraft] = useState(current);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const colors = new Map(available.map((tag) => [tag.name, tag.color]));

  function toggle(name: string) {
    setDraft((current) => current.includes(name) ? current.filter((tag) => tag !== name) : current.length < 8 ? [...current, name] : current);
    setError("");
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        await setActionTags(id, draft);
        if (detailsRef.current) detailsRef.current.open = false;
      } catch {
        setError("Could not save tags. Try again.");
      }
    });
  }

  return <div className="actions-tag-control actions-card-controls">
    {current.length > 0 && <div className="actions-tags">{current.map((name) => <span className={`actions-tag-color-${colors.get(name) ?? "teal"}`} key={name}>{name}</span>)}</div>}
    <details ref={detailsRef} className="actions-tag-picker">
      <summary onClick={() => { if (!detailsRef.current?.open) { setDraft(current); setError(""); } }}>{current.length ? "Change tags" : "Assign tags"}</summary>
      <form onSubmit={save}>
        {available.length ? available.map((tag) => <label key={tag.name} className="actions-tag-option">
          <input type="checkbox" checked={draft.includes(tag.name)} disabled={isPending || (!draft.includes(tag.name) && draft.length >= 8)} onChange={() => toggle(tag.name)} />
          <span className={`actions-tag-chip actions-tag-color-${tag.color}`}>{tag.name}</span>
        </label>) : <p>Create a tag in Manage tags first.</p>}
        {error && <p className="actions-tag-error" role="alert">{error}</p>}
        <button type="submit" disabled={isPending}>{isPending ? "Saving…" : "Save tags"}</button>
      </form>
    </details>
  </div>;
}
