import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { InterestForm } from "@/components/InterestForm";
import { AreaIcon } from "@/components/AreaIcon";

const corners = [
  { name: "Finance", detail: "The cost of a day, with every amount traced to your words.", id: "finance" },
  { name: "Journal", detail: "The original story of your day, kept intact.", id: "journal" },
  { name: "Work", detail: "Meetings, client moments, and meaningful progress.", id: "work" },
  { name: "Health", detail: "Movement, recovery, and habits you mention.", id: "health" },
  { name: "Groceries", detail: "Food purchases and lists in one place.", id: "groceries" },
  { name: "Kids", detail: "Family moments worth remembering.", id: "kids" },
];

export default function Home() {
  return <main className="home-page">
    <header className="home-header"><div className="home-wrap home-header-inner"><Link href="/" className="home-logo">GSD<span>.</span></Link><nav><a href="#how-it-works">How it works</a><ThemeToggle/><Link href="/my-life" className="home-nav-button">Open My Life</Link></nav></div></header>
    <section className="home-hero"><div className="home-wrap home-hero-inner"><div className="home-hero-copy"><span className="home-overline"><span className="home-demo-dot"/> Your life, in focus</span><h1>Say it once.<br/><em>See your life.</em></h1><p>Speak naturally to ChatGPT about your day. Ask it to save the update with GSD. Expenses, work, health, and the rest fall into place in the background. Open My Life whenever you want to see what it kept.</p><div className="home-actions"><Link href="/my-life" className="home-primary">Open My Life <span>↗</span></Link><a href="#how-it-works" className="home-secondary">See how it works</a></div></div><div className="home-demo" aria-label="Example life note and organized records"><div className="home-demo-top"><span className="home-demo-dot"/> A day in your words <span className="home-demo-date"><strong>05</strong><small>Nov</small></span></div><blockquote>“I went to Brussels to onboard a client. The return flight was €200, and lunch cost €11.”</blockquote><div className="home-demo-divider"><span>GSD organized this into</span></div><div className="home-demo-row"><span className="home-demo-icon"><AreaIcon area="finance" /></span><span>Return flight <small>Finance</small></span><strong>€200</strong></div><div className="home-demo-row"><span className="home-demo-icon"><AreaIcon area="finance" /></span><span>Lunch <small>Finance</small></span><strong>€11</strong></div><div className="home-demo-row"><span className="home-demo-icon work"><AreaIcon area="work" /></span><span>Client onboarding <small>Work</small></span></div><div className="home-demo-note">Your original note stays in Journal.</div></div></div></section>
    <section id="how-it-works" className="home-how"><div className="home-wrap"><div className="home-section-intro"><h2>One conversation.<br/>A clearer picture.</h2><p>Your voice is the interface. GSD keeps the story and organizes only the details you actually mention, ready whenever you want to ask or look back.</p></div><div className="home-steps"><div><span>1</span><h3>Tell your day</h3><p>Speak naturally to ChatGPT. Ask it to save the update with GSD.</p></div><div><span>2</span><h3>GSD files the details</h3><p>GSD saves your words and sorts the facts into the right areas in the background.</p></div><div><span>3</span><h3>Ask or browse</h3><p>Ask “How much did Thursday cost?” or open My Life to see the record.</p></div></div></div></section>
    <section className="home-corners"><div className="home-wrap"><div className="home-section-intro"><h2>Every part of life<br/>has a place.</h2><p>A few useful corners, all connected by the same daily story.</p></div><div className="home-corner-grid">{corners.map((corner)=><div className={`home-corner home-corner-${corner.id}`} key={corner.name}><div className="home-corner-icon"><AreaIcon area={corner.id} /></div><h3>{corner.name}</h3><p>{corner.detail}</p></div>)}</div></div></section>
    <section id="interest" className="home-close"><div className="home-wrap"><div><h2>Interested in GSD?</h2><p>Leave your email and we’ll reach out within the next 24 hours.</p></div><InterestForm/></div></section>
    <footer className="home-footer"><div className="home-wrap"><span className="home-logo">GSD<span>.</span></span><span>Private by design. Organized from your words.</span></div></footer>
  </main>;
}
