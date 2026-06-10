import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Coffee,
  MessageSquare,
  Search,
  Sparkles,
  Users,
  Briefcase,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Communication---Bridge — Turn communities into meaningful connections" },
      {
        name: "description",
        content:
          "Browse members, chat privately, schedule coffee chats, and find collaborators — all without sharing personal contacts.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-border/60 backdrop-blur supports-[backdrop-filter]:bg-background/50 sticky top-0 z-50">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-7 rounded-md bg-accent-gradient shadow-glow" />
            <span className="font-semibold tracking-tight">Communication---Bridge</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#how" className="hover:text-foreground">
              How it works
            </a>
            <a href="#why" className="hover:text-foreground">
              Why Communication---Bridge
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              className="text-sm rounded-md bg-primary text-primary-foreground px-3 py-1.5 hover:opacity-90"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
        <div className="absolute inset-0 bg-hero pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-36">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="size-3 text-primary" /> AI-powered networking matchmaker
            </div>
            <h1 className="mt-6 text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05]">
              Turn communities into <span className="text-gradient">meaningful connections.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
              Discover members, send private messages, schedule coffee chats, and find collaborators
              — without ever sharing your phone number or socials.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-3 text-sm font-medium hover:opacity-90 shadow-glow"
              >
                Join the community <ArrowRight className="size-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/60 px-5 py-3 text-sm font-medium hover:bg-secondary"
              >
                Explore features
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Everything you need to build relationships.
          </h2>
          <p className="mt-3 text-muted-foreground">
            A complete networking layer for any community — built for privacy and signal over noise.
          </p>
        </div>
        <div className="mt-12 grid gap-px bg-border md:grid-cols-3 rounded-xl overflow-hidden border border-border">
          {[
            {
              icon: Users,
              title: "Member Directory",
              desc: "Browse every member with rich profiles, skills, and interests.",
            },
            {
              icon: Search,
              title: "Smart Discovery",
              desc: "Filter by skills, industry, goals, location, and more.",
            },
            {
              icon: MessageSquare,
              title: "Private Chat",
              desc: "Real-time messaging — no phone numbers exchanged.",
            },
            {
              icon: Coffee,
              title: "Coffee Chats",
              desc: "Book 15, 30, or 45-minute sessions with structured purpose.",
            },
            {
              icon: Sparkles,
              title: "AI Matchmaker",
              desc: "Get recommended connections with shared interests and a match score.",
            },
            {
              icon: Briefcase,
              title: "Projects & Opportunities",
              desc: "Find collaborators, post gigs, share hackathons and roles.",
            },
          ].map((f, i) => (
            <div key={i} className="bg-card p-7 hover:bg-accent/30 transition-colors">
              <div className="size-10 rounded-lg bg-accent-gradient/20 border border-border flex items-center justify-center text-primary">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-5 font-medium">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
              From join to long-term relationship.
            </h2>
            <p className="mt-3 text-muted-foreground">
              One flow that turns event acquaintances into lasting connections.
            </p>
          </div>
          <ol className="mt-12 grid gap-8 md:grid-cols-5">
            {["Join", "Browse", "Connect", "Chat", "Collaborate"].map((step, i) => (
              <li key={i} className="relative">
                <div className="text-xs text-muted-foreground">Step {i + 1}</div>
                <div className="mt-2 text-lg font-medium">{step}</div>
                <div className="mt-3 h-px bg-border" />
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section id="why" className="mx-auto max-w-7xl px-6 py-24 text-center">
        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
          Your community, fully connected.
        </h2>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
          Privacy-first. Signal over noise. Built for mentors, builders, and friends-to-be.
        </p>
        <Link
          to="/auth"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:opacity-90 shadow-glow"
        >
          Start your first connection <ArrowRight className="size-4" />
        </Link>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-5 rounded bg-accent-gradient" />
            <span>Communication---Bridge</span>
          </div>
          <div>© {new Date().getFullYear()} Communication---Bridge. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
