"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resolveDispute } from "./actions";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "var(--pitch-950)",
  border: "1px solid var(--pitch-700)",
  borderRadius: 8,
  color: "var(--chalk-100)",
  marginBottom: 10,
};

export function ResolveDisputeForm({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function resolve(uphold: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await resolveDispute(reportId, uphold, notes);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div style={{ marginTop: 10 }}>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Admin notes (optional, visible to both parties)"
        style={{ ...inputStyle, resize: "vertical" }}
      />
      {error && <div style={{ color: "var(--danger-500)", fontSize: 13, marginBottom: 10 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => resolve(true)}
          disabled={isPending}
          style={{ fontSize: 12, padding: "8px 14px", background: "var(--danger-500)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: isPending ? "default" : "pointer", opacity: isPending ? 0.6 : 1 }}
        >
          Uphold report
        </button>
        <button
          onClick={() => resolve(false)}
          disabled={isPending}
          style={{ fontSize: 12, padding: "8px 14px", background: "var(--ok-500)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: isPending ? "default" : "pointer", opacity: isPending ? 0.6 : 1 }}
        >
          Dismiss report
        </button>
      </div>
    </div>
  );
}
