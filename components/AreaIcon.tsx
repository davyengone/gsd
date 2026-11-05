import type { ReactNode } from "react";

const paths: Record<string, ReactNode> = {
  finance: <><path d="M18 6.5a7.5 7.5 0 1 0 0 11" /><path d="M4 10h10M4 14h10" /></>,
  journal: <><path d="M5 4.5h12a2 2 0 0 1 2 2v13H7a2 2 0 0 0-2 2V4.5Z" /><path d="M5 19.5a2 2 0 0 1 2-2h12M9 8h6M9 11.5h5" /></>,
  work: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12.5a20 20 0 0 0 18 0M10.5 13.5h3" /></>,
  health: <><path d="M20.4 8.1c0 4.4-8.4 10.8-8.4 10.8S3.6 12.5 3.6 8.1a4.3 4.3 0 0 1 8.4-1.2 4.3 4.3 0 0 1 8.4 1.2Z" /><path d="M7.5 11.5h2l1.2-2 2.3 4 1.1-2h2.4" /></>,
  groceries: <><path d="M3 9h18l-1.6 10H4.6L3 9ZM7 9l3-5M17 9l-3-5M9 13v3M15 13v3" /></>,
  kids: <><circle cx="12" cy="7" r="3" /><path d="M6.5 20v-3.5a5.5 5.5 0 0 1 11 0V20M4.5 10a2 2 0 0 0-1 3.7M19.5 10a2 2 0 0 1 1 3.7" /></>,
};

export function AreaIcon({ area, fallback }: { area: string; fallback?: string }) {
  if (!paths[area]) return <span aria-hidden="true">{fallback ?? area.slice(0, 1).toUpperCase()}</span>;

  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[area]}
    </svg>
  );
}
