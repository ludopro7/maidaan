"use client";

import { useState, useTransition } from "react";
import { createTeam } from "./actions";

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

export function TeamForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createTeam(formData);
      if (result && !result.success) {
        setError(result.message);
      }
      // On success the action redirects server-side.
    });
  }

  return (
    <form action={handleSubmit}>
      <label style={labelStyle}>Team name</label>
      <input name="name" required style={inputStyle} placeholder="e.g. Jaipur Strikers" />

      <label style={labelStyle}>City</label>
      <input name="city" style={inputStyle} placeholder="e.g. Jaipur" />

      <label style={labelStyle}>Description</label>
      <textarea name="description" rows={3} style={{ ...inputStyle, resize: "vertical" }} />

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
        {isPending ? "Creating…" : "Create team"}
      </button>
    </form>
  );
}
