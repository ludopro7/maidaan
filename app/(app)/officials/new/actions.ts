"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";

export type SaveResult = { success: true; id: string } | { success: false; message: string };

export async function createOfficial(formData: FormData): Promise<SaveResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Not signed in." };

  const role = String(formData.get("role") || "");
  const experienceYears = parseInt(String(formData.get("experience_years") || ""), 10) || null;
  const pricePerMatch = parseFloat(String(formData.get("price_per_match") || "0")) || 0;
  const bio = String(formData.get("bio") || "");
  const cityName = String(formData.get("city") || "").trim();

  if (!role) {
    return { success: false, message: "Role is required." };
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
      if (cityError) return { success: false, message: cityError.message };
      cityId = newCity.id;
    }
  }

  const { data: official, error } = await supabase
    .from("officials")
    .upsert(
      {
        user_id: user.id,
        role,
        experience_years: experienceYears,
        price_per_match: pricePerMatch,
        bio,
        city_id: cityId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("id")
    .single();

  if (error) return { success: false, message: error.message };

  redirect(`/officials/${official.id}`);
}
