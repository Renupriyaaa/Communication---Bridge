/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, ExternalLink, Megaphone } from "lucide-react";
import { OPP_LABELS, parseTags } from "@/lib/profile-helpers";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/opportunities")({
  head: () => ({ meta: [{ title: "Opportunities — Communication---Bridge" }] }),
  component: OppPage,
});

function OppPage() {
  const { data: opps = [] } = useQuery({
    queryKey: ["opportunities"],
    queryFn: async () =>
      (await supabase.from("opportunities").select("*").order("created_at", { ascending: false }))
        .data ?? [],
  });
  const [filter, setFilter] = useState<string>("all");
  const filtered = filter === "all" ? opps : opps.filter((o) => o.type === filter);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Opportunities</h1>
          <p className="text-muted-foreground mt-1">
            Internships, hackathons, gigs, and roles from the community.
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {Object.entries(OPP_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <CreateOpp />
        </div>
      </header>

      <div className="mt-8 grid gap-3">
        {filtered.length === 0 && (
          <div className="text-muted-foreground text-center py-12">Nothing posted yet.</div>
        )}
        {filtered.map((o) => (
          <div
            key={o.id}
            className="rounded-xl border border-border bg-card p-5 flex items-start gap-4"
          >
            <div className="size-10 rounded-md bg-warning/10 text-warning flex items-center justify-center">
              <Megaphone className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium">{o.title}</h3>
                <span className="text-xs rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-muted-foreground">
                  {OPP_LABELS[o.type]}
                </span>
                {o.location && (
                  <span className="text-xs text-muted-foreground">· {o.location}</span>
                )}
              </div>
              {o.description && (
                <p className="mt-2 text-sm text-muted-foreground">{o.description}</p>
              )}
              {o.link && (
                <a
                  href={o.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Open <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreateOpp() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    title: "",
    description: "",
    type: "internship",
    link: "",
    location: "",
    tags: "",
  });
  async function submit() {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("opportunities").insert({
      poster_id: u.user!.id,
      title: f.title,
      description: f.description,
      type: f.type as any,
      link: f.link || null,
      location: f.location || null,
      tags: parseTags(f.tags),
    });
    if (error) return toast.error(error.message);
    toast.success("Opportunity posted");
    setOpen(false);
    setF({ title: "", description: "", type: "internship", link: "", location: "", tags: "" });
    qc.invalidateQueries({ queryKey: ["opportunities"] });
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Post
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Post an opportunity</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              value={f.title}
              onChange={(e) => setF({ ...f, title: e.target.value })}
              maxLength={120}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(OPP_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={f.description}
              onChange={(e) => setF({ ...f, description: e.target.value })}
              maxLength={800}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Link (optional)</Label>
            <Input
              value={f.link}
              onChange={(e) => setF({ ...f, link: e.target.value })}
              placeholder="https://"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Location (optional)</Label>
            <Input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={!f.title.trim()}>
            Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
