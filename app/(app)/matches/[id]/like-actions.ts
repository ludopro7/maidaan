"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../../lib/supabase/server";

export type ActionResult = { success: true } | { success: false; message: string };

export async function toggleLike(matchId: string, currentlyLiked: boolean): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Not signed in." };

  if (currentlyLiked) {
    const { error } = await supabase.from("match_likes").delete().eq("match_id", matchId).eq("user_id", user.id);
    if (error) return { success: false, message: error.message };
  } else {
    const { error } = await supabase.from("match_likes").insert({ match_id: matchId, user_id: user.id });
    if (error) return { success: false, message: error.message };
  }

  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/feed");
  return { success: true };
}
