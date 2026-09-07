"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";

export type SaveResult = { success: true; id: string } | { success: false; message: string };

export async function createGround(formData: FormData): Promise<SaveResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Not signed in." };
  }

  const name = String(formData.get("name") || "").trim();
  const cityName = String(formData.get("city") || "").trim();
  const address = String(formData.get("address") || "");
  const pricePerSlot = parseFloat(String(formData.get("price_per_slot") || "0")) || 0;
  const slotLabel = String(formData.get("slot_label") || "2h slot");
  const facilitiesRaw = String(formData.get("facilities") || "");
  const facilities = facilitiesRaw
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);

  if (!name) {
    return { success: false, message: "Ground name is required." };
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

  const { data: ground, error } = await supabase
    .from("grounds")
    .insert({
      owner_id: user.id,
      name,
      city_id: cityId,
      address,
      price_per_slot: pricePerSlot,
      slot_label: slotLabel,
      facilities,
    })
    .select("id")
    .single();

  if (error) return { success: false, message: error.message };

  redirect(`/grounds/${ground.id}`);
}
