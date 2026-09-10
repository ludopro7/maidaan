"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../../lib/supabase/server";

export type ActionResult = { success: true } | { success: false; message: string };

export async function assignOfficial(
  matchId: string,
  officialId: string,
  role: "umpire" | "scorer" | "umpire_scorer"
): Promise<ActionResult> {
  const supabase = createClient();

  const { error } = await supabase.from("match_officials").insert({
    match_id: matchId,
    official_id: officialId,
    role,
    status: "assigned",
  });

  if (error) return { success: false, message: error.message };

  revalidatePath(`/matches/${matchId}`);
  return { success: true };
}

export async function respondToAssignment(
  matchId: string,
  matchOfficialId: string,
  status: "confirmed" | "cancelled"
): Promise<ActionResult> {
  const supabase = createClient();

  const { error } = await supabase
    .from("match_officials")
    .update({ status })
    .eq("id", matchOfficialId);

  if (error) return { success: false, message: error.message };

  revalidatePath(`/matches/${matchId}`);
  return { success: true };
}
