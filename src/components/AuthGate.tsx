import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/lib/useTournament";

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, ready } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!ready) {
    return <div className="mono p-10 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (session) return <>{children}</>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fn = mode === "in" ? supabase.auth.signInWithPassword : supabase.auth.signUp;
    const { error } = await fn.call(supabase.auth, {
      email,
      password,
      ...(mode === "up" ? { options: { emailRedirectTo: window.location.origin } } : {}),
    } as never);
    if (error) setError(error.message);
    setBusy(false);
  };

  const google = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) setError("Google sign-in failed. Try email instead.");
  };

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <div className="border-2 border-ink bg-paper-panel p-7">
        <div className="rule-heading">Members only</div>
        <h1 className="mt-2 text-3xl leading-tight">The Brown Jacket Invitational</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in so your scores sync to everyone else's phone.
        </p>

        <button
          onClick={google}
          className="mono mt-6 w-full border-2 border-ink bg-paper px-4 py-2.5 text-sm uppercase tracking-widest transition-colors hover:bg-paper-dim"
        >
          Continue with Google
        </button>

        <div className="mono my-5 flex items-center gap-3 text-[0.65rem] uppercase tracking-widest text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full border border-input bg-paper px-3 py-2 text-sm outline-none focus:border-pine"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            className="w-full border border-input bg-paper px-3 py-2 text-sm outline-none focus:border-pine"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mono w-full bg-pine px-4 py-2.5 text-sm uppercase tracking-widest text-paper transition-colors hover:bg-pine-light disabled:opacity-60"
          >
            {mode === "in" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "in" ? "up" : "in")}
          className="mt-4 text-sm text-rust underline underline-offset-4"
        >
          {mode === "in" ? "First time? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
