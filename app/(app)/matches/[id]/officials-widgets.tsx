"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignOfficial, respondToAssignment } from "./officials-actions";

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

type OfficialOption = { id: string; name: string; role: string };

export function AssignOfficialForm({ matchId, officials }: { matchId: string; officials: OfficialOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [officialId, setOfficialId] = useState("");
  const [role, setRole] = useState<"umpire" | "scorer" | "umpire_scorer">("umpire");
  const [error, setError] = useState<string | null>(null);

  function assign() {
    if (!officialId) {
      setError("Select an official.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await assignOfficial(matchId, officialId, role);
      if (result.success) {
        setOfficialId("");
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div style={{ marginTop: 10 }}>
      <select value={officialId} onChange={(e) => setOfficialId(e.target.value)} style={inputStyle}>
        <option value="">Select an official</option>
        {officials.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name} ({o.role})
          </option>
        ))}
      </select>
      <select value={role} onChange={(e) => setRole(e.target.value as any)} style={inputStyle}>
        <option value="umpire">Umpire</option>
        <option value="scorer">Scorer</option>
        <option value="umpire_scorer">Umpire + Scorer</option>
      </select>
      {error && <div style={{ color: "var(--danger-500)", fontSize: 12, marginBottom: 8 }}>{error}</div>}
      <button
        onClick={assign}
        disabled={isPending}
        style={{
          fontSize: 12,
          padding: "8px 14px",
          background: "var(--gold)",
          color: "#10150f",
          border: "none",
          borderRadius: 8,
          fontWeight: 700,
        }}
      >
        {isPending ? "Assigning…" : "Assign to match"}
      </button>
    </div>
  );
}

export function RespondToAssignmentButtons({ matchId, matchOfficialId }: { matchId: string; matchOfficialId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function respond(status: "confirmed" | "cancelled") {
    startTransition(async () => {
      await respondToAssignment(matchId, matchOfficialId, status);
      router.refresh();
    });
  }

  return (
    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
      <button
        onClick={() => respond("confirmed")}
        disabled={isPending}
        style={{ fontSize: 11, padding: "6px 10px", background: "var(--ok-500)", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700 }}
      >
        Confirm
      </button>
      <button
        onClick={() => respond("cancelled")}
        disabled={isPending}
        style={{ fontSize: 11, padding: "6px 10px", background: "var(--danger-500)", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700 }}
      >
        Decline
      </button>
    </div>
  );
}
