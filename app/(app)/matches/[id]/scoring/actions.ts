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
  });

  if (error) return { success: false, message: error.message };

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
