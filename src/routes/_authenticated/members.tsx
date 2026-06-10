import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { STATUS_LABELS, initials } from "@/lib/profile-helpers";

export const Route = createFileRoute("/_authenticated/members")({
  head: () => ({ meta: [{ title: "Members — Communication---Bridge" }] }),
  component: MembersPage,
});

function MembersPage() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: me } = useQuery({
    queryKey: ["me-id"],
    queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null,
  });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    const ql = q.toLowerCase().trim();
    const excludeNames = ["testuser4", "renupriya", "2401100cse0045", "priya", "hirranya"];
    return members.filter((m) => {
      if (m.id === me) return false;
      const mName = (m.name || "").toLowerCase();
      // Exclude the requested people
      if (excludeNames.some(en => mName.includes(en))) return false;
      
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (!ql) return true;
      const hay = [
        m.name,
        m.role,
        m.company,
        m.location,
        m.industry,
        m.bio,
        m.career_goals,
        ...(m.skills || []),
        ...(m.interests || []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(ql);
    });
  }, [members, q, statusFilter, me]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Members</h1>
          <p className="text-muted-foreground mt-1">Discover people in your community.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search skills, interests, role…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(STATUS_LABELS).map(([v, s]) => (
                <SelectItem key={v} value={v}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && <div className="text-muted-foreground">Loading members…</div>}
        {!isLoading && filtered.length === 0 && (
          <div className="text-muted-foreground col-span-full text-center py-12">
            No members found.
          </div>
        )}
        {filtered.map((m) => (
          <Link key={m.id} to="/members/$id" params={{ id: m.id }} className="group">
            <div className="rounded-xl border border-border bg-card p-5 hover:bg-accent/30 transition-colors h-full">
              <div className="flex items-start gap-3">
                <Avatar name={m.name} url={m.avatar_url} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{m.name || "Unnamed"}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {m.role || "—"} {m.company && `· ${m.company}`}
                  </div>
                </div>
              </div>
              {m.bio && <p className="mt-4 text-sm text-muted-foreground line-clamp-2">{m.bio}</p>}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(m.skills || []).slice(0, 4).map((s: string) => (
                  <span
                    key={s}
                    className="text-xs rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-muted-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <StatusPill status={m.status} />
                <span className="text-xs text-muted-foreground group-hover:text-foreground">
                  View →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function Avatar({
  name,
  url,
  size = 40,
}: {
  name: string;
  url?: string | null;
  size?: number;
}) {
  if (url)
    return (
      <img
        src={url}
        alt={name}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  return (
    <div
      className="rounded-full bg-accent-gradient text-white font-medium flex items-center justify-center shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials(name)}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? STATUS_LABELS.open_to_networking;
  return (
    <span
      className={`text-[10px] uppercase tracking-wider rounded-full border px-2 py-0.5 ${s.tone}`}
    >
      {s.label}
    </span>
  );
}
