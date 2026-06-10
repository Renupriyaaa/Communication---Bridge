/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { STATUS_LABELS, parseTags } from "@/lib/profile-helpers";

export const Route = createFileRoute("/_authenticated/me")({
  head: () => ({ meta: [{ title: "My profile — Communication---Bridge" }] }),
  component: MePage,
});

function MePage() {
  const navigate = useNavigate();
  const { data: profile, refetch } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.user.id)
        .maybeSingle();
      return data;
    },
  });

  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  if (!form) return <div className="p-8 text-muted-foreground">Loading…</div>;

  async function save() {
    setSaving(true);
    const payload = {
      ...form,
      skills: Array.isArray(form.skills) ? form.skills : parseTags(form.skills || ""),
      interests: Array.isArray(form.interests) ? form.interests : parseTags(form.interests || ""),
      offering_skills: Array.isArray(form.offering_skills)
        ? form.offering_skills
        : parseTags(form.offering_skills || ""),
      seeking_skills: Array.isArray(form.seeking_skills)
        ? form.seeking_skills
        : parseTags(form.seeking_skills || ""),
      onboarded: true,
    };
    const { error } = await supabase.from("profiles").update(payload).eq("id", form.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
    refetch();
  }

  const set = (k: string, v: any) => setForm({ ...form, [k]: v });
  const arr = (k: string) => (Array.isArray(form[k]) ? form[k].join(", ") : form[k] || "");

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Help others discover and connect with you.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate({ to: "/members/$id", params: { id: form.id } })}
        >
          View as visitor
        </Button>
      </div>

      <div className="mt-8 space-y-5">
        <Section title="Basics">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={80} />
          </Field>
          <Field label="Role / headline">
            <Input
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              placeholder="Frontend Engineer, Founder, etc."
              maxLength={80}
            />
          </Field>
          <Field label="Company / college">
            <Input
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              maxLength={80}
            />
          </Field>
          <Field label="Location">
            <Input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              maxLength={80}
            />
          </Field>
          <Field label="Industry">
            <Input
              value={form.industry}
              onChange={(e) => set("industry", e.target.value)}
              maxLength={80}
            />
          </Field>
          <Field label="Avatar URL">
            <Input
              value={form.avatar_url || ""}
              onChange={(e) => set("avatar_url", e.target.value)}
              placeholder="https://..."
            />
          </Field>
        </Section>

        <Section title="About">
          <Field label="Bio">
            <Textarea
              rows={4}
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              maxLength={500}
              placeholder="Tell people about yourself."
            />
          </Field>
          <Field label="Career goals">
            <Textarea
              rows={2}
              value={form.career_goals}
              onChange={(e) => set("career_goals", e.target.value)}
              maxLength={300}
            />
          </Field>
        </Section>

        <Section title="Skills & interests">
          <Field label="Skills (comma-separated)">
            <Input
              value={arr("skills")}
              onChange={(e) => set("skills", e.target.value)}
              placeholder="React, TypeScript, Design"
            />
          </Field>
          <Field label="Interests (comma-separated)">
            <Input
              value={arr("interests")}
              onChange={(e) => set("interests", e.target.value)}
              placeholder="AI, Startups, Hackathons"
            />
          </Field>
        </Section>

        <Section title="Skill exchange">
          <Field label="Offering">
            <Input
              value={arr("offering_skills")}
              onChange={(e) => set("offering_skills", e.target.value)}
              placeholder="React mentoring"
            />
          </Field>
          <Field label="Looking for">
            <Input
              value={arr("seeking_skills")}
              onChange={(e) => set("seeking_skills", e.target.value)}
              placeholder="UI/UX feedback"
            />
          </Field>
        </Section>

        <Section title="Networking availability">
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([v, s]) => (
                  <SelectItem key={v} value={v}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </Section>

        <div className="flex justify-end gap-2 pt-4">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        {title}
      </h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 md:col-span-2 [&_textarea]:resize-none">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
