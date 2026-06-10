/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "./members";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, Video, Phone } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/messages/$id")({
  head: () => ({ meta: [{ title: "Chat — Communication---Bridge" }] }),
  component: ChatPage,
});

function ChatPage() {
  const { id: otherId } = Route.useParams();
  const qc = useQueryClient();
  const { data: me } = useQuery({
    queryKey: ["me-id"],
    queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null,
  });
  const { data: other } = useQuery({
    queryKey: ["profile", otherId],
    queryFn: async () =>
      (await supabase.from("profiles").select("*").eq("id", otherId).maybeSingle()).data,
  });
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", me, otherId],
    enabled: !!me,
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${me},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${me})`,
        )
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    if (!me) return;
    const ch = supabase
      .channel(`dm-${me}-${otherId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const row: any = payload.new;
          if (
            (row.sender_id === me && row.recipient_id === otherId) ||
            (row.sender_id === otherId && row.recipient_id === me)
          ) {
            qc.invalidateQueries({ queryKey: ["messages", me, otherId] });
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [me, otherId, qc]);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !me) return;
    setSending(true);
    const { error } = await supabase
      .from("messages")
      .insert({ sender_id: me, recipient_id: otherId, content: text.trim() });
    setSending(false);
    if (error) return toast.error(error.message);
    setText("");
    qc.invalidateQueries({ queryKey: ["messages", me, otherId] });
  }

  function startCall(kind: "video" | "audio") {
    if (!me) return;
    const room = `loop-${[me, otherId].sort().join("-")}`;
    const url = `https://meet.jit.si/${room}#config.startWithVideoMuted=${kind === "audio"}`;
    window.open(url, "_blank", "noopener,noreferrer");
    supabase
      .from("messages")
      .insert({
        sender_id: me,
        recipient_id: otherId,
        content: `📞 Started a ${kind} call — join here: ${url}`,
      })
      .then(() => qc.invalidateQueries({ queryKey: ["messages", me, otherId] }));
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] md:h-screen">
      <header className="border-b border-border bg-card/40 px-4 py-3 flex items-center gap-3">
        <Link to="/messages" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        {other && (
          <Link
            to="/members/$id"
            params={{ id: otherId }}
            className="flex items-center gap-3 min-w-0 flex-1"
          >
            <Avatar name={other.name} url={other.avatar_url} size={36} />
            <div className="min-w-0">
              <div className="font-medium truncate">{other.name}</div>
              <div className="text-xs text-muted-foreground truncate">{other.role}</div>
            </div>
          </Link>
        )}
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => startCall("audio")} title="Voice call">
            <Phone className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => startCall("video")} title="Video call">
            <Video className="size-4" />
          </Button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-12 text-sm">Say hello 👋</div>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === me;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}
              >
                {m.content}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="border-t border-border bg-card/40 p-3 flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          autoFocus
        />
        <Button type="submit" disabled={sending || !text.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
