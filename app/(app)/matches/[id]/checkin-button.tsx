"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkIn } from "./actions";

export function CheckInButton({ matchId }: { matchId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await checkIn(matchId);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      style={{
        padding: "12px 20px",
        background: "var(--ball-500)",
        color: "var(--pitch-950)",
        border: "none",
        borderRadius: 10,
        fontWeight: 800,
        fontSize: 13,
        cursor: isPending ? "default" : "pointer",
        opacity: isPending ? 0.6 : 1,
      }}
    >
      {isPending ? "Checking in…" : "CHECK IN"}
    </button>
  );
}
