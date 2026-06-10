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
import { Plus, Briefcase, Users } from "lucide-react";
import { parseTags } from "@/lib/profile-helpers";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({ meta: [{ title: "Projects — Communication---Bridge" }] }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const qc = useQueryClient();
  const { data: me } = useQuery({
    queryKey: ["me-id"],
    queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null,
  });
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () =>
      (
        await supabase
          .from("projects")
          .select("*")
          .eq("is_open", true)
          .order("created_at", { ascending: false })
      ).data ?? [],
  });
  const ownerIds = Array.from(new Set(projects.map((p) => p.owner_id)));
  const { data: owners = [] } = useQuery({
    queryKey: ["proj-owners", ownerIds.join(",")],
    enabled: ownerIds.length > 0,
    queryFn: async () =>
      (await supabase.from("profiles").select("id,name,avatar_url").in("id", ownerIds)).data ?? [],
  });
  const omap = new Map(owners.map((o: any) => [o.id, o]));

  async function apply(id: string) {
    const { error } = await supabase
      .from("project_applications")
      .insert({ project_id: id, applicant_id: me!, pitch: "" });
    if (error) return toast.error(error.message);
    toast.success("Application sent");
    qc.invalidateQueries({ queryKey: ["projects"] });
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Find collaborators or post your own project.</p>
        </div>
        <CreateProject />
      </header>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {projects.length === 0 && (
          <div className="col-span-full text-muted-foreground text-center py-12">
            No open projects yet.
          </div>
        )}
        {projects.map((p) => {
          const o: any = omap.get(p.owner_id);
          return (
            <div key={p.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <Briefcase className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-muted-foreground">by {o?.name ?? "Member"}</div>
                </div>
              </div>
              {p.description && (
                <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{p.description}</p>
              )}
              {p.looking_for?.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Users className="size-3" /> Looking for
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.looking_for.map((s: string) => (
                      <span
                        key={s}
                        className="text-xs rounded-md border border-primary/30 bg-primary/10 text-primary px-2 py-0.5"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {p.owner_id !== me && (
                <Button size="sm" variant="outline" className="mt-4" onClick={() => apply(p.id)}>
                  I'm interested
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CreateProject() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  async function submit() {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("projects").insert({
      owner_id: u.user!.id,
      title,
      description,
      looking_for: parseTags(lookingFor),
    });
    if (error) return toast.error(error.message);
    toast.success("Project posted");
    setOpen(false);
    setTitle("");
    setDescription("");
    setLookingFor("");
    qc.invalidateQueries({ queryKey: ["projects"] });
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> New project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Post a project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Looking for (comma-separated)</Label>
            <Input
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              placeholder="Frontend Developer, UI Designer"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={!title.trim()}>
            Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
