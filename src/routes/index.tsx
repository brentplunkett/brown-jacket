import { createFileRoute, Link } from "@tanstack/react-router";
import foursome from "@/assets/foursome.png.asset.json";
import { AuthGate } from "@/components/AuthGate";
import { useTournament } from "@/lib/useTournament";
import { computeStandings } from "@/lib/scoring";
import { COURSES, PLAYERS, PLAYER_INFO, ROUNDS } from "@/lib/tournament";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Brown Jacket Invitational 2026 · Live Standings" },
      {
        name: "description",
        content:
          "Live scoring and standings for the Brown Jacket Invitational at Barefoot Resort — four rounds, thirty points, one jacket.",
      },
      { property: "og:title", content: "The Brown Jacket Invitational 2026" },
      {
        property: "og:description",
        content: "Four rounds, thirty points, one jacket. Live standings for Brent, Terb, Ross and Ryan.",
      },
    ],
  }),
  component: () => (
    <AuthGate>
      <Standings />
    </AuthGate>
  ),
});

function Standings() {
  const { scores, calls, scramble, loading } = useTournament();
  const { standings } = computeStandings(scores, calls, scramble);

  return (
    <main>
      <header className="border-b-[6px] border-tobacco bg-pine text-paper">
        <div className="mx-auto grid max-w-5xl items-center gap-8 px-5 py-12 md:grid-cols-[1.3fr_1fr]">
          <div>
            <div className="mono text-[0.8rem] text-paper-dim">
              Sep 28–30, 2026 · Barefoot Resort, North Myrtle Beach
            </div>
            <h1 className="mt-3 max-w-[14ch] text-[clamp(2.4rem,7vw,4.4rem)] leading-[1.02] text-paper">
              The Brown Jacket Invitational
            </h1>
            <p className="mt-4 max-w-[46ch] text-paper-dim">
              Four rounds, thirty points, one jacket. Brent, Terb, Ross and Ryan play Norman, Love,
              Dye and Fazio for the only trophy that matters this fall.
            </p>
            <p className="mt-5 text-sm text-paper-dim">
              Defending champion:{" "}
              <span className="font-display italic text-gold">Ross</span> · Pool:{" "}
              <span className="mono text-paper">30 pts</span>
            </p>
          </div>
          <img
            src={foursome.url}
            alt="Caricature of Brent, Terb, Ross and Ryan in brown jackets on the course at sunset"
            className="w-full border-4 border-tobacco bg-paper"
          />
        </div>
      </header>

      {/* Schedule */}
      <div className="grid border-b border-border bg-paper-panel md:grid-cols-4">
        {ROUNDS.map((r) => (
          <Link
            key={r.key}
            to="/round/$key"
            params={{ key: r.key }}
            className="border-t border-dashed border-input p-5 transition-colors hover:bg-paper-dim md:border-l md:border-t-0 md:first:border-l-0"
          >
            <div className="mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
              Round {r.n} · {r.when}
            </div>
            <h3 className="mt-1 text-xl">{r.name}</h3>
            <div className="font-display italic text-tobacco">{r.course}</div>
            <div className="mono mt-3 text-xs text-rust">{r.points}</div>
          </Link>
        ))}
      </div>

      <section className="mx-auto max-w-5xl px-5 py-12">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink pb-3">
          <h2 className="text-3xl">Standings</h2>
          <div className="text-sm text-muted-foreground">
            {loading ? "Syncing…" : "Live — updates as scores are entered"}
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-sm">
            <thead>
              <tr>
                {["Player", "R1 Wolf", "R2 Scramble", "R3 Best Ball", "R4 Singles", "Total", "Place"].map(
                  (h, i) => (
                    <th
                      key={h}
                      className={`mono border-b-2 border-ink px-3 py-2 text-[0.7rem] uppercase tracking-widest text-muted-foreground ${i === 0 ? "text-left" : "text-center"}`}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {standings.map((row) => (
                <tr key={row.player} className={row.place === 1 ? "bg-gold/15" : undefined}>
                  <td className="border-b border-border px-3 py-3 font-display text-base">
                    {row.player}
                    {row.place === 1 && (
                      <span className="mono ml-2 text-[0.65rem] uppercase tracking-widest text-rust">
                        Jacket
                      </span>
                    )}
                  </td>
                  {(["r1", "r2", "r3", "r4"] as const).map((k) => (
                    <td key={k} className="mono border-b border-border px-3 py-3 text-center">
                      {row[k] ? fmt(row[k]) : "–"}
                    </td>
                  ))}
                  <td className="mono border-b border-border px-3 py-3 text-center font-semibold">
                    {fmt(row.total)}
                  </td>
                  <td className="mono border-b border-border px-3 py-3 text-center">
                    {row.place}
                    {row.tied ? "T" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
                <td className="px-3 py-2">Points available</td>
                <td className="px-3 py-2 text-center">6</td>
                <td className="px-3 py-2 text-center">6</td>
                <td className="px-3 py-2 text-center">6</td>
                <td className="px-3 py-2 text-center">12</td>
                <td className="px-3 py-2 text-center">30</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Jacket goes to the highest total. Ties break on combined net (Wolf, Best Ball, Singles),
          then net birdies, then net pars.
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr>
                {["Tiebreak", "Combined net", "Net birdies", "Net pars"].map((h, i) => (
                  <th
                    key={h}
                    className={`mono border-b-2 border-ink px-3 py-2 text-[0.7rem] uppercase tracking-widest text-muted-foreground ${i === 0 ? "text-left" : "text-center"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {standings.map((r) => (
                <tr key={r.player}>
                  <td className="border-b border-border px-3 py-2 font-display">{r.player}</td>
                  <td className="mono border-b border-border px-3 py-2 text-center">{r.combinedNet}</td>
                  <td className="mono border-b border-border px-3 py-2 text-center">{r.netBirdies}</td>
                  <td className="mono border-b border-border px-3 py-2 text-center">{r.netPars}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-14">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink pb-3">
          <h2 className="text-3xl">Handicaps &amp; tees</h2>
          <div className="text-sm text-muted-foreground">
            Course handicap = Index × Slope/113 + (Rating − Par)
          </div>
        </div>
        <div className="mt-5 grid gap-10 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-lg text-pine">Course handicap by round</h3>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {["Player", "Index", "Norman", "Love", "Dye", "Fazio"].map((h, i) => (
                    <th
                      key={h}
                      className={`mono border-b-2 border-ink px-2 py-2 text-[0.7rem] uppercase text-muted-foreground ${i === 0 ? "text-left" : "text-center"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PLAYERS.map((p) => (
                  <tr key={p}>
                    <td className="border-b border-border px-2 py-2 font-display">{p}</td>
                    <td className="mono border-b border-border px-2 py-2 text-center">
                      {PLAYER_INFO[p].index}
                    </td>
                    {(["Norman", "Love", "Dye", "Fazio"] as const).map((c) => (
                      <td key={c} className="mono border-b border-border px-2 py-2 text-center">
                        {PLAYER_INFO[p].ch[c]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="mb-3 text-lg text-pine">Tee yardages · Black</h3>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {["Course", "Par", "Yards", "Rating/Slope"].map((h, i) => (
                    <th
                      key={h}
                      className={`mono border-b-2 border-ink px-2 py-2 text-[0.7rem] uppercase text-muted-foreground ${i === 0 ? "text-left" : "text-center"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(["Norman", "Love", "Dye", "Fazio"] as const).map((c) => (
                  <tr key={c}>
                    <td className="border-b border-border px-2 py-2 font-display">{c}</td>
                    <td className="mono border-b border-border px-2 py-2 text-center">
                      {COURSES[c].total}
                    </td>
                    <td className="mono border-b border-border px-2 py-2 text-center">
                      {COURSES[c].yards}
                    </td>
                    <td className="mono border-b border-border px-2 py-2 text-center">
                      {COURSES[c].rating}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer className="bg-ink px-5 py-12 text-paper-dim">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-5 text-2xl text-paper">The back of the card</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["Field", "Brent (15.6), Terb (10.9), Ross (24.3, defending champion), Ryan (24.3)."],
              ["Jacket", "Most points after four rounds, out of a 30-point pool."],
              [
                "Strokes",
                "Wolf, Best Ball and Singles are net. A player gets a stroke when a hole's index is at or below his course handicap, and a second when index + 18 also qualifies. Scramble is gross.",
              ],
              [
                "Tiebreak",
                "1) Lowest combined net across Wolf, Best Ball and Singles. 2) Most net birdies. 3) Most net pars.",
              ],
            ].map(([k, v]) => (
              <div key={k} className="border-t border-paper/15 pt-3">
                <div className="font-display italic text-gold">{k}</div>
                <div className="text-sm">{v}</div>
              </div>
            ))}
          </div>
          <div className="mono mt-8 text-xs text-paper-dim/60">
            Barefoot Resort · North Myrtle Beach · Sep 28–30, 2026
          </div>
        </div>
      </footer>
    </main>
  );
}

export function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
