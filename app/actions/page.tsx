import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SidebarToggle } from "@/components/SidebarToggle";
import { hasDashboardSession } from "@/lib/auth/session";
import { todayInBrussels } from "@/lib/life/dates";
import { listActions, statuses, type ActionStatus } from "@/lib/actions/store";
import { createActionFromForm } from "./actions";
import { ActionsBoard } from "./board";
import "../my-life/style.css";
import "./style.css";

export const dynamic = "force-dynamic";
const labels: Record<ActionStatus, string> = { ideas: "Ideas", planned: "Planned", in_progress: "In progress", done: "Done" };

export default async function ActionsPage({ searchParams }: PageProps<"/actions">) {
  const params = await searchParams;
  if (!(await hasDashboardSession())) return <main className="life-login"><div className="life-login-header"><Link href="/" className="life-brand">GSD<span className="life-brand-dot">.</span></Link><ThemeToggle /></div><div className="life-login-card"><p className="life-kicker">Your private space</p><h1>Actions</h1><p>Sign in to see your board.</p><form action="/api/session" method="post"><input type="hidden" name="next" value="/actions" /><label htmlFor="token">GSD token</label><input id="token" name="token" type="password" required minLength={32} />{params.error === "1" && <span className="life-form-error">That token did not match. Try again.</span>}<button type="submit">Open Actions</button></form></div></main>;
  let items;
  try { items = await listActions(); } catch { return <main className="life-login"><div className="life-login-card"><h1>Actions unavailable</h1><p>Check the MongoDB connection and refresh this page.</p><Link href="/my-life">Back to My Life</Link></div></main>; }
  const today = todayInBrussels();
  const due = items.filter((item) => item.status !== "done" && item.dueDate && item.dueDate <= today).length;
  return <div className="life-shell actions-shell">
    <aside className="life-sidebar"><Link href="/" className="life-brand">GSD<span className="life-brand-dot">.</span></Link><p className="life-sidebar-line">Your life, in focus.</p><div className="life-sidebar-group"><span className="life-sidebar-caption">Dashboard</span><Link className="life-nav" href="/my-life"><span>▦</span> My Life</Link><Link className="life-nav active" href="/actions" aria-current="page"><span>✓</span> Actions</Link></div><div className="life-sidebar-bottom"><span className="life-online-dot" /> Private workspace <form action="/api/session/logout" method="post"><button type="submit">Sign out</button></form></div></aside>
    <main className="life-main"><header className="life-topbar"><div className="life-topbar-title"><SidebarToggle /><span><strong>My Life</strong> / Actions</span></div><div className="life-topbar-actions"><ThemeToggle /><Link href="/my-life">Journal</Link></div></header>
      <div className="life-content actions-content"><div className="actions-heading"><div><p className="life-eyebrow"><span className="life-pulse" /> Your commitments</p><h1>Actions.</h1><p>Keep an idea, plan the next step, and move it forward.</p></div><div className="actions-summary"><strong>{items.filter((item) => item.status !== "done").length}</strong><span>open actions</span><small>{due} due today or earlier</small></div></div>
      <details className="actions-create"><summary id="new-action">＋ Add an action</summary><form action={createActionFromForm} aria-labelledby="new-action"><label>What needs doing?<input name="title" required minLength={2} maxLength={180} placeholder="e.g. Book a meeting with Alex" /></label><label>Details<textarea name="detail" maxLength={2000} rows={2} placeholder="A little context, if helpful" /></label><div className="actions-form-row"><label>Lane<select name="status" defaultValue="ideas">{statuses.map((status) => <option key={status} value={status}>{labels[status]}</option>)}</select></label><label>Due date<input name="dueDate" type="date" /></label><label>Tags, comma separated<input name="tags" placeholder="work, calls" /></label><button type="submit">Add action ↗</button></div></form></details>
      <ActionsBoard items={items} today={today} />
      </div></main></div>;
}
