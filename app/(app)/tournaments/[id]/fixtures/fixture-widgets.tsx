"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateFixtures, scheduleMatch } from "./actions";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 10px",
  background: "var(--pitch-950)",
  border: "1px solid var(--pitch-700)",
  borderRadius: 8,
  color: "var(--chalk-100)",
  fontSize: 13,
  marginBottom: 8,
};

export function GenerateFixturesButton({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function generate() {
    setError(null);
    startTransition(async () => {
      const result = await generateFixtures(tournamentId);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div>
      {error && <div style={{ color: "var(--danger-500)", fontSize: 13, marginBottom: 10 }}>{error}</div>}
      <button
        onClick={generate}
        disabled={isPending}
        style={{
          padding: "12px 20px",
          background: "var(--gold)",
          color: "#10150f",
          border: "none",
          borderRadius: 8,
          fontWeight: 700,
          cursor: isPending ? "default" : "pointer",
          opacity: isPending ? 0.6 : 1,
        }}
      >
        {isPending ? "Generating…" : "Generate round-robin fixtures"}
      </button>
    </div>
  );
}

export function ScheduleMatchForm({
  tournamentId,
  matchId,
  currentScheduledAt,
  currentGroundId,
  grounds,
}: {
  tournamentId: string;
  matchId: string;
  currentScheduledAt: string | null;
  currentGroundId: string | null;
  grounds: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [scheduledAt, setScheduledAt] = useState(
    currentScheduledAt ? currentScheduledAt.slice(0, 16) : ""
  );
  const [groundId, setGroundId] = useState(currentGroundId || "");
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await scheduleMatch(tournamentId, matchId, scheduledAt, groundId || null);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div style={{ marginTop: 8 }}>
      <input
        type="datetime-local"
        value={scheduledAt}
        onChange={(e) => setScheduledAt(e.target.value)}
        style={inputStyle}
      />
      <select value={groundId} onChange={(e) => setGroundId(e.target.value)} style={inputStyle}>
        <option value="">No ground set</option>
        {grounds.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
      {error && <div style={{ color: "var(--danger-500)", fontSize: 12, marginBottom: 8 }}>{error}</div>}
      <button
        onClick={save}
        disabled={isPending}
        style={{
          fontSize: 12,
          padding: "8px 14px",
          background: "var(--pitch-700)",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontWeight: 700,
        }}
      >
        {isPending ? "Saving…" : "Save schedule"}
      </button>
    </div>
  );
}
