"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addComment, deleteComment } from "./comment-actions";

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: { full_name: string | null } | null;
};

export function Comments({ matchId, comments, currentUserId }: { matchId: string; comments: Comment[]; currentUserId: string | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addComment(matchId, text);
      if (result.success) {
        setText("");
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  function remove(commentId: string) {
    startTransition(async () => {
      await deleteComment(matchId, commentId);
      router.refresh();
    });
  }

  return (
    <div>
      <h2 style={{ fontSize: 16, marginBottom: 8 }}>Comments</h2>

      <form onSubmit={submit} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Say something about this match…"
          style={{
            flex: 1,
            padding: "10px 12px",
            background: "var(--pitch-950)",
            border: "1px solid var(--pitch-700)",
            borderRadius: 8,
            color: "var(--chalk-100)",
          }}
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
          }}
        >
          Post
        </button>
      </form>
      {error && <div style={{ color: "var(--danger-500)", fontSize: 12, marginBottom: 12 }}>{error}</div>}

      {comments.length === 0 && <p style={{ fontSize: 13, color: "var(--chalk-300)" }}>No comments yet.</p>}
      {comments.map((c) => (
        <div key={c.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--pitch-800)" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{c.profiles?.full_name || "Player"}</span>
            <span style={{ fontSize: 11, color: "var(--chalk-400)" }}>{new Date(c.created_at).toLocaleDateString()}</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--chalk-100)", margin: "4px 0" }}>{c.content}</p>
          {c.user_id === currentUserId && (
            <button
              onClick={() => remove(c.id)}
              disabled={isPending}
              style={{ fontSize: 11, color: "var(--danger-500)", background: "transparent", border: "none", padding: 0 }}
            >
              Delete
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
