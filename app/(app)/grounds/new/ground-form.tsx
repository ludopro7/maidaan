"use client";

import { useState, useTransition } from "react";
import { createGround } from "./actions";

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

export function GroundForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createGround(formData);
      if (result && !result.success) {
        setError(result.message);
      }
    });
  }

  return (
    <form action={handleSubmit}>
      <label style={labelStyle}>Ground name</label>
      <input name="name" required style={inputStyle} placeholder="e.g. Sports City Cricket Ground" />

      <label style={labelStyle}>City</label>
      <input name="city" style={inputStyle} placeholder="e.g. Jaipur" />

      <label style={labelStyle}>Address</label>
      <input name="address" style={inputStyle} placeholder="Area, landmark" />

      <label style={labelStyle}>Price per slot (₹)</label>
      <input name="price_per_slot" type="number" min={0} required style={inputStyle} placeholder="e.g. 3500" />

      <label style={labelStyle}>Slot length</label>
      <input name="slot_label" defaultValue="2h slot" style={inputStyle} />

      <label style={labelStyle}>Facilities (comma separated)</label>
      <input name="facilities" style={inputStyle} placeholder="Turf, Floodlights, Parking" />

      {error && (
        <div style={{ color: "var(--danger-500)", fontSize: 13, marginBottom: 14 }}>{error}</div>
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
        {isPending ? "Listing…" : "List ground"}
      </button>
    </form>
  );
}
