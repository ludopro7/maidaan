"use client";

import { useState, useTransition } from "react";
import { createChallenge } from "./actions";

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

type Team = { id: string; name: string };

export function ChallengeForm({ myTeams, otherTeams }: { myTeams: Team[]; otherTeams: Team[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [opponentType, setOpponentType] = useState<"player" | "team">("player");

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createChallenge(formData);
      if (result && !result.success) {
        setError(result.message);
      }
    });
  }

  return (
    <form action={handleSubmit}>
      <label style={labelStyle}>Challenge type</label>
      <input name="challenge_type" required style={inputStyle} placeholder="e.g. 20-ball batting" />

      <label style={labelStyle}>Opponent type</label>
      <select
        name="opponent_type"
        style={inputStyle}
        value={opponentType}
        onChange={(e) => setOpponentType(e.target.value as "player" | "team")}
      >
        <option value="player">Player</option>
        <option value="team">Team</option>
      </select>

      {opponentType === "player" ? (
        <>
          <label style={labelStyle}>Opponent's email</label>
          <input name="opponent_email" type="email" style={inputStyle} placeholder="their@email.com" />
        </>
      ) : (
        <>
          <label style={labelStyle}>Your team</label>
          <select name="challenger_team_id" style={inputStyle} defaultValue="">
            <option value="" disabled>
              Select your team
            </option>
            {myTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <label style={labelStyle}>Opponent team</label>
          <select name="opponent_team_id" style={inputStyle} defaultValue="">
            <option value="" disabled>
              Select opponent team
            </option>
            {otherTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </>
      )}

      <label style={labelStyle}>When (optional)</label>
      <input name="scheduled_at" type="datetime-local" style={inputStyle} />

      <label style={labelStyle}>Notes (optional)</label>
      <input name="notes" style={inputStyle} placeholder="Anything the opponent should know" />

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
        {isPending ? "Sending…" : "Send challenge"}
      </button>
    </form>
  );
}
