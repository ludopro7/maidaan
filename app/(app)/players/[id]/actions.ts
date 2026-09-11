"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../../lib/supabase/server";

export type ActionResult = { success: true } | { success: false; message: string };

export async function followPlayer(playerId: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Not signed in." };

  const { error } = await supabase.from("player_follows").insert({
    follower_id: user.id,
    following_id: playerId,
  });

  if (error) return { success: false, message: error.message };

  revalidatePath(`/players/${playerId}`);
  return { success: true };
}

export async function unfollowPlayer(playerId: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Not signed in." };

  const { error } = await supabase
    .from("player_follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", playerId);

  if (error) return { success: false, message: error.message };

  revalidatePath(`/players/${playerId}`);
  return { success: true };
}
