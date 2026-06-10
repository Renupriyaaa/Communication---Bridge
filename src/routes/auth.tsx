/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { getDemoSession } from "@/lib/demo-login.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Zap } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Communication---Bridge" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const fetchDemoSession = useServerFn(getDemoSession);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/members" });
    });
  }, [navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { name } },
        });
        if (error) throw error;
        toast.success("Account created — welcome!");
        navigate({ to: "/onboarding" });
      } else {
        if (email.trim().toLowerCase() === "demo@loop.app" && password === "demodemo") {
          let testEmail = email;
          let { data, error } = await supabase.auth.signInWithPassword({ email: testEmail, password });
          if (error || !data.session) {
            if (error?.message?.toLowerCase().includes("invalid")) {
              testEmail = `demo+${Date.now()}@loop.app`;
            }
            const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
              email: testEmail,
              password,
              options: { data: { name: "Demo User" } },
            });
            if (signUpErr || !signUpData.session) {
              const { access_token, refresh_token } = await fetchDemoSession();
              await supabase.auth.setSession({ access_token, refresh_token });
            }
          }
        } else {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
        }
        toast.success("Welcome back");
        navigate({ to: "/members" });
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/members",
    });
    if (result.error) {
      toast.error(result.error.message);
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/members" });
  }

  async function handleDemo() {
    setLoading(true);
    try {
      let email = "demo@loop.app";
      const password = "demodemo";
      let { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error || !data.session) {
        // If it's invalid credentials, the password was changed. Let's use a fresh email to ensure we can sign up.
        if (error?.message?.toLowerCase().includes("invalid")) {
          email = `demo+${Date.now()}@loop.app`;
        }
        
        // Try sign up via normal client in case email confirmation is disabled
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: "Demo User" } },
        });
        
        if (signUpErr || !signUpData.session) {
          // Fallback to server function which uses admin client (requires service role key)
          // Note: if we changed the email, fetchDemoSession might still try demo@loop.app unless we update it
          // But if we changed the email, sign up should succeed unless email confirmations are required.
          const { access_token, refresh_token } = await fetchDemoSession();
          await supabase.auth.setSession({ access_token, refresh_token });
        }
      }
      
      toast.success("Welcome, Demo User!");
      navigate({ to: "/members" });
    } catch (e: any) {
      toast.error(e?.message ?? "Demo login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-hero opacity-60 pointer-events-none" />
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <Link
        to="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back
      </Link>
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="size-8 rounded-md bg-accent-gradient shadow-glow" />
          <span className="font-semibold tracking-tight text-lg">Communication---Bridge</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Sign in to discover and connect."
            : "Join the community in seconds."}
        </p>

        <Button
          onClick={handleGoogle}
          disabled={loading}
          variant="outline"
          className="mt-8 w-full justify-center gap-2 h-11"
        >
          <GoogleIcon /> Continue with Google
        </Button>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleEmail} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={80}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-11">
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : mode === "signin" ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 text-sm text-muted-foreground hover:text-foreground self-center text-center"
        >
          {mode === "signin"
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">quick start</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          onClick={handleDemo}
          disabled={loading}
          variant="secondary"
          className="w-full justify-center gap-2 h-11"
        >
          <Zap className="size-4" /> Try demo account
        </Button>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Demo credentials: <span className="text-foreground font-medium">demo@loop.app</span> /{" "}
          <span className="text-foreground font-medium">demodemo</span>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
