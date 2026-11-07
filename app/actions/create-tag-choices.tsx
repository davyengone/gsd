"use client";

import { useState } from "react";
import type { ActionTag } from "@/lib/actions/store";

export function CreateTagChoices({ tags }: { tags: ActionTag[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  return <fieldset className="actions-create-tags"><legend>Tags (up to 8)</legend>
    {tags.length ? tags.map((tag) => <label key={tag.name}><input type="checkbox" name="tags" value={tag.name} checked={selected.includes(tag.name)} disabled={!selected.includes(tag.name) && selected.length >= 8} onChange={() => setSelected((current) => current.includes(tag.name) ? current.filter((name) => name !== tag.name) : [...current, tag.name])} /><span className={`actions-tag-chip actions-tag-color-${tag.color}`}>{tag.name}</span></label>) : <small>Add tags in Manage tags first.</small>}
  </fieldset>;
}
