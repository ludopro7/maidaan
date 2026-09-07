"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../../lib/supabase/server";

export type SaveResult =
  | { success: true }
  | { success: false; message: string };

const ALLOWED_STATUSES = ["confirmed", "rejected", "cancelled"] as const;

type BookingStatus = (typeof ALLOWED_STATUSES)[number];

const ALLOWED_ROLES = ["umpire", "scorer", "umpire_scorer"];

export async function requestOfficialBooking(
  formData: FormData
): Promise<SaveResult> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Not signed in." };
  }

  const officialId = String(formData.get("official_id") || "").trim();
  const roleRequested = String(
    formData.get("role_requested") || ""
  ).trim();
  const scheduledAt = String(
    formData.get("scheduled_at") || ""
  ).trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!officialId) {
    return { success: false, message: "Official is required." };
  }

  if (!roleRequested || !scheduledAt) {
    return {
      success: false,
      message: "Role and date/time are required.",
    };
  }

  if (!ALLOWED_ROLES.includes(roleRequested)) {
    return {
      success: false,
      message: "Invalid official role.",
    };
  }

  // Verify official exists.
  const { data: official, error: officialError } = await supabase
    .from("officials")
    .select("id, user_id, role")
    .eq("id", officialId)
    .maybeSingle();

  if (officialError) {
    return {
      success: false,
      message: officialError.message,
    };
  }

  if (!official) {
    return {
      success: false,
      message: "Official not found.",
    };
  }

  // Official cannot book themselves.
  if (official.user_id === user.id) {
    return {
      success: false,
      message: "You cannot request yourself as an official.",
    };
  }

  // Prevent duplicate active assignments for same official/time.
  const { data: existingBooking, error: existingError } =
    await supabase
      .from("official_bookings")
      .select("id, status")
      .eq("official_id", officialId)
      .eq("scheduled_at", scheduledAt)
      .in("status", ["pending", "confirmed"])
      .maybeSingle();

  if (existingError) {
    return {
      success: false,
      message: existingError.message,
    };
  }

  if (existingBooking) {
    return {
      success: false,
      message: "This official already has an active assignment at this time.",
    };
  }

  const { error } = await supabase
    .from("official_bookings")
    .insert({
      official_id: officialId,
      requested_by: user.id,
      role_requested: roleRequested,
      scheduled_at: scheduledAt,
      notes: notes || null,
      status: "pending",
    });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath(`/officials/${officialId}`);

  return { success: true };
}

export async function updateOfficialBookingStatus(
  bookingId: string,
  officialId: string,
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
    return {
      success: false,
      message: "Invalid booking status.",
    };
  }

  if (!bookingId || !officialId) {
    return {
      success: false,
      message: "Invalid booking.",
    };
  }

  /*
   * Fetch the booking and the official's user_id.
   * Authorization must happen server-side.
   */
  const { data: booking, error: bookingError } = await supabase
    .from("official_bookings")
    .select(`
      id,
      official_id,
      requested_by,
      status,
      officials (
        user_id
      )
    `)
    .eq("id", bookingId)
    .eq("official_id", officialId)
    .maybeSingle();

  if (bookingError) {
    return {
      success: false,
      message: bookingError.message,
    };
  }

  if (!booking) {
    return {
      success: false,
      message: "Booking not found.",
    };
  }

  const official = Array.isArray(booking.officials)
    ? booking.officials[0]
    : booking.officials;

  if (!official) {
    return {
      success: false,
      message: "Official not found.",
    };
  }

  const isOfficial = official.user_id === user.id;
  const isRequester = booking.requested_by === user.id;

  /*
   * Official:
   * - confirm
   * - reject
   *
   * Requester:
   * - cancel
   *
   * Nobody else can modify the booking.
   */
  if (status === "confirmed" || status === "rejected") {
    if (!isOfficial) {
      return {
        success: false,
        message:
          "Only the official can confirm or reject an assignment.",
      };
    }
  }

  if (status === "cancelled") {
    if (!isRequester && !isOfficial) {
      return {
        success: false,
        message:
          "You are not authorized to cancel this assignment.",
      };
    }
  }

  if (booking.status !== "pending" && status !== "cancelled") {
    return {
      success: false,
      message:
        "Only pending assignments can be confirmed or rejected.",
    };
  }

  if (booking.status === "cancelled") {
    return {
      success: false,
      message: "This assignment has already been cancelled.",
    };
  }

  const { error } = await supabase
    .from("official_bookings")
    .update({ status })
    .eq("id", bookingId)
    .eq("official_id", officialId);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath(`/officials/${officialId}`);
  revalidatePath("/officials");

  return { success: true };
}
