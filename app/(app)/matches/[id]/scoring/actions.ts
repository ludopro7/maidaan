"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../../../lib/supabase/server";

export type ActionResult = { success: true; id?: string } | { success: false; message: string };

export async function startInnings(
  matchId: string,
  inningsNumber: 1 | 2,
  battingTeamId: string,
  bowlingTeamId: string
): Promise<ActionResult> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("innings")
    .insert({
      match_id: matchId,
      innings_number: inningsNumber,
      batting_team_id: battingTeamId,
      bowling_team_id: bowlingTeamId,
    })
    .select("id")
    .single();

  if (error) return { success: false, message: error.message };

  if (inningsNumber === 1) {
    await supabase.rpc("mark_match_live", { p_match_id: matchId });
  }

  revalidatePath(`/matches/${matchId}/scoring`);
  return { success: true, id: data.id };
}

export async function setInningsPlayers(
  matchId: string,
  inningsId: string,
  strikerId: string,
  nonStrikerId: string,
  bowlerId: string
): Promise<ActionResult> {
  const supabase = createClient();

  if (strikerId === nonStrikerId) {
    return { success: false, message: "Striker and non-striker must be different players." };
  }

  const { error } = await supabase
    .from("innings")
    .update({ striker_id: strikerId, non_striker_id: nonStrikerId, bowler_id: bowlerId })
    .eq("id", inningsId);

  if (error) return { success: false, message: error.message };

  revalidatePath(`/matches/${matchId}/scoring`);
  return { success: true };
}

export async function recordDelivery(
  matchId: string,
  inningsId: string,
  ballSequence: number,
  runs: number,
  extraType: "wide" | "noball" | "bye" | "legbye" | null,
  extraRuns: number,
  isWicket: boolean,
  wicketType: string | null,
  isLegalBall: boolean
): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Not signed in." };

  const { data: innings, error: inningsError } = await supabase
    .from("innings")
    .select("total_balls, striker_id, non_striker_id, bowler_id")
    .eq("id", inningsId)
    .maybeSingle();

  if (inningsError) return { success: false, message: inningsError.message };
  if (!innings?.striker_id || !innings?.non_striker_id || !innings?.bowler_id) {
    return { success: false, message: "Set the striker, non-striker, and bowler first." };
  }

  const { error } = await supabase.from("deliveries").insert({
    innings_id: inningsId,
    ball_sequence: ballSequence,
    runs,
    extra_type: extraType,
    extra_runs: extraRuns,
    is_wicket: isWicket,
    wicket_type: wicketType,
    is_legal_ball: isLegalBall,
    scored_by: user.id,
    batter_id: innings.striker_id,
    bowler_id: innings.bowler_id,
  });

  if (error) return { success: false, message: error.message };

  // Strike rotation + over-end bowler reset + wicket handling.
  let striker: string | null = innings.striker_id;
  let nonStriker: string | null = innings.non_striker_id;
  let bowler: string | null = innings.bowler_id;

  const runningRuns = extraType === "bye" || extraType === "legbye" ? extraRuns : extraType ? 0 : runs;
  const oddRuns = runningRuns % 2 === 1;
  const newTotalBalls = innings.total_balls + (isLegalBall ? 1 : 0);
  const overEnded = isLegalBall && newTotalBalls % 6 === 0;

  if (oddRuns) {
    [striker, nonStriker] = [nonStriker, striker];
  }
  if (overEnded) {
    [striker, nonStriker] = [nonStriker, striker];
    bowler = null;
  }
  if (isWicket) {
    striker = null;
  }

  const { error: updateError } = await supabase
    .from("innings")
    .update({ striker_id: striker, non_striker_id: nonStriker, bowler_id: bowler })
    .eq("id", inningsId);

  if (updateError) return { success: false, message: updateError.message };

  revalidatePath(`/matches/${matchId}/scoring`);
  return { success: true };
}

export async function completeInnings(matchId: string, inningsId: string): Promise<ActionResult> {
  const supabase = createClient();

  const { data: innings, error: fetchError } = await supabase
    .from("innings")
    .select("innings_number")
    .eq("id", inningsId)
    .maybeSingle();

  if (fetchError) return { success: false, message: fetchError.message };

  const { error } = await supabase.from("innings").update({ status: "completed" }).eq("id", inningsId);

  if (error) return { success: false, message: error.message };

  if (innings?.innings_number === 2) {
    const { error: finalizeError } = await supabase.rpc("finalize_match", { p_match_id: matchId });
    if (finalizeError) return { success: false, message: finalizeError.message };
  }

  revalidatePath(`/matches/${matchId}/scoring`);
  return { success: true };
}
