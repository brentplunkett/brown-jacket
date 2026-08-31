import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PlayerName, RoundKey } from "./tournament";
import { scoreKey, type ScoreMap, type ScrambleMap, type WolfCall } from "./scoring";

export type TournamentState = {
  scores: ScoreMap;
  calls: Record<number, WolfCall>;
  scramble: ScrambleMap;
  loading: boolean;
};

export function useTournament() {
  const [state, setState] = useState<TournamentState>({
    scores: {},
    calls: {},
    scramble: {},
    loading: true,
  });

  const load = useCallback(async () => {
    const [hs, wc, ss] = await Promise.all([
      supabase.from("hole_scores").select("round_key,hole,player,strokes"),
      supabase.from("wolf_calls").select("hole,wolf,partner,blind"),
      supabase.from("scramble_scores").select("hole,team,strokes"),
    ]);

    const scores: ScoreMap = {};
    (hs.data ?? []).forEach((r) => {
      if (r.strokes != null)
        scores[scoreKey(r.round_key as RoundKey, r.hole, r.player as PlayerName)] = r.strokes;
    });
    const calls: Record<number, WolfCall> = {};
    (wc.data ?? []).forEach((r) => {
      calls[r.hole] = {
        hole: r.hole,
        wolf: r.wolf as PlayerName,
        partner: (r.partner as PlayerName | null) ?? null,
        blind: r.blind,
      };
    });
    const scramble: ScrambleMap = {};
    (ss.data ?? []).forEach((r) => {
      if (r.strokes != null) scramble[`${r.hole}:${r.team}`] = r.strokes;
    });

    setState({ scores, calls, scramble, loading: false });
  }, []);

  useEffect(() => {
    void load();
    const channel = supabase
      .channel("brown-jacket")
      .on("postgres_changes", { event: "*", schema: "public", table: "hole_scores" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "wolf_calls" }, () => void load())
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scramble_scores" },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const setScore = useCallback(
    async (round: RoundKey, hole: number, player: PlayerName, strokes: number | null) => {
      setState((s) => {
        const scores = { ...s.scores };
        const k = scoreKey(round, hole, player);
        if (strokes == null) delete scores[k];
        else scores[k] = strokes;
        return { ...s, scores };
      });
      await supabase
        .from("hole_scores")
        .upsert(
          { round_key: round, hole, player, strokes, updated_at: new Date().toISOString() },
          { onConflict: "round_key,hole,player" },
        );
    },
    [],
  );

  const setScrambleScore = useCallback(
    async (hole: number, team: string, strokes: number | null) => {
      setState((s) => {
        const scramble = { ...s.scramble };
        if (strokes == null) delete scramble[`${hole}:${team}`];
        else scramble[`${hole}:${team}`] = strokes;
        return { ...s, scramble };
      });
      await supabase
        .from("scramble_scores")
        .upsert(
          { hole, team, strokes, updated_at: new Date().toISOString() },
          { onConflict: "hole,team" },
        );
    },
    [],
  );

  const setWolfCall = useCallback(async (call: WolfCall) => {
    setState((s) => ({ ...s, calls: { ...s.calls, [call.hole]: call } }));
    await supabase.from("wolf_calls").upsert(
      {
        hole: call.hole,
        wolf: call.wolf,
        partner: call.partner,
        blind: call.blind,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "hole" },
    );
  }, []);

  return { ...state, setScore, setScrambleScore, setWolfCall, reload: load };
}

export function useSession() {
  const [session, setSession] = useState<{ email?: string } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s ? { email: s.user.email ?? undefined } : null);
      setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ? { email: data.session.user.email ?? undefined } : null);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, ready };
}
