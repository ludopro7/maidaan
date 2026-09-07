"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";

export type SaveResult = { success: true; id: string } | { success: false; message: string };

export async function createChallenge(formData: FormData): Promise<SaveResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Not signed in." };

  const challengeType = String(formData.get("challenge_type") || "").trim();
  const opponentType = String(formData.get("opponent_type") || "");
  const opponentEmail = String(formData.get("opponent_email") || "").trim();
  const opponentTeamId = String(formData.get("opponent_team_id") || "") || null;
  const challengerTeamId = String(formData.get("challenger_team_id") || "") || null;
  const scheduledAtRaw = String(formData.get("scheduled_at") || "");
  const notes = String(formData.get("notes") || "");

  if (!challengeType) {
    return { success: false, message: "Challenge type is required." };
  }

  let opponentUserId: string | null = null;

  if (opponentType === "player") {
    if (!opponentEmail) {
      return { success: false, message: "Opponent email is required." };
    }
    const { data: opponentProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", opponentEmail)
      .maybeSingle();

    if (!opponentProfile) {
      return { success: false, message: "No Maidan player found with that email." };
    }
    opponentUserId = opponentProfile.id;
  } else if (opponentType === "team") {
    if (!opponentTeamId) {
      return { success: false, message: "Select an opponent team." };
    }
    if (!challengerTeamId) {
      return { success: false, message: "Select your team for a team challenge." };
    }
  }

  const { data: challenge, error } = await supabase
    .from("challenges")
    .insert({
      challenger_id: user.id,
      challenger_team_id: opponentType === "team" ? challengerTeamId : null,
      opponent_type: opponentType,
      opponent_user_id: opponentType === "player" ? opponentUserId : null,
      opponent_team_id: opponentType === "team" ? opponentTeamId : null,
      challenge_type: challengeType,
      scheduled_at: scheduledAtRaw || null,
      notes,
    })
    .select("id")
    .single();

  if (error) return { success: false, message: error.message };

  redirect(`/challenges/${challenge.id}`);
}

export async function updateChallengeStatus(
  challengeId: string,
  status: "accepted" | "declined" | "confirmed" | "cancelled" | "completed"
): Promise<SaveResult> {
  const supabase = createClient();

  const { error } = await supabase.from("challenges").update({ status }).eq("id", challengeId);

  if (error) return { success: false, message: error.message };
  return { success: true, id: challengeId };
}
