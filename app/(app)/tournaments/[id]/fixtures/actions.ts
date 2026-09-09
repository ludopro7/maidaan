"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../../../lib/supabase/server";

export type ActionResult = { success: true } | { success: false; message: string };

export async function generateFixtures(tournamentId: string): Promise<ActionResult> {
  const supabase = createClient();

  const { error } = await supabase.rpc("generate_round_robin_fixtures", {
    p_tournament_id: tournamentId,
  });

  if (error) return { success: false, message: error.message };

  revalidatePath(`/tournaments/${tournamentId}/fixtures`);
  return { success: true };
}

export async function scheduleMatch(
  tournamentId: string,
  matchId: string,
  scheduledAt: string,
  groundId: string | null
): Promise<ActionResult> {
  const supabase = createClient();

  const { error } = await supabase
    .from("matches")
    .update({
      scheduled_at: scheduledAt || null,
      ground_id: groundId,
    })
    .eq("id", matchId);

  if (error) return { success: false, message: error.message };

  revalidatePath(`/tournaments/${tournamentId}/fixtures`);
  return { success: true };
}
