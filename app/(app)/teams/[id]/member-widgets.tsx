"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addMember, removeMember } from "./actions";

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px 12px",
  background: "var(--pitch-950)",
  border: "1px solid var(--pitch-700)",
  borderRadius: 8,
  color: "var(--chalk-100)",
};

export function AddMemberForm({ teamId }: { teamId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const result = await addMember(teamId, email);
      if (result.success) {
        setEmail("");
        setFeedback({ ok: true, message: "Player added." });
        router.refresh();
      } else {
        setFeedback({ ok: false, message: result.message });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@email.com"
          required
          style={inputStyle}
        />
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: "10px 16px",
            background: "var(--gold)",
            color: "#10150f",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            cursor: isPending ? "default" : "pointer",
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {isPending ? "Adding…" : "Add"}
        </button>
      </div>
      {feedback && (
        <div style={{ fontSize: 13, marginTop: 8, color: feedback.ok ? "var(--ok-500)" : "var(--danger-500)" }}>
          {feedback.message}
        </div>
      )}
    </form>
  );
}

export function RemoveMemberButton({ teamId, userId }: { teamId: string; userId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await removeMember(teamId, userId);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      style={{
        fontSize: 11,
        padding: "4px 8px",
        background: "transparent",
        color: "var(--danger-500)",
        border: "1px solid var(--danger-500)",
        borderRadius: 6,
        fontWeight: 700,
        marginLeft: 8,
      }}
    >
      {isPending ? "…" : "Remove"}
    </button>
  );
}
