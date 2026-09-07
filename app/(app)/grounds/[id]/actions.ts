"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../../lib/supabase/server";

export type SaveResult =
  | { success: true }
  | { success: false; message: string };

const ALLOWED_STATUSES = ["confirmed", "rejected", "cancelled"] as const;

type BookingStatus = (typeof ALLOWED_STATUSES)[number];

export async function requestBooking(
  formData: FormData
): Promise<SaveResult> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Not signed in." };
  }

  const groundId = String(formData.get("ground_id") || "").trim();
  const bookingDate = String(formData.get("booking_date") || "").trim();
  const timeSlot = String(formData.get("time_slot") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!groundId) {
    return { success: false, message: "Ground is required." };
  }

  if (!bookingDate || !timeSlot) {
    return {
      success: false,
      message: "Date and time slot are required.",
    };
  }

  // Verify that the ground exists.
  const { data: ground, error: groundError } = await supabase
    .from("grounds")
    .select("id, owner_id")
    .eq("id", groundId)
    .maybeSingle();

  if (groundError) {
    return { success: false, message: groundError.message };
  }

  if (!ground) {
    return { success: false, message: "Ground not found." };
  }

  // Owner cannot book their own ground through the customer flow.
  if (ground.owner_id === user.id) {
    return {
      success: false,
      message: "You cannot request a booking for your own ground.",
    };
  }

  // Prevent duplicate active requests for the same slot.
  const { data: existingBooking, error: existingError } = await supabase
    .from("ground_bookings")
    .select("id, status")
    .eq("ground_id", groundId)
    .eq("booking_date", bookingDate)
    .eq("time_slot", timeSlot)
    .in("status", ["pending", "confirmed"])
    .maybeSingle();

  if (existingError) {
    return { success: false, message: existingError.message };
  }

  if (existingBooking) {
    return {
      success: false,
      message: "This ground slot already has an active booking.",
    };
  }

  const { error } = await supabase
    .from("ground_bookings")
    .insert({
      ground_id: groundId,
      requested_by: user.id,
      booking_date: bookingDate,
      time_slot: timeSlot,
      notes: notes || null,
      status: "pending",
    });

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath(`/grounds/${groundId}`);

  return { success: true };
}

export async function updateBookingStatus(
  bookingId: string,
  groundId: string,
  status: BookingStatus
): Promise<SaveResult> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Not signed in." };
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    return { success: false, message: "Invalid booking status." };
  }

  if (!bookingId || !groundId) {
    return { success: false, message: "Invalid booking." };
  }

  /*
   * IMPORTANT:
   * Fetch the booking together with the ground owner.
   * Never authorize a sensitive update using only the booking ID.
   */
  const { data: booking, error: bookingError } = await supabase
    .from("ground_bookings")
    .select(`
      id,
      ground_id,
      requested_by,
      status,
      grounds (
        owner_id
      )
    `)
    .eq("id", bookingId)
    .eq("ground_id", groundId)
    .maybeSingle();

  if (bookingError) {
    return { success: false, message: bookingError.message };
  }

  if (!booking) {
    return { success: false, message: "Booking not found." };
  }

  const ground = Array.isArray(booking.grounds)
    ? booking.grounds[0]
    : booking.grounds;

  if (!ground) {
    return { success: false, message: "Ground not found." };
  }

  const isOwner = ground.owner_id === user.id;
  const isRequester = booking.requested_by === user.id;

  /*
   * Ground owner:
   * - confirm
   * - reject
   *
   * Requester:
   * - cancel
   *
   * Nobody else can modify the booking.
   */
  if (status === "confirmed" || status === "rejected") {
    if (!isOwner) {
      return {
        success: false,
        message: "Only the ground owner can confirm or reject a booking.",
      };
    }
  }

  if (status === "cancelled") {
    if (!isRequester && !isOwner) {
      return {
        success: false,
        message: "You are not authorized to cancel this booking.",
      };
    }
  }

  // Prevent nonsensical transitions.
  if (booking.status !== "pending" && status !== "cancelled") {
    return {
      success: false,
      message: "Only pending bookings can be confirmed or rejected.",
    };
  }

  if (booking.status === "cancelled") {
    return {
      success: false,
      message: "This booking has already been cancelled.",
    };
  }

  const { error } = await supabase
    .from("ground_bookings")
    .update({ status })
    .eq("id", bookingId)
    .eq("ground_id", groundId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath(`/grounds/${groundId}`);
  revalidatePath("/grounds");

  return { success: true };
}
