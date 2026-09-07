"use client";

import { useState, useTransition } from "react";
import { createTournament } from "./actions";

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

const sectionTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "var(--chalk-300)",
  marginTop: 20,
  marginBottom: 10,
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

export function TournamentForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createTournament(formData);
      if (result && !result.success) {
        setError(result.message);
      }
    });
  }

  return (
    <form action={handleSubmit}>
      <label style={labelStyle}>Tournament name</label>
      <input name="name" required style={inputStyle} placeholder="e.g. Jaipur Corporate Cup" />

      <label style={labelStyle}>City</label>
      <input name="city" style={inputStyle} placeholder="e.g. Jaipur" />

      <label style={labelStyle}>Format</label>
      <select name="format" style={inputStyle} defaultValue="">
        <option value="">Not set</option>
        <option value="T10">T10</option>
        <option value="T20">T20</option>
        <option value="ODI">ODI / 50-over</option>
        <option value="custom">Custom</option>
      </select>

      <label style={labelStyle}>Number of teams</label>
      <input name="num_teams" type="number" min={2} style={inputStyle} placeholder="e.g. 16" />

      <label style={labelStyle}>Registration deadline</label>
      <input name="registration_deadline" type="date" style={inputStyle} />

      <label style={labelStyle}>Start date</label>
      <input name="start_date" type="date" style={inputStyle} />

      <label style={labelStyle}>End date</label>
      <input name="end_date" type="date" style={inputStyle} />

      <div style={sectionTitle}>Rules</div>
      <label style={labelStyle}>Overs per innings</label>
      <input name="overs" type="number" min={1} style={inputStyle} placeholder="e.g. 20" />

      <div style={sectionTitle}>Finances</div>
      <label style={labelStyle}>Team registration fee (₹)</label>
      <input name="registration_fee" type="number" min={0} style={inputStyle} defaultValue={0} />

      <label style={labelStyle}>Prize money (₹)</label>
      <input name="prize_money" type="number" min={0} style={inputStyle} defaultValue={0} />

      <label style={labelStyle}>Ground cost, total (₹)</label>
      <input name="ground_cost" type="number" min={0} style={inputStyle} defaultValue={0} />

      <label style={labelStyle}>Umpire cost, total (₹)</label>
      <input name="umpire_cost" type="number" min={0} style={inputStyle} defaultValue={0} />

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
          marginTop: 8,
        }}
      >
        {isPending ? "Creating…" : "Publish tournament"}
      </button>
    </form>
  );
}
