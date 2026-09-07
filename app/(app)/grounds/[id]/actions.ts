"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../../lib/supabase/server";

export type SaveResult = { success: true } | { success: false; message: string };

export async function requestBooking(formData: FormData): Promise<SaveResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Not signed in." };

  const groundId = String(formData.get("ground_id") || "");
  const bookingDate = String(formData.get("booking_date") || "");
  const timeSlot = String(formData.get("time_slot") || "");
  const notes = String(formData.get("notes") || "");

  if (!bookingDate || !timeSlot) {
    return { success: false, message: "Date and time slot are required." };
  }

  const { error } = await supabase.from("ground_bookings").insert({
    ground_id: groundId,
    requested_by: user.id,
    booking_date: bookingDate,
    time_slot: timeSlot,
    notes,
  });

  if (error) return { success: false, message: error.message };

  revalidatePath(`/grounds/${groundId}`);
  return { success: true };
}

export async function updateBookingStatus(
  bookingId: string,
  groundId: string,
  status: "confirmed" | "rejected" | "cancelled"
): Promise<SaveResult> {
  const supabase = createClient();

  const { error } = await supabase.from("ground_bookings").update({ status }).eq("id", bookingId);

  if (error) return { success: false, message: error.message };

  revalidatePath(`/grounds/${groundId}`);
  return { success: true };
}
