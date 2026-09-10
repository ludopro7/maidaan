"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../../lib/supabase/server";

export type ActionResult = { success: true } | { success: false; message: string };

export async function updateRegistrationStatus(
  tournamentId: string,
  registrationId: string,
  status: "approved" | "rejected" | "waitlisted" | "withdrawn"
): Promise<ActionResult> {
  const supabase = createClient();

  const { error } = await supabase
    .from("tournament_teams")
    .update({ status })
    .eq("id", registrationId);

  if (error) return { success: false, message: error.message };

  revalidatePath(`/tournaments/${tournamentId}`);
  return { success: true };
}
