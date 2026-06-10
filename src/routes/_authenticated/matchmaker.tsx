/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { computeMatches } from "@/lib/matchmaker.functions";
import { Avatar, StatusPill } from "./members";
import { Sparkles, Loader2, RefreshCw, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/matchmaker")({
  head: () => ({ meta: [{ title: "AI Matchmaker — Communication---Bridge" }] }),
  component: MatchmakerPage,
});

function MatchmakerPage() {
  const navigate = useNavigate();
  const compute = useServerFn(computeMatches);
  const { data: me } = useQuery({
    queryKey: ["me-full"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.user!.id)
        .maybeSingle();
      return data;
    },
  });

  const mut = useMutation({ mutationFn: async () => compute() });

  const needsProfile = me && !me.onboarded;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="rounded-2xl border border-border bg-card p-8 bg-hero shadow-glow">
        <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-wider">
          <Sparkles className="size-4" /> AI Networking Matchmaker
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mt-3">
          Find your people.
        </h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Communication---Bridge analyzes your profile and the community to recommend members with shared interests,
          complementary skills, or aligned goals.
        </p>
        {needsProfile && (
          <div className="mt-5 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm">
            Complete your profile to get better matches.{" "}
            <Link to="/me" className="underline">
              Set up profile →
            </Link>
          </div>
        )}
        <Button onClick={() => mut.mutate()} disabled={mut.isPending} className="mt-6">
          {mut.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Finding matches…
            </>
          ) : (
            <>
              <RefreshCw className="size-4" /> Find matches
            </>
          )}
        </Button>
      </div>

      {mut.isError && (
        <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {(mut.error as any)?.message ?? "Something went wrong."}
        </div>
      )}

      {mut.data && (
        <div className="mt-8 space-y-3">
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground">Top matches</h2>
          {mut.data.matches.length === 0 && (
            <div className="text-muted-foreground">No matches yet — try inviting more members.</div>
          )}
          {mut.data.matches.map((m: any) => (
            <div
              key={m.profile.id}
              className="rounded-xl border border-border bg-card p-5 flex items-start gap-4"
            >
              <Avatar name={m.profile.name} url={m.profile.avatar_url} size={48} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-medium">{m.profile.name}</div>
                  <StatusPill status={m.profile.status} />
                  <span className="ml-auto text-sm font-semibold text-gradient">
                    {m.score}% match
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {m.profile.role}
                  {m.profile.company && ` · ${m.profile.company}`}
                </div>
                <p className="text-sm mt-2">{m.reason}</p>
                {m.shared.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {m.shared.map((s: string) => (
                      <span
                        key={s}
                        className="text-xs rounded-md border border-primary/30 bg-primary/10 text-primary px-2 py-0.5"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => navigate({ to: "/members/$id", params: { id: m.profile.id } })}
                  >
                    <UserPlus className="size-4" /> View profile
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
