export type PlayerName = "Brent" | "Terb" | "Ross" | "Ryan";
export type RoundKey = "r1" | "r2" | "r3" | "r4";
export type CourseName = "Norman" | "Love" | "Dye" | "Fazio";

export const PLAYERS: PlayerName[] = ["Brent", "Terb", "Ross", "Ryan"];

export const PLAYER_INFO: Record<PlayerName, { index: number; ch: Record<CourseName, number> }> = {
  Brent: { index: 15.6, ch: { Norman: 17, Love: 19, Dye: 19, Fazio: 19 } },
  Terb: { index: 10.9, ch: { Norman: 12, Love: 14, Dye: 14, Fazio: 13 } },
  Ross: { index: 24.3, ch: { Norman: 28, Love: 30, Dye: 30, Fazio: 30 } },
  Ryan: { index: 24.3, ch: { Norman: 28, Love: 30, Dye: 30, Fazio: 30 } },
};

export const COURSES: Record<
  CourseName,
  { par: number[]; si: number[]; total: number; rating: string; yards: string }
> = {
  Norman: {
    par: [4, 4, 3, 4, 5, 4, 3, 4, 5, 4, 3, 5, 4, 4, 3, 5, 4, 4],
    si: [11, 9, 15, 5, 1, 3, 17, 13, 7, 14, 16, 2, 8, 4, 18, 6, 12, 10],
    total: 72,
    rating: "71.4 / 136",
    yards: "6,487",
  },
  Love: {
    par: [4, 5, 3, 4, 4, 4, 4, 5, 3, 4, 3, 4, 5, 4, 3, 4, 4, 5],
    si: [13, 7, 17, 15, 1, 9, 5, 3, 11, 16, 18, 2, 8, 10, 14, 12, 6, 4],
    total: 72,
    rating: "72.4 / 137",
    yards: "6,535",
  },
  Dye: {
    par: [4, 4, 3, 4, 5, 3, 4, 5, 4, 4, 4, 5, 4, 4, 3, 5, 3, 4],
    si: [6, 14, 12, 18, 10, 8, 2, 16, 4, 13, 1, 15, 17, 3, 7, 11, 9, 5],
    total: 72,
    rating: "72.7 / 135",
    yards: "6,634",
  },
  Fazio: {
    par: [4, 5, 3, 4, 4, 3, 3, 3, 5, 4, 4, 4, 5, 4, 3, 4, 4, 5],
    si: [7, 5, 15, 1, 3, 17, 13, 11, 9, 8, 14, 4, 2, 10, 16, 12, 6, 18],
    total: 71,
    rating: "70.6 / 133",
    yards: "6,350",
  },
};

export type RoundConfig = {
  key: RoundKey;
  n: number;
  name: string;
  course: CourseName;
  when: string;
  scoring: "Net" | "Gross";
  blurb: string;
  points: string;
  pool: number;
};

export const ROUNDS: RoundConfig[] = [
  {
    key: "r1",
    n: 1,
    name: "Wolf",
    course: "Norman",
    when: "Mon 9:00 AM",
    scoring: "Net",
    blurb:
      "Order is locked: Terb, Ross, Brent, Ryan, repeating down the card. The Wolf hits last and must pick a partner or go alone right after each drive. Scoring is net best ball.",
    points: "6 pts · 3–2–1–0 on Wolf points",
    pool: 6,
  },
  {
    key: "r2",
    n: 2,
    name: "Scramble",
    course: "Love",
    when: "Mon 2:43 PM",
    scoring: "Gross",
    blurb:
      "Brent and Ross against Ryan and Terb, straight gross scramble, no handicaps. Lower 18-hole total takes all 6 points.",
    points: "6 pts · 3 each, 1.5 if halved",
    pool: 6,
  },
  {
    key: "r3",
    n: 3,
    name: "Best Ball",
    course: "Dye",
    when: "Tue 10:31 AM",
    scoring: "Net",
    blurb:
      "Partners rotate every six holes. Each six-hole stretch is match play on net best ball. A session win is 2 points, 1 each; a halved session pays 0.5 each.",
    points: "6 pts · 3 sessions × 2",
    pool: 6,
  },
  {
    key: "r4",
    n: 4,
    name: "Singles",
    course: "Fazio",
    when: "Wed 9:48 AM",
    scoring: "Net",
    blurb:
      "Two matches run at once, rotating every six holes. Six matches total, each worth 2 points: 2 to the winner, 1 each if halved.",
    points: "12 pts · 6 matches × 2",
    pool: 12,
  },
];

export const ROUND_BY_KEY = Object.fromEntries(ROUNDS.map((r) => [r.key, r])) as Record<
  RoundKey,
  RoundConfig
>;

export const WOLF_ORDER: PlayerName[] = ["Terb", "Ross", "Brent", "Ryan"];
export const wolfForHole = (hole: number): PlayerName => WOLF_ORDER[(hole - 1) % 4];

export const SCRAMBLE_TEAMS: { key: string; label: string; players: PlayerName[] }[] = [
  { key: "A", label: "Brent / Ross", players: ["Brent", "Ross"] },
  { key: "B", label: "Ryan / Terb", players: ["Ryan", "Terb"] },
];

export type Session = { holes: number[]; label: string };

export const BEST_BALL_SESSIONS: {
  label: string;
  holes: number[];
  teamA: PlayerName[];
  teamB: PlayerName[];
}[] = [
  { label: "1–6", holes: [1, 2, 3, 4, 5, 6], teamA: ["Brent", "Ross"], teamB: ["Ryan", "Terb"] },
  { label: "7–12", holes: [7, 8, 9, 10, 11, 12], teamA: ["Brent", "Terb"], teamB: ["Ross", "Ryan"] },
  { label: "13–18", holes: [13, 14, 15, 16, 17, 18], teamA: ["Brent", "Ryan"], teamB: ["Terb", "Ross"] },
];

export const SINGLES_SESSIONS: {
  label: string;
  holes: number[];
  matches: [PlayerName, PlayerName][];
}[] = [
  {
    label: "1–6",
    holes: [1, 2, 3, 4, 5, 6],
    matches: [
      ["Brent", "Terb"],
      ["Ross", "Ryan"],
    ],
  },
  {
    label: "7–12",
    holes: [7, 8, 9, 10, 11, 12],
    matches: [
      ["Brent", "Ross"],
      ["Terb", "Ryan"],
    ],
  },
  {
    label: "13–18",
    holes: [13, 14, 15, 16, 17, 18],
    matches: [
      ["Brent", "Ryan"],
      ["Terb", "Ross"],
    ],
  },
];

/** Strokes a player receives on a given hole. */
export function strokesOnHole(player: PlayerName, course: CourseName, hole: number): number {
  const ch = PLAYER_INFO[player].ch[course];
  const si = COURSES[course].si[hole - 1];
  let s = 0;
  if (si <= ch) s += 1;
  if (si + 18 <= ch) s += 1;
  if (si + 36 <= ch) s += 1;
  return s;
}

export function netOnHole(
  gross: number | null | undefined,
  player: PlayerName,
  course: CourseName,
  hole: number,
): number | null {
  if (gross == null) return null;
  return gross - strokesOnHole(player, course, hole);
}
