export const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  open_to_networking: {
    label: "Open to networking",
    tone: "bg-success/15 text-success border-success/30",
  },
  open_to_mentorship: {
    label: "Open to mentorship",
    tone: "bg-primary/15 text-primary border-primary/30",
  },
  looking_for_collaborators: {
    label: "Looking for collaborators",
    tone: "bg-warning/15 text-warning border-warning/30",
  },
  busy: { label: "Busy", tone: "bg-muted text-muted-foreground border-border" },
  not_accepting: {
    label: "Not accepting",
    tone: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

export const PURPOSE_LABELS: Record<string, string> = {
  mentorship: "Mentorship",
  career_guidance: "Career guidance",
  startup_discussion: "Startup discussion",
  collaboration: "Collaboration",
  networking: "Networking",
};

export const OPP_LABELS: Record<string, string> = {
  internship: "Internship",
  hackathon: "Hackathon",
  competition: "Competition",
  freelance: "Freelance",
  startup_role: "Startup role",
  other: "Other",
};

export function initials(name: string) {
  return (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function parseTags(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 30);
}
