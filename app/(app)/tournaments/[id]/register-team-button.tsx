"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerTeam } from "../new/actions";

export function RegisterTeamButton({
  tournamentId,
  teamId,
  teamName,
}: {
  tournamentId: string;
  teamId: string;
  teamName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await registerTeam(tournamentId, teamId);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={handleClick}
        disabled={isPending}
        style={{
          padding: "10px 16px",
          background: "var(--ball-500)",
          color: "var(--chalk-100)",
          border: "none",
          borderRadius: 8,
          fontWeight: 600,
          cursor: isPending ? "default" : "pointer",
          opacity: isPending ? 0.6 : 1,
        }}
      >
        {isPending ? "Registering…" : `Register ${teamName}`}
      </button>
      {error && (
        <div style={{ color: "var(--danger-500)", fontSize: 13, marginTop: 6 }}>{error}</div>
      )}
    </div>
  );
}
