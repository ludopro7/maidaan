"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { followPlayer, unfollowPlayer } from "./actions";

export function FollowButton({ playerId, isFollowing }: { playerId: string; isFollowing: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      if (isFollowing) {
        await unfollowPlayer(playerId);
      } else {
        await followPlayer(playerId);
      }
      router.refresh();
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      style={{
        padding: "10px 20px",
        background: isFollowing ? "transparent" : "var(--gold)",
        color: isFollowing ? "var(--chalk-100)" : "#10150f",
        border: isFollowing ? "1px solid var(--pitch-700)" : "none",
        borderRadius: 8,
        fontWeight: 700,
        fontSize: 13,
        cursor: isPending ? "default" : "pointer",
        opacity: isPending ? 0.6 : 1,
      }}
    >
      {isPending ? "…" : isFollowing ? "Following" : "Follow"}
    </button>
  );
}
