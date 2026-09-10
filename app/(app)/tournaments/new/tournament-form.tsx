"use client";

import { useState, useTransition } from "react";
import { createTournament } from "./actions";

type Tier = "full_service" | "assisted" | "self_managed";

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

const tierCard = (selected: boolean): React.CSSProperties => ({
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: 14,
  marginBottom: 10,
  borderRadius: 12,
  border: selected ? "2px solid var(--ball-500)" : "1px solid var(--pitch-700)",
  background: selected ? "rgba(201,84,47,0.08)" : "var(--pitch-950)",
  color: "var(--chalk-100)",
  cursor: "pointer",
});

export function TournamentForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [tier, setTier] = useState<Tier>("assisted");

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("service_tier", tier);
    startTransition(async () => {
      const result = await createTournament(formData);
      if (result && !result.success) {
        setError(result.message);
      }
    });
  }

  return (
    <form action={handleSubmit}>
      <div style={sectionTitle}>How do you want to run this?</div>

      <button type="button" onClick={() => setTier("full_service")} style={tierCard(tier === "full_service")}>
        <strong>Full service</strong>
        <div style={{ fontSize: 12, color: "var(--chalk-300)", marginTop: 4 }}>
          You give us a budget — we design the tournament, arrange grounds and officials, and set it up for you.
        </div>
      </button>

      <button type="button" onClick={() => setTier("assisted")} style={tierCard(tier === "assisted")}>
        <strong>Assisted</strong>
        <div style={{ fontSize: 12, color: "var(--chalk-300)", marginTop: 4 }}>
          You set teams, entry fee, and prize money — we arrange grounds and officials for you.
        </div>
      </button>

      <button type="button" onClick={() => setTier("self_managed")} style={tierCard(tier === "self_managed")}>
        <strong>Self-managed</strong>
        <div style={{ fontSize: 12, color: "var(--chalk-300)", marginTop: 4 }}>
          You handle everything — we just list it so more teams can find and register.
        </div>
      </button>

      <div style={sectionTitle}>Basics</div>
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

      <label style={labelStyle}>Overs per innings</label>
      <input name="overs" type="number" min={1} style={inputStyle} placeholder="e.g. 20" />

      <label style={labelStyle}>Ball type</label>
      <input name="ball_type" style={inputStyle} placeholder="e.g. Tennis, Leather" />

      {tier === "full_service" ? (
        <>
          <div style={sectionTitle}>Budget</div>
          <label style={labelStyle}>Total budget or prize money to invest (₹)</label>
          <input name="requested_budget" type="number" min={0} required style={inputStyle} placeholder="e.g. 50000" />
          <p style={{ fontSize: 12, color: "var(--chalk-300)", marginTop: -8, marginBottom: 14 }}>
            We'll design the tournament structure (teams, entry fee, format) and reach out before it goes live.
          </p>
        </>
      ) : (
        <>
          <label style={labelStyle}>Number of teams</label>
          <input name="num_teams" type="number" min={2} style={inputStyle} placeholder="e.g. 16" />

          <label style={labelStyle}>Registration deadline</label>
          <input name="registration_deadline" type="date" style={inputStyle} />

          <label style={labelStyle}>Start date</label>
          <input name="start_date" type="date" style={inputStyle} />

          <label style={labelStyle}>End date</label>
          <input name="end_date" type="date" style={inputStyle} />

          <div style={sectionTitle}>Finances</div>
          <label style={labelStyle}>Team registration fee (₹)</label>
          <input name="registration_fee" type="number" min={0} style={inputStyle} defaultValue={0} />

          <label style={labelStyle}>Prize money (₹)</label>
          <input name="prize_money" type="number" min={0} style={inputStyle} defaultValue={0} />

          {tier === "assisted" && (
            <div
              style={{
                background: "rgba(217,164,65,0.1)",
                border: "1px solid rgba(217,164,65,0.3)",
                borderRadius: 10,
                padding: 12,
                fontSize: 12,
                color: "var(--chalk-300)",
                marginBottom: 14,
              }}
            >
              🏟️ Grounds & officials are arranged by Maidan for this tier — no need to budget for them separately.
            </div>
          )}

          {tier === "self_managed" && (
            <>
              <label style={labelStyle}>Ground cost, total (₹)</label>
              <input name="ground_cost" type="number" min={0} style={inputStyle} defaultValue={0} />

              <label style={labelStyle}>Umpire cost, total (₹)</label>
              <input name="umpire_cost" type="number" min={0} style={inputStyle} defaultValue={0} />
            </>
          )}
        </>
      )}

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
        {isPending ? "Creating…" : tier === "full_service" ? "Send request" : "Publish tournament"}
      </button>
    </form>
  );
}
