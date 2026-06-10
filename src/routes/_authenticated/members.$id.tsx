/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, StatusPill } from "./members";
import { Coffee, MessageSquare, UserPlus, Check, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { PURPOSE_LABELS } from "@/lib/profile-helpers";

export const Route = createFileRoute("/_authenticated/members/$id")({
  head: () => ({ meta: [{ title: "Profile — Communication---Bridge" }] }),
  component: MemberDetail,
});

function MemberDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: me } = useQuery({
    queryKey: ["me-id"],
    queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null,
  });
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", id],
    queryFn: async () =>
      (await supabase.from("profiles").select("*").eq("id", id).maybeSingle()).data,
  });
  const { data: conn } = useQuery({
    queryKey: ["conn", me, id],
    enabled: !!me,
    queryFn: async () => {
      const { data } = await supabase
        .from("connections")
        .select("*")
        .or(
          `and(requester_id.eq.${me},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${me})`,
        )
        .maybeSingle();
      return data;
    },
  });

  const sendConnect = useMutation({
    mutationFn: async (message: string) => {
      const { error } = await supabase
        .from("connections")
        .insert({ requester_id: me!, addressee_id: id, message });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Request sent");
      qc.invalidateQueries({ queryKey: ["conn", me, id] });
    },
    onError: (e: any) => toast.error(e.message),
  });
  const acceptConn = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("connections")
        .update({ status: "accepted" })
        .eq("id", conn!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Connected!");
      qc.invalidateQueries({ queryKey: ["conn", me, id] });
    },
  });

  if (isLoading) return <div className="p-10 text-muted-foreground">Loading…</div>;
  if (!profile) return <div className="p-10 text-muted-foreground">Member not found.</div>;

  const isMe = profile.id === me;
  const connected = conn?.status === "accepted";
  const pendingOut = conn?.status === "pending" && conn.requester_id === me;
  const pendingIn = conn?.status === "pending" && conn.addressee_id === me;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="rounded-2xl border border-border bg-card p-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <Avatar name={profile.name} url={profile.avatar_url} size={88} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">{profile.name || "Unnamed"}</h1>
              <StatusPill status={profile.status} />
            </div>
            <p className="text-muted-foreground mt-1">
              {profile.role}
              {profile.company && ` · ${profile.company}`}
              {profile.location && ` · ${profile.location}`}
            </p>
            {profile.bio && <p className="mt-4 text-sm leading-relaxed max-w-2xl">{profile.bio}</p>}
          </div>
          {!isMe && (
            <div className="flex flex-wrap gap-2">
              {!conn && (
                <ConnectDialog
                  onSend={(msg) => sendConnect.mutate(msg)}
                  disabled={profile.status === "not_accepting"}
                />
              )}
              {pendingOut && (
                <Button disabled variant="outline">
                  <Clock className="size-4" /> Request pending
                </Button>
              )}
              {pendingIn && (
                <Button onClick={() => acceptConn.mutate()}>
                  <Check className="size-4" /> Accept request
                </Button>
              )}
              {connected && (
                <>
                  <Button onClick={() => navigate({ to: "/messages/$id", params: { id } })}>
                    <MessageSquare className="size-4" /> Message
                  </Button>
                  <CoffeeChatDialog recipientId={id} />
                </>
              )}
            </div>
          )}
          {isMe && (
            <Link to="/me">
              <Button variant="outline">Edit profile</Button>
            </Link>
          )}
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {profile.career_goals && (
            <Block title="Career goals">
              <p className="text-sm">{profile.career_goals}</p>
            </Block>
          )}
          {profile.industry && (
            <Block title="Industry">
              <p className="text-sm">{profile.industry}</p>
            </Block>
          )}
          <Block title="Skills">
            <Tags items={profile.skills} />
          </Block>
          <Block title="Interests">
            <Tags items={profile.interests} />
          </Block>
          {profile.offering_skills?.length > 0 && (
            <Block title="Offering">
              <Tags items={profile.offering_skills} tone="success" />
            </Block>
          )}
          {profile.seeking_skills?.length > 0 && (
            <Block title="Looking for">
              <Tags items={profile.seeking_skills} tone="primary" />
            </Block>
          )}
        </div>
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}
function Tags({ items, tone }: { items?: string[]; tone?: "success" | "primary" }) {
  if (!items?.length) return <p className="text-sm text-muted-foreground">—</p>;
  const cls =
    tone === "success"
      ? "bg-success/10 text-success border-success/30"
      : tone === "primary"
        ? "bg-primary/10 text-primary border-primary/30"
        : "bg-secondary/60 text-muted-foreground border-border";
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s) => (
        <span key={s} className={`text-xs rounded-md border px-2 py-0.5 ${cls}`}>
          {s}
        </span>
      ))}
    </div>
  );
}

function ConnectDialog({
  onSend,
  disabled,
}: {
  onSend: (msg: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <UserPlus className="size-4" /> Connect
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send connection request</DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="Optional intro message…"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          maxLength={300}
        />
        <DialogFooter>
          <Button
            onClick={() => {
              onSend(msg);
              setOpen(false);
              setMsg("");
            }}
          >
            Send request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CoffeeChatDialog({ recipientId }: { recipientId: string }) {
  const [open, setOpen] = useState(false);
  const [duration, setDuration] = useState("30");
  const [purpose, setPurpose] = useState("networking");
  const [message, setMessage] = useState("");
  const me = useQuery({
    queryKey: ["me-id"],
    queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null,
  }).data;

  async function send() {
    const { error } = await supabase.from("coffee_chats").insert({
      requester_id: me!,
      recipient_id: recipientId,
      duration_minutes: Number(duration),
      purpose: purpose as any,
      message,
    });
    if (error) return toast.error(error.message);
    toast.success("Coffee chat requested");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Coffee className="size-4" /> Coffee chat
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request a coffee chat</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Purpose</Label>
            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PURPOSE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={300}
              placeholder="What would you like to talk about?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={send}>Send request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
