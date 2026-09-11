"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleLike } from "./like-actions";

export function LikeButton({
  matchId,
  initialLiked,
  initialCount,
}: {
  matchId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));
    startTransition(async () => {
      const result = await toggleLike(matchId, liked);
      if (!result.success) {
        setLiked(liked);
        setCount((c) => c + (liked ? 1 : -1));
      }
      router.refresh();
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: isPending ? "default" : "pointer",
        color: liked ? "var(--gold)" : "var(--chalk-300)",
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      <span>{liked ? "★" : "☆"}</span>
      <span>{count}</span>
    </button>
  );
}
