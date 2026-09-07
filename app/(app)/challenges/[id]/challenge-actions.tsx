"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateChallengeStatus } from "../new/actions";

export function ChallengeActionButtons({
  challengeId,
  canRespond,
  canConfirm,
  canCancel,
}: {
  challengeId: string;
  canRespond: boolean;
  canConfirm: boolean;
  canCancel: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function set(status: "accepted" | "declined" | "confirmed" | "cancelled" | "completed") {
    startTransition(async () => {
      await updateChallengeStatus(challengeId, status);
      router.refresh();
    });
  }

  const btnStyle = (bg: string): React.CSSProperties => ({
    fontSize: 12,
    padding: "8px 14px",
    background: bg,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 700,
  });

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
      {canRespond && (
        <>
          <button onClick={() => set("accepted")} disabled={isPending} style={btnStyle("var(--ok-500)")}>
            Accept
          </button>
          <button onClick={() => set("declined")} disabled={isPending} style={btnStyle("var(--danger-500)")}>
            Decline
          </button>
        </>
      )}
      {canConfirm && (
        <button onClick={() => set("confirmed")} disabled={isPending} style={btnStyle("var(--ball-500)")}>
          Confirm
        </button>
      )}
      {canCancel && (
        <button onClick={() => set("cancelled")} disabled={isPending} style={btnStyle("var(--pitch-700)")}>
          Cancel
        </button>
      )}
    </div>
  );
}
