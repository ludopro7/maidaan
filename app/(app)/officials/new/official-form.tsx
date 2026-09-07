"use client";

import { useState, useTransition } from "react";
import { createOfficial } from "./actions";

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

export function OfficialForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createOfficial(formData);
      if (result && !result.success) {
        setError(result.message);
      }
    });
  }

  return (
    <form action={handleSubmit}>
      <label style={labelStyle}>Role</label>
      <select name="role" required style={inputStyle} defaultValue="">
        <option value="" disabled>
          Select a role
        </option>
        <option value="umpire">Umpire</option>
        <option value="scorer">Scorer</option>
        <option value="umpire_scorer">Umpire + Scorer</option>
      </select>

      <label style={labelStyle}>Years of experience</label>
      <input name="experience_years" type="number" min={0} style={inputStyle} />

      <label style={labelStyle}>Price per match (₹)</label>
      <input name="price_per_match" type="number" min={0} required style={inputStyle} placeholder="e.g. 1500" />

      <label style={labelStyle}>City</label>
      <input name="city" style={inputStyle} placeholder="e.g. Jaipur" />

      <label style={labelStyle}>Bio (optional)</label>
      <textarea name="bio" rows={3} style={{ ...inputStyle, resize: "vertical" }} />

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
        {isPending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
