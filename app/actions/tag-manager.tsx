"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import type { ActionTag } from "@/lib/actions/store";
import { tagColors, type TagColor } from "@/lib/actions/tag-colors";
import { createTag, deleteTag, updateTag } from "./actions";

const colorLabels: Record<TagColor, string> = { teal: "Teal", blue: "Blue", amber: "Amber", coral: "Coral", violet: "Violet", gray: "Gray" };

function ColorSelect({ value, onChange, label, disabled }: { value: TagColor; onChange: (color: TagColor) => void; label: string; disabled: boolean }) {
  return <select aria-label={label} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value as TagColor)}>{tagColors.map((color) => <option value={color} key={color}>{colorLabels[color]}</option>)}</select>;
}

function TagRow({ tag }: { tag: ActionTag }) {
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      try { await updateTag(tag.name, name, color); }
      catch { setError("Could not save this tag. Check the name and try again."); }
    });
  }

  function remove() {
    setError("");
    startTransition(async () => {
      try { await deleteTag(tag.name); }
      catch { setError("Could not delete this tag. Try again."); }
    });
  }

  return <li className="actions-global-tag-row">
    <form onSubmit={save}>
      <input aria-label={`Name for ${tag.name}`} value={name} required maxLength={32} disabled={isPending} onChange={(event) => setName(event.target.value)} />
      <ColorSelect value={color} onChange={setColor} label={`Color for ${tag.name}`} disabled={isPending} />
      <button type="submit" disabled={isPending || (name === tag.name && color === tag.color)}>Save</button>
    </form>
    <div className="actions-global-tag-meta"><span>{tag.usageCount} {tag.usageCount === 1 ? "action" : "actions"}</span>
      {confirming ? <span className="actions-global-tag-confirm">Remove from every action? <button type="button" disabled={isPending} onClick={remove}>Remove</button><button type="button" disabled={isPending} onClick={() => setConfirming(false)}>Cancel</button></span>
        : <button type="button" disabled={isPending} onClick={() => setConfirming(true)}>Delete tag</button>}
    </div>
    {error && <p className="actions-tag-error" role="alert">{error}</p>}
  </li>;
}

export function TagManager({ tags }: { tags: ActionTag[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState<TagColor>("teal");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      try { await createTag(name, color); setName(""); setColor("teal"); }
      catch { setError("Could not create this tag. The name may already be in use."); }
    });
  }

  return <>
    <button type="button" className="actions-manage-tags-button" onClick={() => dialogRef.current?.showModal()}>Manage tags</button>
    <dialog ref={dialogRef} className="actions-tag-manager" aria-label="Manage tags">
      <header><div><h2>Manage tags</h2><p>Changes apply to every action using a tag.</p></div><button type="button" aria-label="Close tag manager" onClick={() => dialogRef.current?.close()}>×</button></header>
      <form className="actions-new-tag" onSubmit={add}>
        <label>New tag<input value={name} required maxLength={32} placeholder="e.g. Work" disabled={isPending} onChange={(event) => setName(event.target.value)} /></label>
        <ColorSelect value={color} onChange={setColor} label="Color for new tag" disabled={isPending} />
        <button type="submit" disabled={isPending}>{isPending ? "Adding…" : "Add tag"}</button>
      </form>
      {error && <p className="actions-tag-error" role="alert">{error}</p>}
      <ul className="actions-global-tag-list">{tags.map((tag) => <TagRow key={`${tag.name}:${tag.color}`} tag={tag} />)}</ul>
      {!tags.length && <p className="actions-no-tags">No tags yet. Add one to organize your actions.</p>}
    </dialog>
  </>;
}
