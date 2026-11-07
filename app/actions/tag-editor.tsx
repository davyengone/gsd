"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { tagColors, type TagColor } from "@/lib/actions/tag-colors";
import { updateActionTags } from "./actions";

type DraftTag = { name: string; color: TagColor };
const colorLabels: Record<TagColor, string> = { teal: "Teal", blue: "Blue", amber: "Amber", coral: "Coral", violet: "Violet", gray: "Gray" };

export function TagEditor({ id, tags, colors }: { id: string; tags: string[]; colors: Record<string, TagColor> }) {
  const initial = () => tags.map((name) => ({ name, color: colors[name] ?? "teal" }));
  const [draft, setDraft] = useState<DraftTag[]>(initial);
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  function addTag() {
    const name = newTag.trim();
    if (!name) return;
    if (draft.length >= 8) { setError("Use up to 8 tags."); return; }
    if (name.length > 32) { setError("Tags can have up to 32 characters."); return; }
    if (draft.some((tag) => tag.name.toLowerCase() === name.toLowerCase())) { setError("That tag is already on this action."); return; }
    setDraft([...draft, { name, color: "teal" }]);
    setNewTag("");
    setError("");
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const pending = newTag.trim();
    const next = [...draft, ...(pending ? [{ name: pending, color: "teal" as const }] : [])].map((tag) => ({ ...tag, name: tag.name.trim() }));
    if (next.length > 8) { setError("Use up to 8 tags."); return; }
    if (next.some((tag) => !tag.name || tag.name.length > 32)) { setError("Each tag needs 1 to 32 characters."); return; }
    if (new Set(next.map((tag) => tag.name.toLowerCase())).size !== next.length) { setError("Each tag must be unique."); return; }
    setError("");
    startTransition(async () => {
      try {
        await updateActionTags(id, next.map((tag) => tag.name), Object.fromEntries(next.map((tag) => [tag.name, tag.color])));
        if (detailsRef.current) detailsRef.current.open = false;
      } catch {
        setError("Could not save tags. Try again.");
      }
    });
  }

  return <div className="actions-tag-control actions-card-controls">
    {tags.length > 0 && <div className="actions-tags">{tags.map((tag, index) => <span className={`actions-tag-color-${colors[tag] ?? "teal"}`} key={`${tag}-${index}`}>{tag}</span>)}</div>}
    <details ref={detailsRef} className="actions-tag-editor">
      <summary onClick={() => { if (!detailsRef.current?.open) { setDraft(initial()); setNewTag(""); setError(""); } }}>{tags.length ? "Edit tags" : "Add tags"}</summary>
      <form onSubmit={save}>
        {draft.map((tag, index) => <div className="actions-tag-row" key={index}>
          <input aria-label={`Tag ${index + 1}`} value={tag.name} maxLength={32} disabled={isPending} onChange={(event) => setDraft((current) => current.map((value, position) => position === index ? { ...value, name: event.target.value } : value))} />
          <select aria-label={`Color for ${tag.name || `tag ${index + 1}`}`} value={tag.color} disabled={isPending} onChange={(event) => setDraft((current) => current.map((value, position) => position === index ? { ...value, color: event.target.value as TagColor } : value))}>{tagColors.map((color) => <option key={color} value={color}>{colorLabels[color]}</option>)}</select>
          <button type="button" className="actions-tag-remove" aria-label={`Remove ${tag.name || `tag ${index + 1}`}`} disabled={isPending} onClick={() => setDraft((current) => current.filter((_, position) => position !== index))}>×</button>
        </div>)}
        <div className="actions-tag-row">
          <input aria-label="New tag" placeholder="New tag" value={newTag} maxLength={32} disabled={isPending || draft.length >= 8} onChange={(event) => setNewTag(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(); } }} />
          <button type="button" disabled={isPending || !newTag.trim() || draft.length >= 8} onClick={addTag}>Add</button>
        </div>
        {error && <p className="actions-tag-error" role="alert">{error}</p>}
        <button type="submit" disabled={isPending}>{isPending ? "Saving…" : "Save tags"}</button>
      </form>
    </details>
  </div>;
}
