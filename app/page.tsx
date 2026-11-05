import { HeroAperture } from "@/components/landing/HeroAperture";

const apps = [
  {
    name: "Finance",
    line: "Spend out loud. Stay disciplined without opening a spreadsheet.",
    status: "Live",
  },
  {
    name: "Journal",
    line: "Rigorous reflection the moment you say what happened.",
    status: "Coming",
  },
  {
    name: "Health",
    line: "Sport, recovery, and habits tracked as you live them.",
    status: "Coming",
  },
  {
    name: "More apps",
    line: "Utilities for the rest of life — added as the OS grows.",
    status: "Growing",
  },
] as const;

export default function Home() {
  return (
    <div className="relative flex min-h-full flex-col overflow-x-hidden">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 md:px-10">
          <a
            href="#top"
            className="font-display text-lg font-bold tracking-tight text-ink"
          >
            GetShitDone
          </a>
          <a
            href="#connect"
            className="text-sm font-semibold text-ink underline decoration-signal decoration-2 underline-offset-4 transition-colors hover:text-signal-deep"
          >
            Connect
          </a>
        </div>
      </header>

      <main id="top">
        {/* Hero — one composition */}
        <section className="relative min-h-[100svh] overflow-hidden">
          <HeroAperture />

          <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col justify-center px-6 pb-14 pt-24 md:px-10 md:pb-20">
            <div className="max-w-[38rem]">
              <p className="gsd-rise font-display text-[clamp(2.75rem,8.5vw,6.25rem)] font-extrabold leading-[0.92] tracking-[-0.045em] text-ink">
                GetShitDone
              </p>
              <h1 className="gsd-rise gsd-rise-delay-1 mt-5 max-w-lg font-display text-[clamp(1.45rem,2.8vw,2.35rem)] font-semibold leading-[1.18] tracking-[-0.02em] text-ink">
                Talk once. Live organized.
              </h1>
              <p className="gsd-rise gsd-rise-delay-2 mt-4 max-w-md text-base leading-relaxed text-slate md:text-lg">
                One entry point for money, journals, health, and whatever comes
                next — spoken into ChatGPT, filed automatically.
              </p>
              <div className="gsd-rise gsd-rise-delay-3 mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#connect"
                  className="inline-flex items-center justify-center bg-ink px-6 py-3.5 text-sm font-semibold text-paper transition-colors hover:bg-signal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
                >
                  Start with ChatGPT
                </a>
                <a
                  href="#idea"
                  className="inline-flex items-center justify-center border border-ink/20 bg-transparent px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-paper/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  The idea
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Thesis */}
        <section
          id="idea"
          className="border-t border-line bg-paper px-6 py-24 md:px-10 md:py-32"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-12 md:grid-cols-[0.9fr_1.1fr] md:gap-20">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate">
              The idea
            </p>
            <div>
              <h2 className="font-display text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[1.1] tracking-[-0.03em] text-ink">
                A new kind of application: one mouthpiece for a well-run life.
              </h2>
              <p className="mt-8 max-w-2xl text-lg leading-relaxed text-slate md:text-xl">
                Stop hopping between finance apps, journals, and trackers.
                Speak the way you already think — with ChatGPT and the tools
                you trust — and GetShitDone turns that into structure: expenses
                logged, days reflected, workouts captured, and a single view of
                what is happening in your life.
              </p>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate md:text-xl">
                Not another dashboard to babysit. An operating layer that
                listens, acts, and keeps everything in one place — at a scale
                that grows with you.
              </p>
            </div>
          </div>
        </section>

        {/* Apps */}
        <section
          id="apps"
          className="border-t border-line bg-mist px-6 py-24 md:px-10 md:py-32"
        >
          <div className="mx-auto w-full max-w-7xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <h2 className="max-w-xl font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-[-0.03em] text-ink">
                Utility apps for living — not browsing.
              </h2>
              <p className="max-w-sm text-base leading-relaxed text-slate">
                Each app does one job well. More land as the life OS expands.
              </p>
            </div>

            <ul className="mt-14 divide-y divide-line border-y border-line">
              {apps.map((app) => (
                <li
                  key={app.name}
                  className="group grid gap-3 py-8 transition-colors md:grid-cols-[minmax(0,220px)_1fr_auto] md:items-baseline md:gap-8"
                >
                  <span className="font-display text-2xl font-bold tracking-tight text-ink group-hover:text-signal">
                    {app.name}
                  </span>
                  <p className="text-lg leading-relaxed text-slate">{app.line}</p>
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate">
                    {app.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works — sequence */}
        <section className="border-t border-line bg-ink px-6 py-24 text-paper md:px-10 md:py-32">
          <div className="mx-auto w-full max-w-7xl">
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-[-0.03em]">
              Three moves. Zero busywork.
            </h2>
            <ol className="mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
              {[
                {
                  step: "01",
                  title: "Say it",
                  body: "“I spent €13.80 on breakfast.” “I ran 8K.” “Today felt heavy.” Natural language is the interface.",
                },
                {
                  step: "02",
                  title: "We act",
                  body: "Skills and MCP tools call your apps — finance, journal, health — with auth, schemas, and guardrails.",
                },
                {
                  step: "03",
                  title: "You see life",
                  body: "One dashboard. What moved today, what needs attention, what stays on track — without hunting tabs.",
                },
              ].map((item) => (
                <li key={item.step} className="border-t border-paper/20 pt-6">
                  <p className="font-mono text-xs tracking-[0.2em] text-signal">
                    {item.step}
                  </p>
                  <h3 className="mt-4 font-display text-2xl font-bold tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-paper/70">
                    {item.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Closing CTA */}
        <section
          id="connect"
          className="relative overflow-hidden border-t border-line bg-paper px-6 py-28 md:px-10 md:py-36"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-40 max-md:hidden"
            style={{
              background:
                "radial-gradient(60% 70% at 80% 50%, rgba(228,87,46,0.2), transparent 70%)",
            }}
          />
          <div className="relative mx-auto max-w-7xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate">
              Early access
            </p>
            <h2 className="mt-5 max-w-3xl font-display text-[clamp(2.4rem,5.5vw,4.5rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-ink">
              Build the habit of a life that runs itself.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate">
              Connect GetShitDone in ChatGPT developer mode. Finance logging is
              live today. Journal, health, and the life dashboard ship next.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <a
                href="https://chatgpt.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-signal px-6 py-3.5 text-sm font-semibold text-paper transition-colors hover:bg-signal-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
              >
                Open ChatGPT
              </a>
              <a
                href="#apps"
                className="inline-flex items-center justify-center border border-ink/20 px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Browse apps
              </a>
            </div>
            <p className="mt-8 max-w-2xl font-mono text-xs leading-relaxed tracking-wide text-slate">
              MCP endpoint:{" "}
              <span className="text-ink">
                https://getshitdone-beta.vercel.app/api/mcp/&lt;token&gt;
              </span>
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-mist px-6 py-8 md:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="font-display text-sm font-bold text-ink">
            GetShitDone
          </p>
          <p className="text-sm text-slate">
            One entry point. More apps as we grow.
          </p>
        </div>
      </footer>
    </div>
  );
}
