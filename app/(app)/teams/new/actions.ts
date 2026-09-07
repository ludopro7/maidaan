"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";

export type SaveResult = { success: true; teamId: string } | { success: false; message: string };

export async function createTeam(formData: FormData): Promise<SaveResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Not signed in." };
  }

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "");
  const cityName = String(formData.get("city") || "").trim();

  if (!name) {
    return { success: false, message: "Team name is required." };
  }

  let cityId: string | null = null;

  if (cityName) {
    const { data: existingCity } = await supabase
      .from("cities")
      .select("id")
      .eq("name", cityName)
      .maybeSingle();

    if (existingCity) {
      cityId = existingCity.id;
    } else {
      const { data: newCity, error: cityError } = await supabase
        .from("cities")
        .insert({ name: cityName })
        .select("id")
        .single();

      if (cityError) {
        return { success: false, message: cityError.message };
      }
      cityId = newCity.id;
    }
  }

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({ name, description, city_id: cityId, captain_id: user.id })
    .select("id")
    .single();

  if (teamError) {
    return { success: false, message: teamError.message };
  }

  const { error: memberError } = await supabase
    .from("team_members")
    .insert({ team_id: team.id, user_id: user.id, member_role: "captain" });

  if (memberError) {
    return { success: false, message: memberError.message };
  }

  redirect(`/teams/${team.id}`);
}
