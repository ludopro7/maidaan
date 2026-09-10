"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../../lib/supabase/server";

export type ActionResult = { success: true } | { success: false; message: string };

export async function addMember(teamId: string, email: string): Promise<ActionResult> {
  const supabase = createClient();

  const trimmedEmail = email.trim();
  if (!trimmedEmail) return { success: false, message: "Enter an email address." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", trimmedEmail)
    .maybeSingle();

  if (!profile) {
    return { success: false, message: "No Maidan account found with that email." };
  }

  const { data: existing } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("team_id", teamId)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (existing) {
    return { success: false, message: "That player is already on the team." };
  }

  const { error } = await supabase.from("team_members").insert({
    team_id: teamId,
    user_id: profile.id,
    member_role: "member",
  });

  if (error) return { success: false, message: error.message };

  revalidatePath(`/teams/${teamId}`);
  return { success: true };
}

export async function removeMember(teamId: string, userId: string): Promise<ActionResult> {
  const supabase = createClient();

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", userId);

  if (error) return { success: false, message: error.message };

  revalidatePath(`/teams/${teamId}`);
  return { success: true };
}

