import { createFileRoute, notFound } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { useTournament } from "@/lib/useTournament";
import {
  computeBestBall,
  computeScramble,
  computeSingles,
  computeWolf,
  getNet,
  type ScoreMap,
} from "@/lib/scoring";
import {
  BEST_BALL_SESSIONS,
  COURSES,
  PLAYERS,
  ROUND_BY_KEY,
  SCRAMBLE_TEAMS,
  SINGLES_SESSIONS,
  strokesOnHole,
  wolfForHole,
  type PlayerName,
  type RoundKey,
} from "@/lib/tournament";
import { fmt } from "./index";

const KEYS: RoundKey[] = ["r1", "r2", "r3", "r4"];

export const Route = createFileRoute("/round/$key")({
  beforeLoad: ({ params }) => {
    if (!KEYS.includes(params.key as RoundKey)) throw notFound();
  },
  head: ({ params }) => {
    const r = ROUND_BY_KEY[params.key as RoundKey];
    const title = r ? `Round ${r.n}: ${r.name} at ${r.course} · Brown Jacket` : "Round · Brown Jacket";
    const description = r
      ? `${r.scoring} scoring for the ${r.name} round at ${r.course}. ${r.points}.`
      : "Round scoring for the Brown Jacket Invitational.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: () => (
    <AuthGate>
      <RoundPage />
    </AuthGate>
  ),
});

function RoundPage() {
  const { key } = Route.useParams();
  const rk = key as RoundKey;
  const round = ROUND_BY_KEY[rk];
  const t = useTournament();
  const course = COURSES[round.course];

  return (
    <main className="pb-16">
      <header className="border-b-[6px] border-tobacco bg-pine px-5 py-8 text-paper">
        <div className="mx-auto max-w-3xl">
          <div className="mono text-[0.75rem] uppercase tracking-widest text-paper-dim">
            Round {round.n} · {round.when} · {round.scoring}
          </div>
          <h1 className="mt-2 text-4xl text-paper">
            {round.name} <span className="font-display italic text-gold">· {round.course}</span>
          </h1>
          <p className="mt-3 max-w-[55ch] text-sm text-paper-dim">{round.blurb}</p>
          <div className="mono mt-3 text-xs text-gold">{round.points}</div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5">
        {rk === "r2" ? (
          <ScrambleCard t={t} />
        ) : (
          <StrokeCard t={t} rk={rk} />
        )}

        <section className="mt-10">
          <h2 className="border-b-2 border-ink pb-2 text-2xl">Running result</h2>
          <div className="mt-4 space-y-2 text-sm">
            {rk === "r1" && <WolfResult t={t} />}
            {rk === "r2" && <ScrambleResult t={t} />}
            {rk === "r3" && <BestBallResult t={t} />}
            {rk === "r4" && <SinglesResult t={t} />}
          </div>
        </section>

        <p className="mono mt-8 text-[0.7rem] uppercase tracking-widest text-muted-foreground">
          Par {course.total} · {course.yards} yds · {course.rating}
        </p>
      </div>
    </main>
  );
}

type T = ReturnType<typeof useTournament>;

function ScoreInput({
  value,
  onChange,
  dots,
}: {
  value: number | null;
  onChange: (n: number | null) => void;
  dots?: number;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={20}
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? null : Math.max(1, Math.min(20, Number(v))));
        }}
        className="mono h-11 w-full border border-input bg-paper-panel text-center text-base outline-none focus:border-pine focus:bg-paper"
      />
      {!!dots && (
        <span className="pointer-events-none absolute right-1 top-0.5 text-[0.6rem] leading-none text-rust">
          {"•".repeat(dots)}
        </span>
      )}
    </div>
  );
}

function StrokeCard({ t, rk }: { t: T; rk: RoundKey }) {
  const round = ROUND_BY_KEY[rk];
  const course = COURSES[round.course];

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-ink pb-2">
        <h2 className="text-2xl">Scorecard</h2>
        <div className="mono text-[0.68rem] uppercase tracking-widest text-muted-foreground">
          Gross strokes · <span className="text-rust">•</span> = stroke given
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr>
              <th className="mono w-14 border-b-2 border-ink px-1 py-2 text-left text-[0.68rem] uppercase text-muted-foreground">
                Hole
              </th>
              <th className="mono w-12 border-b-2 border-ink px-1 py-2 text-[0.68rem] uppercase text-muted-foreground">
                Par
              </th>
              {PLAYERS.map((p) => (
                <th
                  key={p}
                  className="border-b-2 border-ink px-1 py-2 text-center font-display text-base"
                >
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 18 }, (_, i) => i + 1).map((hole) => (
              <tr key={hole} className={hole % 2 ? undefined : "bg-paper-panel/60"}>
                <td className="mono border-b border-border px-1 py-1.5 text-sm">
                  {hole}
                  <span className="ml-1 text-[0.6rem] text-muted-foreground">
                    si{course.si[hole - 1]}
                  </span>
                </td>
                <td className="mono border-b border-border px-1 py-1.5 text-center text-sm text-muted-foreground">
                  {course.par[hole - 1]}
                </td>
                {PLAYERS.map((p) => (
                  <td key={p} className="border-b border-border px-1 py-1.5">
                    <ScoreInput
                      value={t.scores[`${rk}:${hole}:${p}`] ?? null}
                      dots={strokesOnHole(p, round.course, hole)}
                      onChange={(n) => void t.setScore(rk, hole, p, n)}
                    />
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td colSpan={2} className="mono px-1 py-2 text-[0.68rem] uppercase text-muted-foreground">
                Gross / Net
              </td>
              {PLAYERS.map((p) => (
                <td key={p} className="mono px-1 py-2 text-center text-sm">
                  {totalGross(t.scores, rk, p)} / {totalNet(t.scores, rk, p)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {rk === "r1" && <WolfCalls t={t} />}
      {rk === "r3" && <PairingsNote />}
      {rk === "r4" && <SinglesNote />}
    </section>
  );
}

function totalGross(scores: ScoreMap, rk: RoundKey, p: PlayerName) {
  let sum = 0;
  for (let h = 1; h <= 18; h++) sum += scores[`${rk}:${h}:${p}`] ?? 0;
  return sum || "–";
}
function totalNet(scores: ScoreMap, rk: RoundKey, p: PlayerName) {
  let sum = 0;
  let any = false;
  for (let h = 1; h <= 18; h++) {
    const n = getNet(scores, rk, h, p);
    if (n != null) {
      sum += n;
      any = true;
    }
  }
  return any ? sum : "–";
}

function WolfCalls({ t }: { t: T }) {
  return (
    <div className="mt-8">
      <h3 className="border-b-2 border-ink pb-2 text-xl">Wolf calls</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Order is locked (Terb, Ross, Brent, Ryan). Pick the Wolf's partner, or leave it on Lone Wolf.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {Array.from({ length: 18 }, (_, i) => i + 1).map((hole) => {
          const wolf = wolfForHole(hole);
          const call = t.calls[hole];
          const partner = call?.partner ?? null;
          const blind = call?.blind ?? false;
          return (
            <div
              key={hole}
              className="flex items-center gap-2 border border-border bg-paper-panel px-3 py-2"
            >
              <div className="mono w-8 text-sm">{hole}</div>
              <div className="font-display text-sm text-pine">{wolf}</div>
              <select
                value={partner ?? ""}
                onChange={(e) =>
                  void t.setWolfCall({
                    hole,
                    wolf,
                    partner: (e.target.value || null) as PlayerName | null,
                    blind: e.target.value ? false : blind,
                  })
                }
                className="mono ml-auto border border-input bg-paper px-2 py-1 text-xs outline-none focus:border-pine"
              >
                <option value="">Lone Wolf</option>
                {PLAYERS.filter((p) => p !== wolf).map((p) => (
                  <option key={p} value={p}>
                    + {p}
                  </option>
                ))}
              </select>
              <label className="mono flex items-center gap-1 text-[0.65rem] uppercase text-muted-foreground">
                <input
                  type="checkbox"
                  checked={blind}
                  disabled={!!partner}
                  onChange={(e) =>
                    void t.setWolfCall({ hole, wolf, partner: null, blind: e.target.checked })
                  }
                />
                Blind
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PairingsNote() {
  return (
    <div className="mt-8 border border-border bg-paper-panel p-4">
      <h3 className="text-lg">Pairings</h3>
      <ul className="mono mt-2 space-y-1 text-sm">
        {BEST_BALL_SESSIONS.map((s) => (
          <li key={s.label}>
            {s.label} · {s.teamA.join(" / ")} vs {s.teamB.join(" / ")}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SinglesNote() {
  return (
    <div className="mt-8 border border-border bg-paper-panel p-4">
      <h3 className="text-lg">Matches</h3>
      <ul className="mono mt-2 space-y-1 text-sm">
        {SINGLES_SESSIONS.map((s) => (
          <li key={s.label}>
            {s.label} · {s.matches.map(([a, b]) => `${a} vs ${b}`).join("  |  ")}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScrambleCard({ t }: { t: T }) {
  const course = COURSES.Love;
  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-ink pb-2">
        <h2 className="text-2xl">Team scorecard</h2>
        <div className="mono text-[0.68rem] uppercase tracking-widest text-muted-foreground">
          Gross · no handicaps
        </div>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse">
          <thead>
            <tr>
              <th className="mono w-14 border-b-2 border-ink px-1 py-2 text-left text-[0.68rem] uppercase text-muted-foreground">
                Hole
              </th>
              <th className="mono w-12 border-b-2 border-ink px-1 py-2 text-[0.68rem] uppercase text-muted-foreground">
                Par
              </th>
              {SCRAMBLE_TEAMS.map((tm) => (
                <th
                  key={tm.key}
                  className="border-b-2 border-ink px-1 py-2 text-center font-display text-base"
                >
                  {tm.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 18 }, (_, i) => i + 1).map((hole) => (
              <tr key={hole} className={hole % 2 ? undefined : "bg-paper-panel/60"}>
                <td className="mono border-b border-border px-1 py-1.5 text-sm">{hole}</td>
                <td className="mono border-b border-border px-1 py-1.5 text-center text-sm text-muted-foreground">
                  {course.par[hole - 1]}
                </td>
                {SCRAMBLE_TEAMS.map((tm) => (
                  <td key={tm.key} className="border-b border-border px-1 py-1.5">
                    <ScoreInput
                      value={t.scramble[`${hole}:${tm.key}`] ?? null}
                      onChange={(n) => void t.setScrambleScore(hole, tm.key, n)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PointsRow({ points }: { points: Record<PlayerName, number> }) {
  return (
    <div className="mono mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-border pt-3 text-sm">
      {PLAYERS.map((p) => (
        <span key={p}>
          {p}: <span className="text-rust">{fmt(points[p])}</span> pts
        </span>
      ))}
    </div>
  );
}

function WolfResult({ t }: { t: T }) {
  const w = computeWolf(t.scores, t.calls);
  return (
    <div>
      <div className="mono flex flex-wrap gap-x-6 gap-y-1">
        {PLAYERS.map((p) => (
          <span key={p}>
            {p}: <span className="text-pine">{w.wolfPoints[p]}</span> wolf pts
          </span>
        ))}
      </div>
      <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
        {w.holeDetail.length === 0 && <li>No completed holes yet.</li>}
        {w.holeDetail.map((h) => (
          <li key={h.hole}>
            <span className="mono text-ink">{h.hole}</span> · {h.text}
          </li>
        ))}
      </ul>
      <PointsRow points={w.jacketPoints} />
    </div>
  );
}

function ScrambleResult({ t }: { t: T }) {
  const s = computeScramble(t.scramble);
  return (
    <div>
      <div className="mono flex flex-wrap gap-x-6">
        {SCRAMBLE_TEAMS.map((tm) => (
          <span key={tm.key}>
            {tm.label}: <span className="text-pine">{s.totals[tm.key] || "–"}</span> ({s.holesIn[tm.key]}
            /18)
          </span>
        ))}
      </div>
      {!s.complete && (
        <p className="mt-2 text-sm text-muted-foreground">Points award once all 18 holes are in.</p>
      )}
      <PointsRow points={s.jacketPoints} />
    </div>
  );
}

function BestBallResult({ t }: { t: T }) {
  const bb = computeBestBall(t.scores);
  return (
    <div>
      <ul className="space-y-1">
        {bb.sessions.map((s, i) => (
          <li key={s.label} className="mono">
            {s.label} · {BEST_BALL_SESSIONS[i].teamA.join("/")} vs{" "}
            {BEST_BALL_SESSIONS[i].teamB.join("/")} — <span className="text-pine">{s.status}</span>
            {s.decided ? " (final)" : ` (${s.holesPlayed}/6)`}
          </li>
        ))}
      </ul>
      <PointsRow points={bb.jacketPoints} />
    </div>
  );
}

function SinglesResult({ t }: { t: T }) {
  const sg = computeSingles(t.scores);
  return (
    <div>
      <ul className="space-y-1">
        {sg.matches.map((m) => (
          <li key={`${m.session}-${m.a}-${m.b}`} className="mono">
            {m.session} · {m.a} vs {m.b} — <span className="text-pine">{m.status}</span>
            {m.decided ? " (final)" : ` (${m.holesPlayed}/6)`}
          </li>
        ))}
      </ul>
      <PointsRow points={sg.jacketPoints} />
    </div>
  );
}
