"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";

export type SaveResult = { success: true; id: string } | { success: false; message: string };

export async function createListing(formData: FormData): Promise<SaveResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Not signed in." };

  const businessName = String(formData.get("business_name") || "").trim();
  const category = String(formData.get("category") || "");
  const cityName = String(formData.get("city") || "").trim();
  const listingType = String(formData.get("listing_type") || "product");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "");
  const price = parseFloat(String(formData.get("price") || "0")) || 0;
  const imageEmoji = String(formData.get("image_emoji") || "🏏");

  if (!businessName || !title) {
    return { success: false, message: "Business name and listing title are required." };
  }

  let cityId: string | null = null;
  if (cityName) {
    const { data: existingCity } = await supabase.from("cities").select("id").eq("name", cityName).maybeSingle();
    if (existingCity) {
      cityId = existingCity.id;
    } else {
      const { data: newCity, error: cityError } = await supabase.from("cities").insert({ name: cityName }).select("id").single();
      if (cityError) return { success: false, message: cityError.message };
      cityId = newCity.id;
    }
  }

  const { data: seller, error: sellerError } = await supabase
    .from("sellers")
    .upsert(
      { user_id: user.id, business_name: businessName, category, city_id: cityId },
      { onConflict: "user_id" }
    )
    .select("id")
    .single();

  if (sellerError) return { success: false, message: sellerError.message };

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .insert({
      seller_id: seller.id,
      listing_type: listingType,
      title,
      description,
      price,
      image_emoji: imageEmoji,
    })
    .select("id")
    .single();

  if (listingError) return { success: false, message: listingError.message };

  redirect(`/marketplace/${listing.id}`);
}
