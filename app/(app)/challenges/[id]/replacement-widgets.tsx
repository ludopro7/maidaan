"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestReplacement, offerReplacement, respondToReplacementOffer } from "./replacement-actions";

export function RequestReplacementButton({
  challengeId,
  vacatedRole,
}: {
  challengeId: string;
  vacatedRole: "challenger" | "opponent";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await requestReplacement(challengeId, vacatedRole);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      style={{
        fontSize: 12,
        padding: "8px 14px",
        background: "var(--pitch-700)",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        fontWeight: 700,
        marginTop: 16,
      }}
    >
      {isPending ? "Requesting…" : "Can't play — find a replacement"}
    </button>
  );
}

type Candidate = {
  id: string;
  full_name: string | null;
  reliability_score: number | null;
  playing_role: string | null;
};

export function CandidateList({
  challengeId,
  requestId,
  candidates,
}: {
  challengeId: string;
  requestId: string;
  candidates: Candidate[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function offer(candidateId: string) {
    startTransition(async () => {
      await offerReplacement(challengeId, requestId, candidateId);
      router.refresh();
    });
  }

  if (candidates.length === 0) {
    return <p style={{ fontSize: 13, color: "var(--chalk-300)" }}>No eligible candidates found nearby yet.</p>;
  }

  return (
    <div style={{ marginTop: 10 }}>
      {candidates.map((c) => (
        <div
          key={c.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 0",
            borderBottom: "1px solid var(--pitch-800)",
          }}
        >
          <div>
            <div style={{ fontSize: 14 }}>{c.full_name || "Player"}</div>
            <div style={{ fontSize: 12, color: "var(--chalk-300)" }}>
              {c.playing_role || "Role N/A"} · {c.reliability_score?.toFixed(0) ?? "?"}% trust
            </div>
          </div>
          <button
            onClick={() => offer(c.id)}
            disabled={isPending}
            style={{
              fontSize: 11,
              padding: "6px 10px",
              background: "var(--ball-500)",
              color: "var(--pitch-950)",
              border: "none",
              borderRadius: 6,
              fontWeight: 700,
            }}
          >
            Offer
          </button>
        </div>
      ))}
    </div>
  );
}

export function ReplacementOfferResponse({
  challengeId,
  offerId,
}: {
  challengeId: string;
  offerId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function respond(response: "accept" | "decline") {
    startTransition(async () => {
      await respondToReplacementOffer(challengeId, offerId, response);
      router.refresh();
    });
  }

  return (
    <div
      style={{
        background: "var(--pitch-900)",
        border: "1px solid var(--pitch-700)",
        borderRadius: 12,
        padding: 14,
        marginTop: 16,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
        You've been offered a spot in this challenge
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => respond("accept")}
          disabled={isPending}
          style={{ fontSize: 12, padding: "8px 14px", background: "var(--ok-500)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700 }}
        >
          Accept
        </button>
        <button
          onClick={() => respond("decline")}
          disabled={isPending}
          style={{ fontSize: 12, padding: "8px 14px", background: "var(--pitch-700)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700 }}
        >
          Decline
        </button>
      </div>
    </div>
  );
}
