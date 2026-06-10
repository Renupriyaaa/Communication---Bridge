/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Coffee, Check, X } from "lucide-react";
import { Avatar } from "./members";
import { PURPOSE_LABELS } from "@/lib/profile-helpers";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/coffee-chats")({
  head: () => ({ meta: [{ title: "Coffee chats — Communication---Bridge" }] }),
  component: CoffeePage,
});

function CoffeePage() {
  const qc = useQueryClient();
  const { data: me } = useQuery({
    queryKey: ["me-id"],
    queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null,
  });
  const { data: chats = [] } = useQuery({
    queryKey: ["coffee-chats"],
    queryFn: async () =>
      (await supabase.from("coffee_chats").select("*").order("created_at", { ascending: false }))
        .data ?? [],
  });
  const otherIds = Array.from(
    new Set(chats.flatMap((c) => [c.requester_id, c.recipient_id]).filter((x) => x !== me)),
  );
  const { data: profiles = [] } = useQuery({
    queryKey: ["cc-profiles", otherIds.join(",")],
    enabled: otherIds.length > 0,
    queryFn: async () =>
      (await supabase.from("profiles").select("*").in("id", otherIds)).data ?? [],
  });
  const pmap = new Map(profiles.map((p) => [p.id, p]));

  async function setStatus(
    id: string,
    status: "accepted" | "declined" | "cancelled" | "completed",
  ) {
    if (id.startsWith("mock-")) {
      setMockChats((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
      toast.success("Updated");
      return;
    }
    const { error } = await supabase.from("coffee_chats").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    qc.invalidateQueries({ queryKey: ["coffee-chats"] });
  }

  const [mockChats, setMockChats] = useState([
    {
      id: "mock-chat-1",
      requester_id: "mock-cc-1",
      recipient_id: me || "me",
      status: "pending",
      duration_minutes: 30,
      purpose: "career_guidance",
      message: "Investor intro chat.",
    },
    {
      id: "mock-chat-2",
      requester_id: "mock-cc-2",
      recipient_id: me || "me",
      status: "pending",
      duration_minutes: 15,
      purpose: "startup_discussion",
      message: "Indie hacker chat?",
    },
    {
      id: "mock-chat-3",
      requester_id: "mock-cc-3",
      recipient_id: me || "me",
      status: "accepted",
      duration_minutes: 30,
      purpose: "collaboration",
      message: "Brainstorm OpenLoop integration.",
    },
    {
      id: "mock-chat-4",
      requester_id: "mock-cc-4",
      recipient_id: me || "me",
      status: "accepted",
      duration_minutes: 15,
      purpose: "networking",
      message: "General networking",
    },
  ]);

  const mockProfilesData = new Map([
    ["mock-cc-1", { id: "mock-cc-1", name: "Meera Nair", avatar_url: "https://i.pravatar.cc/150?u=Meera" }],
    ["mock-cc-2", { id: "mock-cc-2", name: "Arjun Patel", avatar_url: "https://i.pravatar.cc/150?u=Arjun" }],
    ["mock-cc-3", { id: "mock-cc-3", name: "Aarav Mehta", avatar_url: "https://i.pravatar.cc/150?u=Aarav" }],
    ["mock-cc-4", { id: "mock-cc-4", name: "Priya Sharma", avatar_url: "https://i.pravatar.cc/150?u=Priya" }],
  ]);

  const combinedChats = [...mockChats, ...chats] as typeof chats;
  const combinedPmap = new Map([...mockProfilesData, ...Array.from(pmap.entries())]) as typeof pmap;

  const incoming = combinedChats.filter((c) => c.recipient_id === (me || "me") && c.status === "pending");
  const outgoing = combinedChats.filter((c) => c.requester_id === (me || "me"));
  const accepted = combinedChats.filter((c) => c.status === "accepted");

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Coffee chats</h1>
      <p className="text-muted-foreground mt-1">Structured 15/30/45-minute sessions.</p>

      <Section title={`Incoming (${incoming.length})`}>
        {incoming.length === 0 && <Empty>No incoming requests.</Empty>}
        {incoming.map((c) => (
          <ChatRow key={c.id} chat={c} other={combinedPmap.get(c.requester_id)}>
            <button
              onClick={() => setStatus(c.id, "declined")}
              className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md"
            >
              <X className="size-4 inline mr-1" />
              Decline
            </button>
            <button
              onClick={() => setStatus(c.id, "accepted")}
              className="text-sm bg-primary text-primary-foreground rounded-md px-3 py-1.5"
            >
              <Check className="size-4 inline mr-1" />
              Accept
            </button>
          </ChatRow>
        ))}
      </Section>

      <Section title={`Upcoming (${accepted.length})`}>
        {accepted.length === 0 && <Empty>No upcoming coffee chats.</Empty>}
        {accepted.map((c) => {
          const other = combinedPmap.get(c.requester_id === (me || "me") ? c.recipient_id : c.requester_id);
          return (
            <ChatRow key={c.id} chat={c} other={other}>
              <span className="text-xs rounded-full border border-success/30 bg-success/10 text-success px-2 py-1">
                Accepted
              </span>
            </ChatRow>
          );
        })}
      </Section>

      <Section title={`Sent (${outgoing.length})`}>
        {outgoing.length === 0 && <Empty>No sent requests.</Empty>}
        {outgoing.map((c) => (
          <ChatRow key={c.id} chat={c} other={combinedPmap.get(c.recipient_id)}>
            <span className="text-xs text-muted-foreground">{c.status}</span>
          </ChatRow>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground text-center">
      {children}
    </div>
  );
}
function ChatRow({ chat, other, children }: { chat: any; other: any; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
      <div className="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
        <Coffee className="size-5" />
      </div>
      {other && <Avatar name={other.name} url={other.avatar_url} size={36} />}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{other?.name ?? "Member"}</div>
        <div className="text-sm text-muted-foreground truncate">
          {chat.duration_minutes} min · {PURPOSE_LABELS[chat.purpose]}
          {chat.message && ` · "${chat.message}"`}
        </div>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
