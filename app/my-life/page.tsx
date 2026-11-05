import Link from "next/link";
import { hasDashboardSession } from "@/lib/auth/session";
import { getLifeStats, listLife } from "@/lib/life/store";
import { areas, type Area, type LifeFact } from "@/lib/life/schema";
import "./style.css";

export const dynamic = "force-dynamic";

const labels: Record<Area, string> = {
  finance: "Finance", journal: "Journal", work: "Work", health: "Health", groceries: "Groceries", kids: "Kids",
};

function formattedDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

function amount(fact: LifeFact) {
  if (fact.amount === null) return null;
  if (!fact.currency) return String(fact.amount);
  return new Intl.NumberFormat("en-BE", { style: "currency", currency: fact.currency }).format(fact.amount);
}

export default async function MyLife({ searchParams }: PageProps<"/my-life">) {
  const params = await searchParams;
  const authenticated = await hasDashboardSession();
  if (!authenticated) return (
    <main className="life-login">
      <Link href="/" className="life-brand">GSD<span className="life-brand-dot">.</span></Link>
      <div className="life-login-card">
        <div className="life-lock" aria-hidden="true">✳</div>
        <p className="life-kicker">Your private space</p>
        <h1>My Life</h1>
        <p>Your notes and everything GSD has organized from them. Enter your private GSD token to view it.</p>
        <form action="/api/session" method="post">
          <label htmlFor="token">GSD token</label>
          <input id="token" name="token" type="password" autoComplete="off" required minLength={32} placeholder="Paste your private token" />
          {params.error === "1" && <span className="life-form-error">That token did not match. Try again.</span>}
          <button type="submit">Open My Life</button>
        </form>
      </div>
      <span className="life-login-footer">A quieter place for everything you say matters.</span>
    </main>
  );

  const area = typeof params.area === "string" && areas.includes(params.area as Area) ? params.area as Area : undefined;
  let data: Awaited<ReturnType<typeof listLife>>;
  let all: Awaited<ReturnType<typeof listLife>>;
  let stats: Awaited<ReturnType<typeof getLifeStats>>;
  try {
    data = await listLife({ area, limit: 60 });
    all = area ? await listLife({ limit: 100 }) : data;
    stats = await getLifeStats();
  } catch {
    return <div className="life-shell"><aside className="life-sidebar"><Link href="/" className="life-brand">GSD<span className="life-brand-dot">.</span></Link></aside><main className="life-main"><header className="life-topbar">My Life</header><div className="life-content"><div className="life-heading"><div><h1>My Life</h1><p>Your private dashboard</p></div></div><div className="life-empty"><div>✳</div><h3>Data is not available yet</h3><p>Check the GSD MongoDB connection in this Vercel project, then refresh this page.</p></div></div></main></div>;
  }
  const counts = stats.counts;
  const latest = all.entries[0];

  return (
    <div className="life-shell">
      <aside className="life-sidebar">
        <Link href="/" className="life-brand">GSD<span className="life-brand-dot">.</span></Link>
        <div className="life-sidebar-group">
          <span className="life-sidebar-caption">Your space</span>
          <Link className={!area ? "life-nav active" : "life-nav"} href="/my-life"><span>◈</span> Overview</Link>
        </div>
        <div className="life-sidebar-group">
          <span className="life-sidebar-caption">Corners of life</span>
          {areas.map((name) => <Link key={name} className={area === name ? "life-nav active" : "life-nav"} href={`/my-life?area=${name}`}><span className={`life-nav-mark ${name}`} />{labels[name]} <small>{counts[name]}</small></Link>)}
        </div>
        <div className="life-sidebar-bottom"><span className="life-online-dot" /> Private workspace <form action="/api/session/logout" method="post"><button type="submit">Sign out</button></form></div>
      </aside>
      <main className="life-main">
        <header className="life-topbar"><span>My Life / {area ? labels[area] : "Overview"}</span><Link href="/">About GSD ↗</Link></header>
        <div className="life-content">
          <div className="life-heading"><div><p className="life-eyebrow">A living record, in your own words</p><h1>{area ? labels[area] : "My Life"}</h1><p>{area ? `Everything GSD has saved in ${labels[area].toLowerCase()}.` : "What you shared, and what GSD understood."}</p></div><div className="life-date">{formattedDate(new Date().toISOString().slice(0, 10))}</div></div>
          {!area && <>
            <section className="life-feature">
              <div><span className="life-feature-label">LATEST NOTE</span><h2>{latest ? latest.text : "Your life, one conversation at a time."}</h2><p>{latest ? `Captured ${formattedDate(latest.occurredAt)}` : "Connect GSD in ChatGPT, then ask it to capture a day. Your words will appear here."}</p></div>
              <div className="life-feature-glyph" aria-hidden="true">✳</div>
            </section>
            <section className="life-overview-grid" aria-label="Overview">
              <div className="life-metric"><span>Journal entries</span><strong>{stats.counts.journal}</strong><small>Notes you have shared</small></div>
              <div className="life-metric"><span>Expenses in EUR</span><strong>{new Intl.NumberFormat("en-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(stats.eurTotal)}</strong><small>{stats.eurExpenseCount} recorded expenses</small></div>
              <div className="life-metric"><span>Organized facts</span><strong>{stats.factCount}</strong><small>Across your life corners</small></div>
            </section>
          </>}
          <section className="life-records"><div className="life-section-heading"><h2>{area === "journal" ? "Your notes" : area ? `${labels[area]} records` : "Recent activity"}</h2><span>{area === "journal" ? data.entries.length : data.facts.length + (!area ? data.entries.length : 0)} items</span></div>
            {data.facts.length === 0 && data.entries.length === 0 ? <div className="life-empty"><div>✳</div><h3>Nothing here yet</h3><p>Tell ChatGPT to use GSD to capture a life update. The record will appear here when it is saved.</p></div> : <div className="life-feed">
              {(area === "journal" || !area) && data.entries.map((entry) => <article className="life-feed-item" key={entry._id}><div className="life-feed-icon journal">✎</div><div><span className="life-feed-meta">Journal · {formattedDate(entry.occurredAt)}</span><h3>{entry.text}</h3><p>{entry.extractionStatus === "failed" ? "Original note saved · Detail extraction failed; retry the note in ChatGPT" : entry.extractionStatus === "pending" ? "Original note saved · Organizing details" : "Original note"}</p></div></article>)}
              {data.facts.map((fact) => <article className="life-feed-item" key={fact._id}><div className={`life-feed-icon ${fact.area}`}>{fact.area === "finance" ? "€" : fact.area === "work" ? "▣" : fact.area === "health" ? "✦" : fact.area === "groceries" ? "◒" : fact.area === "kids" ? "♡" : "✎"}</div><div><span className="life-feed-meta">{labels[fact.area]} · {formattedDate(fact.occurredAt)}</span><h3>{fact.title}</h3><p>{fact.detail || `“${fact.sourceQuote}”`}</p></div>{amount(fact) && <strong className="life-feed-amount">{amount(fact)}</strong>}</article>)}
            </div>}
          </section>
        </div>
      </main>
    </div>
  );
}
