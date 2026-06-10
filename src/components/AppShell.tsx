import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Users,
  MessageSquare,
  Coffee,
  Briefcase,
  Megaphone,
  Sparkles,
  UserCircle,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { toast } from "sonner";

const nav = [
  { to: "/members", label: "Members", icon: Users },
  { to: "/matchmaker", label: "Matchmaker", icon: Sparkles },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/coffee-chats", label: "Coffee chats", icon: Coffee },
  { to: "/projects", label: "Projects", icon: Briefcase },
  { to: "/opportunities", label: "Opportunities", icon: Megaphone },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-card/40 px-3 py-5 sticky top-0 h-screen">
        <Link to="/members" className="flex items-center gap-2 px-3 mb-7">
          <div className="size-7 rounded-md bg-accent-gradient shadow-glow" />
          <span className="font-semibold tracking-tight">Communication---Bridge</span>
        </Link>
        <nav className="flex flex-col gap-0.5">
          {nav.map((n) => {
            const active = loc.pathname === n.to || loc.pathname.startsWith(n.to + "/");
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                <n.icon className="size-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-0.5">
          <Link
            to="/me"
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          >
            <UserCircle className="size-4" /> My profile
          </Link>
          <button
            onClick={signOut}
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/95 backdrop-blur">
        <nav className="flex justify-around py-2">
          {nav.slice(0, 5).map((n) => {
            const active = loc.pathname === n.to || loc.pathname.startsWith(n.to + "/");
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex flex-col items-center gap-0.5 text-[10px] px-2 ${active ? "text-foreground" : "text-muted-foreground"}`}
              >
                <n.icon className="size-5" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
    </div>
  );
}
