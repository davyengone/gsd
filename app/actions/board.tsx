"use client";

import { useEffect, useRef, useState, useTransition, type DragEvent, type KeyboardEvent, type PointerEvent } from "react";
import type { ActionItem, ActionStatus } from "@/lib/actions/store";
import { moveActionToLane, updateActionFromForm } from "./actions";

const statuses: ActionStatus[] = ["ideas", "planned", "in_progress", "done"];
const labels: Record<ActionStatus, string> = {
  ideas: "Ideas", planned: "Planned", in_progress: "In progress", done: "Done",
};

type Dragging = { id: string; target: ActionStatus };
type TouchPosition = { x: number; y: number };

export function ActionsBoard({ items, today }: { items: ActionItem[]; today: string }) {
  const [dragging, setDragging] = useState<Dragging | null>(null);
  const [touchPosition, setTouchPosition] = useState<TouchPosition | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const touchRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  function laneAt(x: number, y: number): ActionStatus | null {
    const element = document.elementFromPoint(x, y);
    const lane = element?.closest<HTMLElement>("[data-action-lane]")?.dataset.actionLane;
    return statuses.find((status) => status === lane) ?? null;
  }

  function clearDrag() {
    touchRef.current = null;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    setTouchPosition(null);
    setDragging(null);
  }

  function commitMove(id: string, destination: ActionStatus) {
    const item = items.find((candidate) => candidate._id === id);
    clearDrag();
    if (!item || item.status === destination || isPending) return;
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      try {
        await moveActionToLane(id, destination);
      } catch {
        setError(`Could not move “${item.title}”. Try again.`);
      } finally {
        setPendingId(null);
      }
    });
  }

  function autoScroll() {
    const touch = touchRef.current;
    if (!touch) return;
    const edge = 72;
    if (touch.y < edge) window.scrollBy(0, -14);
    else if (touch.y > window.innerHeight - edge) window.scrollBy(0, 14);
    const target = laneAt(touch.x, touch.y);
    setDragging((current) => current && target && current.target !== target ? { ...current, target } : current);
    frameRef.current = requestAnimationFrame(autoScroll);
  }

  function startNativeDrag(event: DragEvent<HTMLButtonElement>, item: ActionItem) {
    if (isPending) { event.preventDefault(); return; }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", item._id);
    const card = event.currentTarget.closest<HTMLElement>(".actions-card");
    if (card) event.dataTransfer.setDragImage(card, 24, 20);
    setError(null);
    setDragging({ id: item._id, target: item.status });
  }

  function startTouchDrag(event: PointerEvent<HTMLButtonElement>, item: ActionItem) {
    if (event.pointerType === "mouse" || isPending) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    touchRef.current = { id: item._id, x: event.clientX, y: event.clientY };
    setTouchPosition({ x: event.clientX, y: event.clientY });
    setError(null);
    setDragging({ id: item._id, target: item.status });
    frameRef.current = requestAnimationFrame(autoScroll);
  }

  function moveTouch(event: PointerEvent<HTMLButtonElement>) {
    if (!touchRef.current) return;
    touchRef.current.x = event.clientX;
    touchRef.current.y = event.clientY;
    setTouchPosition({ x: event.clientX, y: event.clientY });
    const target = laneAt(event.clientX, event.clientY);
    if (target) setDragging((current) => current ? { ...current, target } : null);
  }

  function endTouch(event: PointerEvent<HTMLButtonElement>) {
    if (!touchRef.current) return;
    const id = touchRef.current.id;
    const destination = laneAt(event.clientX, event.clientY);
    if (destination) commitMove(id, destination);
    else clearDrag();
  }

  function keyboardDrag(event: KeyboardEvent<HTMLButtonElement>, item: ActionItem) {
    if (isPending) return;
    const active = dragging?.id === item._id ? dragging : null;
    if (event.key === "Escape" && active) {
      event.preventDefault();
      clearDrag();
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (active) commitMove(item._id, active.target);
      else setDragging({ id: item._id, target: item.status });
    } else if (active && (event.key === "ArrowRight" || event.key === "ArrowLeft")) {
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const index = Math.max(0, Math.min(statuses.length - 1, statuses.indexOf(active.target) + direction));
      setDragging({ ...active, target: statuses[index] });
    }
  }

  const activeItem = dragging ? items.find((item) => item._id === dragging.id) : null;
  return <>
    <p id="actions-drag-help" className="actions-drag-help">Drag a card by its handle into another lane. Keyboard: Space to pick up, arrow keys to choose a lane, Space to drop.</p>
    {error && <p className="actions-drag-error" role="alert">{error}</p>}
    <div className="actions-drag-announcement" aria-live="polite">{dragging && activeItem ? `${activeItem.title}: ${labels[dragging.target]} selected. Press Space to drop or Escape to cancel.` : pendingId ? "Saving new lane." : ""}</div>
    <section aria-label="Action board" className="actions-board">
      {statuses.map((status) => {
        const laneItems = items.filter((item) => item.status === status);
        const target = dragging?.target === status && items.find((item) => item._id === dragging.id)?.status !== status;
        return <div
          className={`actions-lane actions-lane-${status}${target ? " actions-lane-target" : ""}`}
          data-action-lane={status}
          key={status}
          onDragOver={(event) => { if (!dragging) return; event.preventDefault(); event.dataTransfer.dropEffect = "move"; if (dragging.target !== status) setDragging({ ...dragging, target: status }); }}
          onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData("text/plain"); if (id) commitMove(id, status); }}
        >
          <div className="actions-lane-heading"><span className="actions-lane-dot" /><h2>{labels[status]}</h2><small>{laneItems.length}</small></div>
          <div className="actions-cards">
            {laneItems.length ? laneItems.map((item) => <article className={`actions-card${dragging?.id === item._id ? " actions-card-dragging" : ""}${pendingId === item._id ? " actions-card-saving" : ""}`} key={item._id}>
              <div className="actions-card-top"><span>{item.dueDate ? item.dueDate < today && status !== "done" ? "Overdue" : item.dueDate === today && status !== "done" ? "Due today" : "Due " + item.dueDate : "No date"}</span>
                <button
                  type="button"
                  className="actions-drag-handle"
                  draggable={!isPending}
                  aria-label={`Drag ${item.title} to another lane`}
                  aria-describedby="actions-drag-help"
                  aria-pressed={dragging?.id === item._id}
                  onDragStart={(event) => startNativeDrag(event, item)}
                  onDragEnd={clearDrag}
                  onPointerDown={(event) => startTouchDrag(event, item)}
                  onPointerMove={moveTouch}
                  onPointerUp={endTouch}
                  onPointerCancel={clearDrag}
                  onKeyDown={(event) => keyboardDrag(event, item)}
                >⠿</button>
              </div>
              <h3>{item.title}</h3>
              {item.detail && <p>{item.detail}</p>}
              {item.tags.length > 0 && <div className="actions-tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
              <details className="actions-edit"><summary>Edit details</summary><form action={updateActionFromForm}><input type="hidden" name="id" value={item._id} /><label>Title<input name="title" required minLength={2} maxLength={180} defaultValue={item.title} /></label><label>Details<textarea name="detail" maxLength={2000} rows={3} defaultValue={item.detail} /></label><label>Due date<input name="dueDate" type="date" defaultValue={item.dueDate ?? ""} /></label><label>Tags<input name="tags" defaultValue={item.tags.join(", ")} /></label><input type="hidden" name="status" value={item.status} /><button type="submit">Save changes</button></form></details>
            </article>) : <p className="actions-lane-empty">Drop a card here.</p>}
          </div>
        </div>;
      })}
    </section>
    {touchPosition && activeItem && <div className="actions-touch-ghost" style={{ left: touchPosition.x + 14, top: touchPosition.y + 14 }} aria-hidden="true">{activeItem.title}</div>}
  </>;
}
