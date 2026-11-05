import Link from "next/link";
import { hasDashboardSession } from "@/lib/auth/session";
import { getLifeHistory, getLifeRange } from "@/lib/life/store";
import { listCategories } from "@/lib/life/categories";
import type { LifeCategory, LifeEntry, LifeFact } from "@/lib/life/schema";
import { capturedTime, dateInBrussels, daysBefore, displayDate, timeInBrussels, todayInBrussels, validDate } from "@/lib/life/dates";
import "./style.css";

export const dynamic = "force-dynamic";

function formatAmount(value: number, currency: string) {
  return new Intl.NumberFormat("en-BE", { style: "currency", currency }).format(value);
}

function factAmount(fact: LifeFact) {
  if (fact.amount === null) return null;
  return fact.currency ? formatAmount(fact.amount, fact.currency) : String(fact.amount);
}

function FactIcon({ area, name }: { area: string; name: string }) {
  const glyph: Record<string, string> = { finance: "€", journal: "✎", work: "▣", health: "✦", groceries: "◒", kids: "♡" };
  return <div className={`life-feed-icon ${area}`} aria-hidden="true">{glyph[area] ?? name.slice(0, 1).toUpperCase()}</div>;
}

type FeedItem =
  | { type: "entry"; entry: LifeEntry; date: string; createdAt: string }
  | { type: "fact"; fact: LifeFact; date: string; createdAt: string };

async function loadPeriod(params: Record<string, string | string[] | undefined>, today: string, weekFrom: string) {
  try {
    const [history, categories] = await Promise.all([getLifeHistory(), listCategories()]);
    const hasMultipleDays = history.dates.length > 1;
    const weekHasHistory = history.firstCapturedAt !== null
      && dateInBrussels(history.firstCapturedAt) <= weekFrom
      && history.dates.filter((date) => date >= weekFrom && date <= today).length > 1;
    const requestedView = typeof params.view === "string" ? params.view : "today";
    const view = requestedView === "week" && weekHasHistory ? "week"
      : requestedView === "range" && hasMultipleDays ? "range"
      : requestedView === "day" && hasMultipleDays ? "day" : "today";
    const day = validDate(params.date) && params.date >= history.dates[0] && params.date <= today ? params.date : today;
    const requestedFrom = validDate(params.from) && params.from <= today ? params.from : history.dates[0] ?? today;
    const requestedTo = validDate(params.to) && params.to <= today ? params.to : today;
    const from = view === "week" ? weekFrom : view === "day" ? day : view === "range" ? (requestedFrom <= requestedTo ? requestedFrom : requestedTo) : today;
    const to = view === "week" ? today : view === "day" ? day : view === "range" ? (requestedFrom <= requestedTo ? requestedTo : requestedFrom) : today;
    const records = await getLifeRange(from, to);
    return { history, categories, hasMultipleDays, weekHasHistory, view, day, from, to, ...records };
  } catch {
    return null;
  }
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

  const now = new Date();
  const today = todayInBrussels(now);
  const weekFrom = daysBefore(today, 6);
  const period = await loadPeriod(params, today, weekFrom);
  if (!period) return <div className="life-shell"><aside className="life-sidebar"><Link href="/" className="life-brand">GSD<span className="life-brand-dot">.</span></Link></aside><main className="life-main"><header className="life-topbar">My Life</header><div className="life-content"><div className="life-heading"><div><h1>My Life</h1><p>Your private dashboard</p></div></div><div className="life-empty"><div>✳</div><h3>Data is not available yet</h3><p>Check the GSD MongoDB connection in this Vercel project, then refresh this page.</p></div></div></main></div>;
  const { history, categories, hasMultipleDays, weekHasHistory, view, day, from, to, entries, facts } = period;
  const selectedCategory = typeof params.area === "string" ? categories.find((category) => category._id === params.area) : undefined;
  const area = selectedCategory?._id;
  const nameById = Object.fromEntries(categories.map((category) => [category._id, category.name])) as Record<string, string>;

    const counts = Object.fromEntries(categories.map((category) => [category._id, category._id === "journal" ? entries.length : facts.filter((fact) => fact.area === category._id).length])) as Record<string, number>;
    const expenses = facts.filter((fact) => fact.area === "finance" && fact.kind === "expense" && fact.amount !== null);
    const totals = expenses.reduce<Record<string, number>>((result, fact) => {
      const currency = fact.currency ?? "UNSPECIFIED";
      result[currency] = Math.round(((result[currency] ?? 0) + (fact.amount ?? 0)) * 100) / 100;
      return result;
    }, {});
    const visibleFacts = area === "finance"
      ? facts.filter((fact) => fact.area === "finance" && fact.kind !== "expense")
      : area ? facts.filter((fact) => fact.area === area)
      : facts.filter((fact) => fact.area !== "finance");
    const visibleEntries = area && area !== "journal" ? [] : entries;
    const feed: FeedItem[] = [
      ...visibleEntries.map((entry) => ({ type: "entry" as const, entry, date: entry.occurredAt, createdAt: entry.createdAt })),
      ...visibleFacts.map((fact) => ({ type: "fact" as const, fact, date: fact.occurredAt, createdAt: fact.createdAt })),
    ].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt) || (a.type === "entry" ? -1 : 1));

    function href(nextArea: string | undefined, nextView = view) {
      const query = new URLSearchParams();
      if (nextArea) query.set("area", nextArea);
      if (nextView !== "today") query.set("view", nextView);
      if (nextView === "day") query.set("date", day);
      if (nextView === "range") { query.set("from", from); query.set("to", to); }
      const suffix = query.toString();
      return `/my-life${suffix ? `?${suffix}` : ""}`;
    }

    const periodTitle = view === "today" ? "Today"
      : view === "week" ? "Last 7 days"
      : view === "day" ? displayDate(day, { year: undefined })
      : `${displayDate(from, { weekday: undefined, year: undefined })} – ${displayDate(to, { weekday: undefined })}`;
    const periodLabel = view === "today" ? displayDate(today) : view === "day" ? displayDate(day) : `${displayDate(from)} – ${displayDate(to)}`;
    const emptyTitle = view === "today" ? "Nothing captured today yet" : "No records in this period";
    const heroDate = view === "day" ? day : view === "range" ? to : today;
    const activeCategories = categories.filter((category) => counts[category._id] > 0).length;

    return (
      <div className="life-shell">
        <aside className="life-sidebar">
          <Link href="/" className="life-brand">GSD<span className="life-brand-dot">.</span></Link>
          <p className="life-sidebar-line">Your life, in focus.</p>
          <div className="life-sidebar-group">
            <span className="life-sidebar-caption">Dashboard</span>
            <Link className={!area ? "life-nav active" : "life-nav"} href={href(undefined)} aria-current={!area ? "page" : undefined}><span>▦</span> My Life</Link>
          </div>
          <div className="life-sidebar-group">
            <span className="life-sidebar-caption">Your areas</span>
            {categories.map((category: LifeCategory) => <Link key={category._id} className={area === category._id ? "life-nav active" : "life-nav"} href={href(category._id)} aria-current={area === category._id ? "page" : undefined}><span className={`life-nav-mark ${category._id}`} />{category.name} <small>{counts[category._id]}</small></Link>)}
          </div>
          <div className="life-sidebar-bottom"><span className="life-online-dot" /> Private workspace <form action="/api/session/logout" method="post"><button type="submit">Sign out</button></form></div>
        </aside>
        <main className="life-main">
          <header className="life-topbar"><span><strong>My Life</strong> / {selectedCategory?.name ?? "Overview"}</span><div className="life-topbar-actions"><span>{timeInBrussels(now)} Brussels</span><a href={href(area)}>Refresh ↻</a><Link href="/">About GSD</Link></div></header>
          <div className="life-content">
            <div className="life-heading">
              <div className="life-heading-copy"><p className="life-eyebrow"><span className="life-pulse" />{periodLabel}</p><h1>{selectedCategory?.name ?? (view === "today" ? "Today, so far." : periodTitle)}</h1><p>{selectedCategory ? selectedCategory.description : "One place for what you said, what happened, and what matters next."}</p><span className="life-heading-foot">{entries.length} {entries.length === 1 ? "note" : "notes"} saved <i /> As of {timeInBrussels(now)} Brussels time</span></div>
              <div className="life-date-art" aria-hidden="true"><strong>{heroDate.slice(8)}</strong><span>{displayDate(heroDate, { weekday: undefined, day: undefined, year: undefined })}</span></div>
            </div>

            <section className="life-period" aria-label="Time period">
              <div className="life-period-intro"><span>Showing</span><strong>{periodTitle}</strong></div>
              <nav className="life-period-tabs" aria-label="Choose time period">
                <Link href={href(area, "today")} aria-current={view === "today" ? "page" : undefined}>Today</Link>
                {weekHasHistory && <Link href={href(area, "week")} aria-current={view === "week" ? "page" : undefined}>7 days</Link>}
                {hasMultipleDays && <Link href={href(area, "day")} aria-current={view === "day" ? "page" : undefined}>Day</Link>}
                {hasMultipleDays && <Link href={href(area, "range")} aria-current={view === "range" ? "page" : undefined}>Date range</Link>}
              </nav>
            </section>

            {view === "day" && <form className="life-date-picker" action="/my-life" method="get"><input type="hidden" name="view" value="day" />{area && <input type="hidden" name="area" value={area} />}<label htmlFor="life-day">Choose a recorded day</label><input id="life-day" name="date" type="date" min={history.dates[0]} max={today} defaultValue={day} /><button type="submit">Show day</button></form>}
            {view === "range" && <form className="life-date-picker" action="/my-life" method="get"><input type="hidden" name="view" value="range" />{area && <input type="hidden" name="area" value={area} />}<label htmlFor="life-from">From</label><input id="life-from" name="from" type="date" min={history.dates[0]} max={today} defaultValue={from} /><label htmlFor="life-to">To</label><input id="life-to" name="to" type="date" min={history.dates[0]} max={today} defaultValue={to} /><button type="submit">Show range</button></form>}

            {!area && <section className="life-feature"><div><span className="life-feature-label">Latest from your journal</span><h2>{entries[0] ? entries[0].text : emptyTitle}</h2><p>{entries[0] ? `Captured at ${capturedTime(entries[0].createdAt)} · ${displayDate(entries[0].occurredAt)}` : "Ask askDavy in ChatGPT to save a note. Your words will appear here."}</p></div><div className="life-feature-glyph" aria-hidden="true">✳</div></section>}

            <section className="life-overview-grid" aria-label="Period summary">
              <div className="life-metric"><span>Spent in EUR</span><strong>{formatAmount(totals.EUR ?? 0, "EUR")}</strong><small>{expenses.length} recorded expense{expenses.length === 1 ? "" : "s"}{Object.keys(totals).some((currency) => currency !== "EUR") ? " · Other currencies below" : ""}</small></div>
              <div className="life-metric"><span>Notes saved</span><strong>{entries.length}</strong><small>In your own words</small></div>
              <div className="life-metric"><span>Details found</span><strong>{facts.length}</strong><small>Across {activeCategories} {activeCategories === 1 ? "area" : "areas"}</small></div>
            </section>

            {!area && <section className="life-areas"><div className="life-section-heading"><div><p className="life-section-kicker">Everything has a place</p><h2>Your areas</h2></div><span>{activeCategories} of {categories.length} active this period</span></div><div className="life-area-grid">{categories.map((category) => {
              const latest = category._id === "journal" ? entries[0]?.text : facts.find((fact) => fact.area === category._id)?.title;
              const symbol: Record<string, string> = { finance: "€", journal: "✳", work: "↗", health: "+", groceries: "◒", kids: "♡" };
              return <Link href={href(category._id)} className={`life-area life-area-${category._id}`} key={category._id}><span className="life-area-symbol" aria-hidden="true">{symbol[category._id] ?? category.name.slice(0, 1).toUpperCase()}</span><span className="life-area-count">{counts[category._id]} {counts[category._id] === 1 ? "record" : "records"}</span><h3>{category.name}</h3><p>{latest ?? "Ready for your next update"}</p><b aria-hidden="true">↗</b></Link>;
            })}</div></section>}

            <div className={`life-lower-grid${area && area !== "finance" ? " life-lower-grid-single" : ""}`}>

            {(!area || area === "finance") && <section className="life-spending"><div className="life-section-heading"><div><p className="life-section-kicker">A closer look</p><h2>Spending</h2></div><span>{expenses.length} recorded</span></div>
              <div className="life-spending-card">
                {expenses.length === 0 ? <p className="life-spending-empty">No expenses recorded for this period.</p> : <>
                  <div className="life-spending-totals">{Object.entries(totals).map(([currency, total]) => <div key={currency}><span>{currency === "UNSPECIFIED" ? "Currency unspecified" : `Total in ${currency}`}</span><strong>{currency === "UNSPECIFIED" ? String(total) : formatAmount(total, currency)}</strong></div>)}</div>
                  <div className="life-spending-list">{expenses.map((expense) => <div key={expense._id}><span><strong>{expense.title}</strong><small>{displayDate(expense.occurredAt, { weekday: undefined, year: undefined })} · From your note: “{expense.sourceQuote}”</small></span><b>{factAmount(expense)}</b></div>)}</div>
                </>}
              </div>
            </section>}

            <section className="life-records"><div className="life-section-heading"><div><p className="life-section-kicker">What GSD kept</p><h2>{area === "journal" ? "Your notes" : area === "finance" ? "Other finance records" : selectedCategory ? `${selectedCategory.name} activity` : "Recent activity"}</h2></div><span>{feed.length} item{feed.length === 1 ? "" : "s"}</span></div>
              {feed.length === 0 ? <div className="life-empty"><div>✳</div><h3>{selectedCategory ? `No ${selectedCategory.name.toLowerCase()} records here` : emptyTitle}</h3><p>{view === "today" ? "Ask askDavy in ChatGPT to save a life update. It will appear here when captured." : "Try another day or date range to see what you have saved."}</p></div> : <div className="life-feed">
                {feed.map((item) => item.type === "entry" ? <article className="life-feed-item" key={item.entry._id}><FactIcon area="journal" name="Journal" /><div><span className="life-feed-meta">Journal · {displayDate(item.entry.occurredAt, { weekday: undefined })} · Captured {capturedTime(item.entry.createdAt)}</span><h3>{item.entry.text}</h3><p>{item.entry.extractionStatus === "failed" ? "Original note saved · Detail extraction failed; retry the note in ChatGPT" : item.entry.extractionStatus === "pending" ? "Original note saved · Organizing details" : "Original note"}</p></div></article>
                  : <article className="life-feed-item" key={item.fact._id}><FactIcon area={item.fact.area} name={nameById[item.fact.area] ?? item.fact.area} /><div><span className="life-feed-meta">{nameById[item.fact.area] ?? item.fact.area} · {displayDate(item.fact.occurredAt, { weekday: undefined })}</span><h3>{item.fact.title}</h3><p>{item.fact.detail || `“${item.fact.sourceQuote}”`}</p></div>{factAmount(item.fact) && <strong className="life-feed-amount">{factAmount(item.fact)}</strong>}</article>)}
              </div>}
            </section>
            </div>
          </div>
        </main>
      </div>
    );
}
