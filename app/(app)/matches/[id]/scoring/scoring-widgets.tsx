"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordDelivery, completeInnings, startInnings, setInningsPlayers } from "./actions";

const btnBase: React.CSSProperties = {
  height: 54,
  border: "1px solid var(--pitch-700)",
  background: "var(--pitch-900)",
  borderRadius: 14,
  fontSize: 17,
  fontWeight: 900,
  color: "var(--chalk-100)",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "var(--pitch-950)",
  border: "1px solid var(--pitch-700)",
  borderRadius: 8,
  color: "var(--chalk-100)",
  marginBottom: 10,
  fontSize: 14,
};

type Player = { id: string; name: string };

export function ScoringPanel({
  matchId,
  inningsId,
  nextBallSequence,
  needsPlayers,
  battingSquad,
  bowlingSquad,
  currentBatterName,
  currentBowlerName,
}: {
  matchId: string;
  inningsId: string;
  nextBallSequence: number;
  needsPlayers: boolean;
  battingSquad: Player[];
  bowlingSquad: Player[];
  currentBatterName: string | null;
  currentBowlerName: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (needsPlayers) {
    return (
      <PlayerPickerForm
        matchId={matchId}
        inningsId={inningsId}
        battingSquad={battingSquad}
        bowlingSquad={bowlingSquad}
        requireBothBatters={true}
      />
    );
  }

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
      <div style={{ fontSize: 12, color: "var(--chalk-300)", marginBottom: 10 }}>
        {currentBatterName || "Batter"} on strike · {currentBowlerName || "Bowler"} bowling
      </div>

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

export function PlayerPickerForm({
  matchId,
  inningsId,
  battingSquad,
  bowlingSquad,
  requireBothBatters,
}: {
  matchId: string;
  inningsId: string;
  battingSquad: Player[];
  bowlingSquad: Player[];
  requireBothBatters: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [striker, setStriker] = useState("");
  const [nonStriker, setNonStriker] = useState("");
  const [bowler, setBowler] = useState("");
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (!striker || !bowler || (requireBothBatters && !nonStriker)) {
      setError("Fill in all fields.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await setInningsPlayers(matchId, inningsId, striker, nonStriker || striker, bowler);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div style={{ background: "var(--pitch-900)", border: "1px solid var(--pitch-700)", borderRadius: 14, padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Set players</div>

      <label style={{ fontSize: 12, color: "var(--chalk-300)" }}>Striker</label>
      <select value={striker} onChange={(e) => setStriker(e.target.value)} style={selectStyle}>
        <option value="">Select batter</option>
        {battingSquad.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {requireBothBatters && (
        <>
          <label style={{ fontSize: 12, color: "var(--chalk-300)" }}>Non-striker</label>
          <select value={nonStriker} onChange={(e) => setNonStriker(e.target.value)} style={selectStyle}>
            <option value="">Select batter</option>
            {battingSquad.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </>
      )}

      <label style={{ fontSize: 12, color: "var(--chalk-300)" }}>Bowler</label>
      <select value={bowler} onChange={(e) => setBowler(e.target.value)} style={selectStyle}>
        <option value="">Select bowler</option>
        {bowlingSquad.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {error && <div style={{ color: "var(--danger-500)", fontSize: 12, marginBottom: 10 }}>{error}</div>}

      <button
        onClick={save}
        disabled={isPending}
        style={{
          padding: "10px 16px",
          background: "var(--gold)",
          color: "#10150f",
          border: "none",
          borderRadius: 8,
          fontWeight: 700,
        }}
      >
        {isPending ? "Saving…" : "Confirm"}
      </button>
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
