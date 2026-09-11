import { SupabaseClient } from "@supabase/supabase-js";

export type CareerBatting = {
  innings: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  highScore: number;
  dismissals: number;
  average: number | null;
  strikeRate: number | null;
};

export type CareerBowling = {
  innings: number;
  wickets: number;
  runsConceded: number;
  balls: number;
  economy: number | null;
  bestFigures: string | null;
};

export async function getCareerStats(
  supabase: SupabaseClient,
  userId: string
): Promise<{ batting: CareerBatting; bowling: CareerBowling }> {
  const [{ data: battingDeliveries }, { data: bowlingDeliveries }] = await Promise.all([
    supabase
      .from("deliveries")
      .select("innings_id, runs, extra_type, extra_runs, is_wicket, is_legal_ball")
      .eq("batter_id", userId),
    supabase
      .from("deliveries")
      .select("innings_id, runs, extra_type, extra_runs, is_wicket, is_legal_ball")
      .eq("bowler_id", userId),
  ]);

  const battingByInnings = new Map<
    string,
    { runs: number; balls: number; fours: number; sixes: number; out: boolean }
  >();
  for (const d of battingDeliveries || []) {
    const entry = battingByInnings.get(d.innings_id) || { runs: 0, balls: 0, fours: 0, sixes: 0, out: false };
    if (!d.extra_type) {
      entry.runs += d.runs;
      if (d.runs === 4) entry.fours += 1;
      if (d.runs === 6) entry.sixes += 1;
    }
    if (d.is_legal_ball) entry.balls += 1;
    if (d.is_wicket) entry.out = true;
    battingByInnings.set(d.innings_id, entry);
  }

  let battingRuns = 0,
    battingBalls = 0,
    fours = 0,
    sixes = 0,
    highScore = 0,
    dismissals = 0;
  for (const inn of battingByInnings.values()) {
    battingRuns += inn.runs;
    battingBalls += inn.balls;
    fours += inn.fours;
    sixes += inn.sixes;
    if (inn.runs > highScore) highScore = inn.runs;
    if (inn.out) dismissals += 1;
  }

  const batting: CareerBatting = {
    innings: battingByInnings.size,
    runs: battingRuns,
    balls: battingBalls,
    fours,
    sixes,
    highScore,
    dismissals,
    average: dismissals > 0 ? battingRuns / dismissals : null,
    strikeRate: battingBalls > 0 ? (battingRuns / battingBalls) * 100 : null,
  };

  const bowlingByInnings = new Map<string, { wickets: number; runs: number; balls: number }>();
  for (const d of bowlingDeliveries || []) {
    const entry = bowlingByInnings.get(d.innings_id) || { wickets: 0, runs: 0, balls: 0 };
    if (d.extra_type !== "bye" && d.extra_type !== "legbye") {
      entry.runs += d.runs + d.extra_runs;
    }
    if (d.is_legal_ball) entry.balls += 1;
    if (d.is_wicket) entry.wickets += 1;
    bowlingByInnings.set(d.innings_id, entry);
  }

  let bowlingWickets = 0,
    bowlingRuns = 0,
    bowlingBalls = 0;
  let bestFigures: { wickets: number; runs: number } | null = null;
  for (const inn of bowlingByInnings.values()) {
    bowlingWickets += inn.wickets;
    bowlingRuns += inn.runs;
    bowlingBalls += inn.balls;
    if (
      !bestFigures ||
      inn.wickets > bestFigures.wickets ||
      (inn.wickets === bestFigures.wickets && inn.runs < bestFigures.runs)
    ) {
      bestFigures = { wickets: inn.wickets, runs: inn.runs };
    }
  }

  const bowling: CareerBowling = {
    innings: bowlingByInnings.size,
    wickets: bowlingWickets,
    runsConceded: bowlingRuns,
    balls: bowlingBalls,
    economy: bowlingBalls > 0 ? bowlingRuns / (bowlingBalls / 6) : null,
    bestFigures: bestFigures ? `${bestFigures.wickets}/${bestFigures.runs}` : null,
  };

  return { batting, bowling };
}
