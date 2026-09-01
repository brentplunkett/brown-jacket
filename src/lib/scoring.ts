import {
  BEST_BALL_SESSIONS,
  COURSES,
  PLAYERS,
  ROUND_BY_KEY,
  SCRAMBLE_TEAMS,
  SINGLES_SESSIONS,
  netOnHole,
  wolfForHole,
  type PlayerName,
  type RoundKey,
} from "./tournament";

export type ScoreMap = Record<string, number>; // `${roundKey}:${hole}:${player}` -> strokes
export type WolfCall = { hole: number; wolf: PlayerName; partner: PlayerName | null; blind: boolean };
export type ScrambleMap = Record<string, number>; // `${hole}:${teamKey}` -> strokes

export const scoreKey = (round: RoundKey, hole: number, player: PlayerName) =>
  `${round}:${hole}:${player}`;

export function getGross(scores: ScoreMap, round: RoundKey, hole: number, p: PlayerName) {
  const v = scores[scoreKey(round, hole, p)];
  return typeof v === "number" ? v : null;
}

export function getNet(scores: ScoreMap, round: RoundKey, hole: number, p: PlayerName) {
  const course = ROUND_BY_KEY[round].course;
  return netOnHole(getGross(scores, round, hole, p), p, course, hole);
}

const zero = () => Object.fromEntries(PLAYERS.map((p) => [p, 0])) as Record<PlayerName, number>;

/* ---------------- Round 1: Wolf ---------------- */

export type WolfResult = {
  wolfPoints: Record<PlayerName, number>;
  jacketPoints: Record<PlayerName, number>;
  holeDetail: { hole: number; text: string }[];
};

export function computeWolf(scores: ScoreMap, calls: Record<number, WolfCall>): WolfResult {
  const wolfPoints = zero();
  const holeDetail: { hole: number; text: string }[] = [];

  for (let hole = 1; hole <= 18; hole++) {
    const nets = Object.fromEntries(
      PLAYERS.map((p) => [p, getNet(scores, "r1", hole, p)]),
    ) as Record<PlayerName, number | null>;
    if (PLAYERS.some((p) => nets[p] == null)) continue;

    const call = calls[hole];
    const wolf = call?.wolf ?? wolfForHole(hole);
    const partner = call?.partner ?? null;
    const blind = call?.blind ?? false;

    const team = partner ? [wolf, partner] : [wolf];
    const others = PLAYERS.filter((p) => !team.includes(p));
    const best = (group: PlayerName[]) => Math.min(...group.map((p) => nets[p] as number));
    const teamBest = best(team);
    const otherBest = best(others);

    let text = "";
    if (teamBest < otherBest) {
      const amount = blind ? 6 : partner ? 2 : 4;
      team.forEach((p) => (wolfPoints[p] += amount));
      text = `${team.join(" / ")} win${blind ? " (Blind Wolf)" : partner ? "" : " (Lone Wolf)"} · +${amount} each`;
    } else if (otherBest < teamBest) {
      others.forEach((p) => (wolfPoints[p] += 2));
      text = `${others.join(" / ")} win · +2 each`;
    } else {
      text = "Halved · no points";
    }
    holeDetail.push({ hole, text });
  }

  return { wolfPoints, jacketPoints: rankPoints(wolfPoints, [3, 2, 1, 0]), holeDetail };
}

/** Rank players by value (high wins) and split tied placement points. */
function rankPoints(values: Record<PlayerName, number>, ladder: number[]) {
  const out = zero();
  const anyPlayed = PLAYERS.some((p) => values[p] !== 0);
  if (!anyPlayed) return out;
  const sorted = [...PLAYERS].sort((a, b) => values[b] - values[a]);
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && values[sorted[j + 1]!] === values[sorted[i]!]) j++;
    const share = ladder.slice(i, j + 1).reduce((a, b) => a + b, 0) / (j - i + 1);
    for (let k = i; k <= j; k++) out[sorted[k]!] = share;
    i = j + 1;
  }

  return out;
}

/* ---------------- Round 2: Scramble ---------------- */

export function computeScramble(scramble: ScrambleMap) {
  const totals: Record<string, number> = {};
  const holesIn: Record<string, number> = {};
  SCRAMBLE_TEAMS.forEach((t) => {
    let sum = 0;
    let count = 0;
    for (let h = 1; h <= 18; h++) {
      const v = scramble[`${h}:${t.key}`];
      if (typeof v === "number") {
        sum += v;
        count += 1;
      }
    }
    totals[t.key] = sum;
    holesIn[t.key] = count;
  });

  const points = zero();
  const complete = SCRAMBLE_TEAMS.every((t) => holesIn[t.key] === 18);
  if (complete) {
    const a = SCRAMBLE_TEAMS[0]!;
    const b = SCRAMBLE_TEAMS[1]!;
    const ta = totals[a.key]!;
    const tb = totals[b.key]!;
    if (ta < tb) a.players.forEach((p) => (points[p] = 3));
    else if (tb < ta) b.players.forEach((p) => (points[p] = 3));
    else PLAYERS.forEach((p) => (points[p] = 1.5));
  }

  return { totals, holesIn, complete, jacketPoints: points };
}

/* ---------------- Round 3: Best Ball ---------------- */

export type SessionResult = {
  label: string;
  teamAUp: number; // holes won by A minus holes won by B
  holesPlayed: number;
  status: string;
  decided: boolean;
};

export function computeBestBall(scores: ScoreMap) {
  const points = zero();
  const sessions: SessionResult[] = [];

  BEST_BALL_SESSIONS.forEach((s) => {
    let diff = 0;
    let played = 0;
    s.holes.forEach((hole) => {
      const netOf = (p: PlayerName) => getNet(scores, "r3", hole, p);
      const a = s.teamA.map(netOf);
      const b = s.teamB.map(netOf);
      if (a.some((v) => v == null) || b.some((v) => v == null)) return;
      played++;
      const bestA = Math.min(...(a as number[]));
      const bestB = Math.min(...(b as number[]));
      if (bestA < bestB) diff += 1;
      else if (bestB < bestA) diff -= 1;
    });

    const decided = played === s.holes.length;
    if (decided) {
      if (diff > 0) s.teamA.forEach((p) => (points[p] += 1));
      else if (diff < 0) s.teamB.forEach((p) => (points[p] += 1));
      else PLAYERS.forEach((p) => (points[p] += 0.5));
    }
    sessions.push({
      label: s.label,
      teamAUp: diff,
      holesPlayed: played,
      decided,
      status:
        played === 0
          ? "Not started"
          : diff === 0
            ? "All square"
            : `${diff > 0 ? s.teamA.join(" / ") : s.teamB.join(" / ")} ${Math.abs(diff)} up`,
    });
  });

  return { sessions, jacketPoints: points };
}

/* ---------------- Round 4: Singles ---------------- */

export type MatchResult = {
  session: string;
  a: PlayerName;
  b: PlayerName;
  diff: number;
  holesPlayed: number;
  status: string;
  decided: boolean;
};

export function computeSingles(scores: ScoreMap) {
  const points = zero();
  const matches: MatchResult[] = [];

  SINGLES_SESSIONS.forEach((s) => {
    s.matches.forEach(([a, b]) => {
      let diff = 0;
      let played = 0;
      s.holes.forEach((hole) => {
        const na = getNet(scores, "r4", hole, a);
        const nb = getNet(scores, "r4", hole, b);
        if (na == null || nb == null) return;
        played++;
        if (na < nb) diff += 1;
        else if (nb < na) diff -= 1;
      });
      const decided = played === s.holes.length;
      if (decided) {
        if (diff > 0) points[a] += 2;
        else if (diff < 0) points[b] += 2;
        else {
          points[a] += 1;
          points[b] += 1;
        }
      }
      matches.push({
        session: s.label,
        a,
        b,
        diff,
        holesPlayed: played,
        decided,
        status:
          played === 0
            ? "Not started"
            : diff === 0
              ? "All square"
              : `${diff > 0 ? a : b} ${Math.abs(diff)} up`,
      });
    });
  });

  return { matches, jacketPoints: points };
}

/* ---------------- Overall standings ---------------- */

export type Standing = {
  player: PlayerName;
  r1: number;
  r2: number;
  r3: number;
  r4: number;
  total: number;
  place: number;
  tied: boolean;
  combinedNet: number;
  netBirdies: number;
  netPars: number;
};

export function computeStandings(
  scores: ScoreMap,
  calls: Record<number, WolfCall>,
  scramble: ScrambleMap,
): { standings: Standing[]; rounds: Record<RoundKey, Record<PlayerName, number>> } {
  const wolf = computeWolf(scores, calls);
  const scr = computeScramble(scramble);
  const bb = computeBestBall(scores);
  const sg = computeSingles(scores);

  const rounds = {
    r1: wolf.jacketPoints,
    r2: scr.jacketPoints,
    r3: bb.jacketPoints,
    r4: sg.jacketPoints,
  } as Record<RoundKey, Record<PlayerName, number>>;

  const tb = tiebreakStats(scores);

  const rows = PLAYERS.map((p) => ({
    player: p,
    r1: rounds.r1[p],
    r2: rounds.r2[p],
    r3: rounds.r3[p],
    r4: rounds.r4[p],
    total: rounds.r1[p] + rounds.r2[p] + rounds.r3[p] + rounds.r4[p],
    place: 0,
    tied: false,
    ...tb[p],
  }));

  const sorted = [...rows].sort(
    (a, b) =>
      b.total - a.total ||
      a.combinedNet - b.combinedNet ||
      b.netBirdies - a.netBirdies ||
      b.netPars - a.netPars,
  );

  let place = 1;
  sorted.forEach((row, i) => {
    if (i > 0 && sorted[i - 1].total !== row.total) place = i + 1;
    row.place = place;
    row.tied = sorted.some((o) => o !== row && o.total === row.total);
  });

  return { standings: sorted, rounds };
}

/** Combined net / net birdies / net pars across Wolf, Best Ball and Singles. */
export function tiebreakStats(scores: ScoreMap) {
  const out = {} as Record<PlayerName, { combinedNet: number; netBirdies: number; netPars: number }>;
  const keys: RoundKey[] = ["r1", "r3", "r4"];
  PLAYERS.forEach((p) => {
    let net = 0;
    let birdies = 0;
    let pars = 0;
    keys.forEach((rk) => {
      const course = ROUND_BY_KEY[rk].course;
      for (let hole = 1; hole <= 18; hole++) {
        const n = getNet(scores, rk, hole, p);
        if (n == null) continue;
        net += n;
        const par = COURSES[course].par[hole - 1];
        if (n < par) birdies++;
        else if (n === par) pars++;
      }
    });
    out[p] = { combinedNet: net, netBirdies: birdies, netPars: pars };
  });
  return out;
}
