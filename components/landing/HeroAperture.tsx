/** Full-bleed hero visual: conversation streams converging into one life aperture. */
export function HeroAperture() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(120% 90% at 78% 42%, rgba(228, 87, 46, 0.16), transparent 52%),
            radial-gradient(80% 70% at 18% 18%, rgba(16, 20, 24, 0.06), transparent 55%),
            linear-gradient(165deg, #f4f6f8 0%, #e9ecef 48%, #dde3ea 100%)
          `,
        }}
      />

      <svg
        className="absolute -right-[18%] top-[-8%] h-[120%] w-[95%] max-w-none md:-right-[8%] md:w-[72%]"
        viewBox="0 0 800 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g className="gsd-orbit opacity-70">
          <circle
            cx="400"
            cy="400"
            r="310"
            stroke="#c5cbd3"
            strokeWidth="1"
            strokeDasharray="3 14"
          />
          <circle
            cx="400"
            cy="90"
            r="5"
            fill="#e4572e"
          />
        </g>

        <g className="gsd-orbit-reverse opacity-80">
          <circle
            className="gsd-pulse-ring"
            cx="400"
            cy="400"
            r="230"
            stroke="#101418"
            strokeOpacity="0.28"
          />
          <circle cx="400" cy="170" r="4" fill="#101418" fillOpacity="0.55" />
        </g>

        <circle
          cx="400"
          cy="400"
          r="150"
          stroke="#101418"
          strokeOpacity="0.18"
          strokeWidth="1.25"
        />
        <circle
          cx="400"
          cy="400"
          r="72"
          fill="#101418"
        />
        <circle
          cx="400"
          cy="400"
          r="28"
          fill="#e4572e"
        />

        <path
          className="gsd-stream"
          d="M120 180 C 220 220, 280 300, 360 360"
          stroke="#101418"
          strokeOpacity="0.45"
          strokeWidth="1.5"
        />
        <path
          className="gsd-stream"
          style={{ animationDelay: "0.25s" }}
          d="M90 420 C 200 400, 290 390, 360 395"
          stroke="#e4572e"
          strokeOpacity="0.7"
          strokeWidth="1.75"
        />
        <path
          className="gsd-stream"
          style={{ animationDelay: "0.45s" }}
          d="M150 620 C 240 540, 310 470, 372 430"
          stroke="#101418"
          strokeOpacity="0.35"
          strokeWidth="1.5"
        />
      </svg>

      <div className="absolute bottom-[10%] right-[4%] z-[1] flex w-[min(34vw,280px)] flex-col gap-2 max-md:hidden">
        <LifeChip label="Finance" detail="€13.80 · breakfast" tone="signal" />
        <LifeChip label="Journal" detail="Morning clarity, 4 lines" tone="ink" />
        <LifeChip label="Health" detail="Run · 8.2 km" tone="ink" />
      </div>
    </div>
  );
}

function LifeChip({
  label,
  detail,
  tone,
}: {
  label: string;
  detail: string;
  tone: "signal" | "ink";
}) {
  return (
    <div
      className={`gsd-chip flex items-baseline justify-between gap-4 border-l-[3px] bg-paper/80 px-4 py-3 backdrop-blur-sm ${
        tone === "signal" ? "border-signal" : "border-ink"
      }`}
    >
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate">
        {label}
      </span>
      <span className="text-sm font-medium text-ink">{detail}</span>
    </div>
  );
}
