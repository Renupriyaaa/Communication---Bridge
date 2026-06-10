/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Match = {
  profile: any;
  score: number;
  shared: string[];
  reason: string;
};

export const computeMatches = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: me } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (!me) throw new Error("Profile not found. Set up your profile first.");

    const { data: others } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", userId)
      .limit(60);
    const candidates = (others ?? []).filter(
      (p) => p.status !== "not_accepting" && p.status !== "busy",
    );

    if (candidates.length === 0) return { matches: [] };

    // Heuristic pre-ranking to keep AI prompt small
    const lower = (a: string[]) => (a || []).map((s) => s.toLowerCase());
    const meSkills = new Set(lower(me.skills));
    const meInterests = new Set(lower(me.interests));
    const meSeek = new Set(lower(me.seeking_skills));
    const meOffer = new Set(lower(me.offering_skills));

    const scored = candidates
      .map((c) => {
        const cSkills = new Set(lower(c.skills));
        const cInterests = new Set(lower(c.interests));
        const cSeek = new Set(lower(c.seeking_skills));
        const cOffer = new Set(lower(c.offering_skills));
        const sharedInterests = [...meInterests].filter((x) => cInterests.has(x));
        const sharedSkills = [...meSkills].filter((x) => cSkills.has(x));
        const complement =
          [...meOffer].filter((x) => cSeek.has(x)).length +
          [...meSeek].filter((x) => cOffer.has(x)).length;
        const score = sharedInterests.length * 3 + sharedSkills.length * 2 + complement * 4;
        const shared = Array.from(new Set([...sharedInterests, ...sharedSkills]));
        return { c, score, shared };
      })
      .sort((a, b) => b.score - a.score);

    const top = scored.slice(0, 8);

    // AI re-rank + reasons via Lovable AI
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return {
        matches: top.map(({ c, score, shared }) => ({
          profile: c,
          score: Math.min(99, 50 + score * 4),
          shared,
          reason: shared.length
            ? `You both care about ${shared.slice(0, 3).join(", ")}.`
            : `Could be a good networking fit.`,
        })) as Match[],
      };
    }

    const prompt = {
      me: {
        name: me.name,
        role: me.role,
        bio: me.bio,
        goals: me.career_goals,
        skills: me.skills,
        interests: me.interests,
        offering: me.offering_skills,
        seeking: me.seeking_skills,
      },
      candidates: top.map(({ c }) => ({
        id: c.id,
        name: c.name,
        role: c.role,
        bio: c.bio,
        goals: c.career_goals,
        skills: c.skills,
        interests: c.interests,
        offering: c.offering_skills,
        seeking: c.seeking_skills,
      })),
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You rank networking matches. Return ONLY JSON: { matches: [{ id, score (0-100), reason (1 sentence) }] }. Sort by score desc. Be concrete and warm.",
          },
          { role: "user", content: JSON.stringify(prompt) },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("AI rate limit reached. Try again in a moment.");
    if (res.status === 402)
      throw new Error("AI credits exhausted. Add credits in workspace billing.");
    if (!res.ok) {
      const text = await res.text();
      console.error("AI gateway error", res.status, text);
      throw new Error(`AI gateway failed (${res.status})`);
    }

    const json = await res.json();
    let parsed: { matches: Array<{ id: string; score: number; reason: string }> } = { matches: [] };
    try {
      parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}");
    } catch {
      parsed = { matches: [] };
    }

    const byId = new Map(top.map(({ c, shared }) => [c.id, { c, shared }]));
    const aiMatches: Match[] = (parsed.matches ?? [])
      .map((m) => {
        const entry = byId.get(m.id);
        if (!entry) return null;
        return {
          profile: entry.c,
          score: Math.max(0, Math.min(99, Math.round(m.score))),
          shared: entry.shared,
          reason: m.reason,
        };
      })
      .filter(Boolean) as Match[];

    if (aiMatches.length === 0) {
      return {
        matches: top.map(({ c, score, shared }) => ({
          profile: c,
          score: Math.min(99, 50 + score * 4),
          shared,
          reason: shared.length
            ? `You both care about ${shared.slice(0, 3).join(", ")}.`
            : `Could be a good networking fit.`,
        })),
      };
    }

    return { matches: aiMatches };
  });
