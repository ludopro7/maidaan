"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordDelivery, completeInnings, startInnings } from "./actions";

const btnBase: React.CSSProperties = {
  height: 54,
  border: "1px solid var(--pitch-700)",
  background: "var(--pitch-900)",
  borderRadius: 14,
  fontSize: 17,
  fontWeight: 900,
  color: "var(--chalk-100)",
};

export function ScoringPanel({
  matchId,
  inningsId,
  nextBallSequence,
}: {
  matchId: string;
  inningsId: string;
  nextBallSequence: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function ball(
    runs: number,
    extraType: "wide" | "noball" | "bye" | "legbye" | null,
    extraRuns: number,
    isLegalBall: boolean,
    isWicket = false,
    wicketType: string | null = null
  ) {
    setError(null);
    startTransition(async () => {
      const result = await recordDelivery(
        matchId,
        inningsId,
        nextBallSequence,
        runs,
        extraType,
        extraRuns,
        isWicket,
        wicketType,
        isLegalBall
      );
      if (result.success) {
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  function endInnings() {
    startTransition(async () => {
      await completeInnings(matchId, inningsId);
      router.refresh();
    });
  }

  return (
    <div>
      {error && <div style={{ color: "var(--danger-500)", fontSize: 13, marginBottom: 10 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 8 }}>
        {[0, 1, 2, 3].map((r) => (
          <button key={r} disabled={isPending} onClick={() => ball(r, null, 0, true)} style={btnBase}>
            {r}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 8 }}>
        <button disabled={isPending} onClick={() => ball(4, null, 0, true)} style={{ ...btnBase, background: "var(--gold)", color: "#10150f" }}>
          4
        </button>
        <button disabled={isPending} onClick={() => ball(6, null, 0, true)} style={{ ...btnBase, background: "var(--gold)", color: "#10150f" }}>
          6
        </button>
        <button disabled={isPending} onClick={() => ball(0, null, 0, true, true, "bowled")} style={{ ...btnBase, background: "var(--danger-500)", color: "#fff" }}>
          OUT
        </button>
        <button disabled={isPending} onClick={endInnings} style={{ ...btnBase, background: "var(--pitch-700)", fontSize: 11 }}>
          End innings
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        <button disabled={isPending} onClick={() => ball(0, "wide", 1, false)} style={{ ...btnBase, fontSize: 11, height: 42 }}>
          Wide +1
        </button>
        <button disabled={isPending} onClick={() => ball(0, "noball", 1, false)} style={{ ...btnBase, fontSize: 11, height: 42 }}>
          No-ball +1
        </button>
        <button disabled={isPending} onClick={() => ball(0, "bye", 1, true)} style={{ ...btnBase, fontSize: 11, height: 42 }}>
          Bye +1
        </button>
      </div>
    </div>
  );
}

export function StartInningsForm({
  matchId,
  inningsNumber,
  teamAId,
  teamAName,
  teamBId,
  teamBName,
}: {
  matchId: string;
  inningsNumber: 1 | 2;
  teamAId: string;
  teamAName: string;
  teamBId: string;
  teamBName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function start(battingTeamId: string, bowlingTeamId: string) {
    setError(null);
    startTransition(async () => {
      const result = await startInnings(matchId, inningsNumber, battingTeamId, bowlingTeamId);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--chalk-300)", marginBottom: 12 }}>
        Innings {inningsNumber}: who's batting?
      </p>
      {error && <div style={{ color: "var(--danger-500)", fontSize: 13, marginBottom: 10 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button disabled={isPending} onClick={() => start(teamAId, teamBId)} style={{ ...btnBase, flex: 1, fontSize: 13 }}>
          {teamAName}
        </button>
        <button disabled={isPending} onClick={() => start(teamBId, teamAId)} style={{ ...btnBase, flex: 1, fontSize: 13 }}>
          {teamBName}
        </button>
      </div>
    </div>
  );
}
