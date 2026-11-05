"use client";

export function ThemeToggle() {
  function toggleTheme() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem("gsd-theme", next);
    } catch {
      // The switch still works for this page when storage is unavailable.
    }
  }

  return (
    <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label="Toggle color theme">
      <span className="theme-toggle-moon" aria-hidden="true">☾</span>
      <span className="theme-toggle-sun" aria-hidden="true">☼</span>
      <span className="theme-toggle-dark-label">Dark mode</span>
      <span className="theme-toggle-light-label">Light mode</span>
    </button>
  );
}
