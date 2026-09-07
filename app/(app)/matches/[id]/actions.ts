"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../../lib/supabase/server";

export type CheckInResult = { success: true } | { success: false; message: string };

export async function checkIn(matchId: string): Promise<CheckInResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Not signed in." };

  const { error } = await supabase.from("match_checkins").insert({
    match_id: matchId,
    user_id: user.id,
  });

  if (error) return { success: false, message: error.message };

  revalidatePath(`/matches/${matchId}`);
  return { success: true };
}
