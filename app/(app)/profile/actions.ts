"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../lib/supabase/server";

export type SaveResult = { success: true } | { success: false; message: string };

export async function saveProfile(formData: FormData): Promise<SaveResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Not signed in." };
  }

  const fullName = String(formData.get("full_name") || "");
  const bio = String(formData.get("bio") || "");
  const battingHand = String(formData.get("batting_hand") || "") || null;
  const bowlingStyle = String(formData.get("bowling_style") || "") || null;
  const playingRole = String(formData.get("playing_role") || "") || null;
  const preferredFormat = String(formData.get("preferred_format") || "") || null;
  const experienceYearsRaw = String(formData.get("experience_years") || "");
  const experienceYears = experienceYearsRaw ? parseInt(experienceYearsRaw, 10) : null;
  const avatarUrl = String(formData.get("avatar_url") || "") || null;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: fullName, bio, avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (profileError) {
    return { success: false, message: profileError.message };
  }

  const { error: playerError } = await supabase.from("players").upsert(
    {
      user_id: user.id,
      batting_hand: battingHand,
      bowling_style: bowlingStyle,
      playing_role: playingRole,
      preferred_format: preferredFormat,
      experience_years: experienceYears,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (playerError) {
    return { success: false, message: playerError.message };
  }

  revalidatePath("/profile");
  revalidatePath("/home");
  return { success: true };
}
