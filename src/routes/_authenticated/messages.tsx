import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar } from "./members";
import { UserCheck, UserPlus, MessageSquare, Video, Phone } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({ meta: [{ title: "Messages — Communication---Bridge" }] }),
  component: MessagesIndex,
});

function MessagesIndex() {
  const qc = useQueryClient();
  const { data: me } = useQuery({
    queryKey: ["me-id"],
    queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null,
  });

  const { data: connections = [] } = useQuery({
    queryKey: ["connections-all", me],
    enabled: !!me,
    queryFn: async () => {
      const { data } = await supabase
        .from("connections")
        .select("*")
        .order("updated_at", { ascending: false });
      return data ?? [];
    },
  });

  const accepted = connections.filter((c) => c.status === "accepted");
  const incoming = connections.filter((c) => c.status === "pending" && c.addressee_id === me);

  const otherIds = Array.from(
    new Set(
      [...accepted, ...incoming].map((c) =>
        c.requester_id === me ? c.addressee_id : c.requester_id,
      ),
    ),
  );

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-by-ids", otherIds.join(",")],
    enabled: otherIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").in("id", otherIds);
      return data ?? [];
    },
  });
  const pmap = new Map(profiles.map((p) => [p.id, p]));

  async function respond(id: string, status: "accepted" | "rejected") {
    const { error } = await supabase.from("connections").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(status === "accepted" ? "Connection accepted" : "Declined");
    qc.invalidateQueries({ queryKey: ["connections-all", me] });
  }

  const mockAccepted = [
    { id: "mock-1", requester_id: "mock-user-1", addressee_id: "me", status: "accepted" },
    { id: "mock-2", requester_id: "mock-user-2", addressee_id: "me", status: "accepted" },
    { id: "mock-3", requester_id: "mock-user-3", addressee_id: "me", status: "accepted" },
    { id: "mock-4", requester_id: "mock-user-4", addressee_id: "me", status: "accepted" },
    { id: "mock-5", requester_id: "mock-user-5", addressee_id: "me", status: "accepted" },
  ];

  const mockProfiles = new Map([
    ["mock-user-1", { id: "mock-user-1", name: "Ananya Iyer", role: "Head of Growth", avatar_url: "https://i.pravatar.cc/150?u=Ananya" }],
    ["mock-user-2", { id: "mock-user-2", name: "Sara Khan", role: "Data Scientist", avatar_url: "https://i.pravatar.cc/150?u=Sara" }],
    ["mock-user-3", { id: "mock-user-3", name: "Vikram Singh", role: "Founder", avatar_url: "https://i.pravatar.cc/150?u=Vikram" }],
    ["mock-user-4", { id: "mock-user-4", name: "Meera Nair", role: "Principal", avatar_url: "https://i.pravatar.cc/150?u=Meera" }],
    ["mock-user-5", { id: "mock-user-5", name: "Aarav Mehta", role: "Senior Software Engineer", avatar_url: "https://i.pravatar.cc/150?u=Aarav" }],
  ]);

  const combinedAccepted = [...mockAccepted, ...accepted] as typeof accepted;
  const combinedPmap = new Map([...mockProfiles, ...Array.from(pmap.entries())]) as typeof pmap;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Messages</h1>
      <p className="text-muted-foreground mt-1">Private 1:1 conversations with your connections.</p>

      {incoming.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
            Pending requests
          </h2>
          <div className="space-y-2">
            {incoming.map((c) => {
              const p = combinedPmap.get(c.requester_id);
              if (!p) return null;
              return (
                <div
                  key={c.id}
                  className="rounded-lg border border-border bg-card p-4 flex items-center gap-3"
                >
                  <Avatar name={p.name} url={p.avatar_url} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    {c.message && (
                      <div className="text-sm text-muted-foreground truncate">"{c.message}"</div>
                    )}
                  </div>
                  <button
                    onClick={() => respond(c.id, "rejected")}
                    className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => respond(c.id, "accepted")}
                    className="text-sm bg-primary text-primary-foreground rounded-md px-3 py-1.5 flex items-center gap-1.5"
                  >
                    <UserCheck className="size-4" /> Accept
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
          Your connections
        </h2>
        {combinedAccepted.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <UserPlus className="size-8 mx-auto text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No connections yet.</p>
            <Link to="/members" className="mt-3 inline-block text-sm text-primary hover:underline">
              Browse members →
            </Link>
          </div>
        )}
        <div className="space-y-1">
          {combinedAccepted.map((c) => {
            const other = c.requester_id === me ? c.addressee_id : c.requester_id;
            const p = combinedPmap.get(other);
            if (!p) return null;
            const room = me ? `loop-${[me, other].sort().join("-")}` : "";
            const callUrl = (audio: boolean) =>
              `https://meet.jit.si/${room}#config.startWithVideoMuted=${audio}`;
            return (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-lg p-3 hover:bg-secondary/60 transition-colors group"
              >
                <Link
                  to="/messages/$id"
                  params={{ id: other }}
                  className="flex items-center gap-3 min-w-0 flex-1"
                >
                  <Avatar name={p.name} url={p.avatar_url} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-sm text-muted-foreground truncate">{p.role || "—"}</div>
                  </div>
                </Link>
                <div className="flex items-center gap-1 opacity-80">
                  <Link
                    to="/messages/$id"
                    params={{ id: other }}
                    title="Chat"
                    className="size-9 inline-flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    <MessageSquare className="size-4" />
                  </Link>
                  <a
                    href={callUrl(true)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Voice call"
                    className="size-9 inline-flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    <Phone className="size-4" />
                  </a>
                  <a
                    href={callUrl(false)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Video call"
                    className="size-9 inline-flex items-center justify-center rounded-md hover:bg-secondary text-primary"
                  >
                    <Video className="size-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
