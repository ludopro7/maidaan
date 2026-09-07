"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestBooking, updateBookingStatus } from "./actions";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "var(--pitch-950)",
  border: "1px solid var(--pitch-700)",
  borderRadius: 8,
  color: "var(--chalk-100)",
  marginBottom: 14,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  marginBottom: 6,
  color: "var(--chalk-300)",
};

export function BookingForm({ groundId }: { groundId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSubmit(formData: FormData) {
    setFeedback(null);
    startTransition(async () => {
      const result = await requestBooking(formData);
      if (result.success) {
        setFeedback({ ok: true, message: "Booking request sent." });
        router.refresh();
      } else {
        setFeedback({ ok: false, message: result.message });
      }
    });
  }

  return (
    <form action={handleSubmit}>
      <input type="hidden" name="ground_id" value={groundId} />
      <label style={labelStyle}>Date</label>
      <input name="booking_date" type="date" required style={inputStyle} />

      <label style={labelStyle}>Time slot</label>
      <input name="time_slot" required style={inputStyle} placeholder="e.g. 6:00–8:00 PM" />

      <label style={labelStyle}>Notes (optional)</label>
      <input name="notes" style={inputStyle} placeholder="Anything the owner should know" />

      {feedback && (
        <div
          style={{
            fontSize: 13,
            marginBottom: 14,
            color: feedback.ok ? "var(--ok-500)" : "var(--danger-500)",
          }}
        >
          {feedback.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        style={{
          padding: "12px 20px",
          background: "var(--ball-500)",
          color: "var(--chalk-100)",
          border: "none",
          borderRadius: 8,
          fontWeight: 600,
          cursor: isPending ? "default" : "pointer",
          opacity: isPending ? 0.6 : 1,
        }}
      >
        {isPending ? "Sending…" : "Request booking"}
      </button>
    </form>
  );
}

export function BookingStatusButtons({
  bookingId,
  groundId,
  isOwner,
  isRequester,
}: {
  bookingId: string;
  groundId: string;
  isOwner: boolean;
  isRequester: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function set(status: "confirmed" | "rejected" | "cancelled") {
    startTransition(async () => {
      await updateBookingStatus(bookingId, groundId, status);
      router.refresh();
    });
  }

  return (
    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
      {isOwner && (
        <>
          <button
            onClick={() => set("confirmed")}
            disabled={isPending}
            style={{ fontSize: 11, padding: "6px 10px", background: "var(--ok-500)", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700 }}
          >
            Confirm
          </button>
          <button
            onClick={() => set("rejected")}
            disabled={isPending}
            style={{ fontSize: 11, padding: "6px 10px", background: "var(--danger-500)", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700 }}
          >
            Decline
          </button>
        </>
      )}
      {isRequester && (
        <button
          onClick={() => set("cancelled")}
          disabled={isPending}
          style={{ fontSize: 11, padding: "6px 10px", background: "var(--pitch-700)", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700 }}
        >
          Cancel
        </button>
      )}
    </div>
  );
}
