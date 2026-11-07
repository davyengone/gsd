"use client";

import { useEffect, useState } from "react";

const key = "gsd-sidebar-collapsed";

export function SidebarToggle() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(key) === "true";
    document.documentElement.dataset.sidebarCollapsed = String(saved);
    const frame = requestAnimationFrame(() => setCollapsed(saved));
    return () => cancelAnimationFrame(frame);
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    document.documentElement.dataset.sidebarCollapsed = String(next);
    window.localStorage.setItem(key, String(next));
  }

  return <button type="button" className="life-sidebar-toggle" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} onClick={toggle}><span aria-hidden="true">☰</span><span className="life-sidebar-toggle-label">{collapsed ? "Show menu" : "Hide menu"}</span></button>;
}
