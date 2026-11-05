"use client";

import { useState, type FormEvent } from "react";

export function InterestForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;

    const form = event.currentTarget;
    const fields = new FormData(form);
    setState("sending");

    try {
      const response = await fetch("/api/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fields.get("email"), website: fields.get("website") }),
      });
      if (!response.ok) throw new Error("Interest request failed");
      form.reset();
      setState("sent");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") return (
    <p className="home-interest-success" role="status">
      Thanks for your interest. We’ll reach out within the next 24 hours.
    </p>
  );

  return (
    <form className="home-interest-form" onSubmit={submit}>
      <label htmlFor="interest-email">Your email</label>
      <div className="home-interest-fields">
        <input id="interest-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} required disabled={state === "sending"} />
        <button type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "I’m interested"}</button>
      </div>
      <div className="home-interest-honeypot" aria-hidden="true"><label htmlFor="interest-website">Website</label><input id="interest-website" name="website" type="text" tabIndex={-1} autoComplete="off" /></div>
      <p>We’ll use your email only to follow up about GSD.</p>
      {state === "error" && <p className="home-interest-error" role="alert">We couldn’t send that. Please try again.</p>}
    </form>
  );
}
