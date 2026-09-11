"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../../lib/supabase/server";

export type ActionResult = { success: true } | { success: false; message: string };

export async function addComment(matchId: string, content: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Not signed in." };

  const trimmed = content.trim();
  if (!trimmed) return { success: false, message: "Comment can't be empty." };

  const { error } = await supabase.from("match_comments").insert({
    match_id: matchId,
    user_id: user.id,
    content: trimmed,
  });

  if (error) return { success: false, message: error.message };

  revalidatePath(`/matches/${matchId}`);
  return { success: true };
}

export async function deleteComment(matchId: string, commentId: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Not signed in." };

  const { error } = await supabase.from("match_comments").delete().eq("id", commentId).eq("user_id", user.id);

  if (error) return { success: false, message: error.message };

  revalidatePath(`/matches/${matchId}`);
  return { success: true };
}
