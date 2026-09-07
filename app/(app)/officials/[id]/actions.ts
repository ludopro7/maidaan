"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../../lib/supabase/server";

export type SaveResult = { success: true } | { success: false; message: string };

export async function requestOfficialBooking(formData: FormData): Promise<SaveResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Not signed in." };

  const officialId = String(formData.get("official_id") || "");
  const roleRequested = String(formData.get("role_requested") || "");
  const scheduledAt = String(formData.get("scheduled_at") || "");
  const notes = String(formData.get("notes") || "");

  if (!roleRequested || !scheduledAt) {
    return { success: false, message: "Role and date/time are required." };
  }

  const { error } = await supabase.from("official_bookings").insert({
    official_id: officialId,
    requested_by: user.id,
    role_requested: roleRequested,
    scheduled_at: scheduledAt,
    notes,
  });

  if (error) return { success: false, message: error.message };

  revalidatePath(`/officials/${officialId}`);
  return { success: true };
}

export async function updateOfficialBookingStatus(
  bookingId: string,
  officialId: string,
  status: "confirmed" | "rejected" | "cancelled"
): Promise<SaveResult> {
  const supabase = createClient();

  const { error } = await supabase.from("official_bookings").update({ status }).eq("id", bookingId);

  if (error) return { success: false, message: error.message };

  revalidatePath(`/officials/${officialId}`);
  return { success: true };
}
