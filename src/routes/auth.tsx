import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, ArrowLeft, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clearFailures,
  formatCountdown,
  lockRemaining,
  registerFailure,
  attemptsLeft,
} from "@/lib/rate-limit";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In — TOKARsoft19" },
      {
        name: "description",
        content: "Access your Smart Money Concepts trading journal, analytics and SMC validator.",
      },
      { property: "og:title", content: "Sign In — TOKARsoft19" },
      {
        property: "og:description",
        content: "Access your Smart Money Concepts trading journal, analytics and SMC validator.",
      },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "verify" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [lock, setLock] = useState(0);

  const scope = mode === "forgot" ? "reset" : "login";

  useEffect(() => {
    setLock(lockRemaining(scope));
    const id = window.setInterval(() => setLock(lockRemaining(scope)), 1000);
    return () => window.clearInterval(id);
  }, [scope]);

  useEffect(() => {
    if (!loading && session && mode !== "verify") navigate({ to: "/dashboard" });
  }, [loading, session, navigate, mode]);

  const locked = lock > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (locked) return;
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/auth" },
        });
        if (error) throw error;
        setMode("verify");
        toast.success("We sent a 6-digit code to your email.");
      } else if (mode === "verify") {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token: code.trim(),
          type: "signup",
        });
        if (error) throw error;
        clearFailures("login");
        toast.success("Email verified. Loading your terminal…");
        navigate({ to: "/dashboard" });
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        registerFailure("reset");
        setLock(lockRemaining("reset"));
        toast.success("Password reset link sent. Check your inbox.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          const remaining = registerFailure("login");
          setLock(remaining);
          if (/confirm/i.test(error.message)) {
            setMode("verify");
            toast.error("Email not verified yet. Enter the code we sent you.");
            return;
          }
          throw error;
        }
        clearFailures("login");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      const left = attemptsLeft(scope);
      toast.error(locked || left === 0 ? msg : `${msg} (${left} attempts left)`);
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) throw error;
      toast.success("New code sent.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resend code");
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth`,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  const titles: Record<Mode, string> = {
    signin: "Sign in to your terminal",
    signup: "Create your terminal",
    verify: "Verify your email",
    forgot: "Reset your password",
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Activity className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-[0.14em]">TOKARsoft19</p>
            <p className="tabular text-[10px] tracking-[0.28em] text-muted-foreground">TOKARsoft19</p>
          </div>
        </div>

        <h1 className="text-xl font-semibold tracking-tight">{titles[mode]}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {mode === "verify"
            ? `Enter the 6-digit code sent to ${email}`
            : mode === "forgot"
              ? "We will email you a secure link to set a new password."
              : "SMC / ICT journal, analytics and setup validation."}
        </p>

        {locked && (
          <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Too many attempts. Try again in{" "}
            <span className="tabular font-semibold">{formatCountdown(lock)}</span>.
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "verify" ? (
            <div className="space-y-2">
              <Label htmlFor="code">Verification code</Label>
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={8}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="tabular tracking-[0.4em]"
              />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trader@desk.com"
                />
              </div>
              {mode !== "forgot" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline"
                        onClick={() => setMode("forgot")}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              )}
            </>
          )}

          <Button type="submit" className="w-full" disabled={busy || locked}>
            {busy
              ? "Working…"
              : mode === "signin"
                ? "Sign in"
                : mode === "signup"
                  ? "Send verification code"
                  : mode === "verify"
                    ? "Verify and continue"
                    : "Send reset link"}
          </Button>
        </form>

        {mode === "verify" && (
          <div className="mt-4 space-y-2 text-center">
            <button className="text-xs text-primary hover:underline" onClick={resend}>
              <MailCheck className="mr-1 inline size-3" /> Resend code
            </button>
            <button
              className="flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setMode("signin")}
            >
              <ArrowLeft className="size-3" /> Back to sign in
            </button>
          </div>
        )}

        {(mode === "signin" || mode === "signup") && (
          <>
            <Button variant="outline" className="mt-3 w-full" onClick={google}>
              Continue with Google
            </Button>
            <button
              className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "No account yet? Create one" : "Already registered? Sign in"}
            </button>
          </>
        )}

        {mode === "forgot" && (
          <button
            className="mt-4 flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setMode("signin")}
          >
            <ArrowLeft className="size-3" /> Back to sign in
          </button>
        )}
      </div>
    </div>
  );
}
