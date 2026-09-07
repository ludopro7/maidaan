"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reportNoShow, respondToNoShowReport } from "./noshow-actions";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "var(--pitch-950)",
  border: "1px solid var(--pitch-700)",
  borderRadius: 8,
  color: "var(--chalk-100)",
  marginBottom: 10,
};

export function ReportNoShowForm({ challengeId }: { challengeId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [claim, setClaim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await reportNoShow(challengeId, claim);
      if (result.success) {
        setOpen(false);
        setClaim("");
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
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
        Report a no-show
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
      <textarea
        value={claim}
        onChange={(e) => setClaim(e.target.value)}
        required
        rows={3}
        placeholder="What happened?"
        style={{ ...inputStyle, resize: "vertical" }}
      />
      {error && (
        <div style={{ color: "var(--danger-500)", fontSize: 13, marginBottom: 10 }}>{error}</div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="submit"
          disabled={isPending}
          style={{
            fontSize: 12,
            padding: "8px 14px",
            background: "var(--danger-500)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
          }}
        >
          {isPending ? "Submitting…" : "Submit report"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{
            fontSize: 12,
            padding: "8px 14px",
            background: "transparent",
            color: "var(--chalk-300)",
            border: "1px solid var(--pitch-700)",
            borderRadius: 8,
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function NoShowReportCard({
  challengeId,
  reportId,
  claim,
  status,
  isAccused,
}: {
  challengeId: string;
  reportId: string;
  claim: string;
  status: string;
  isAccused: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [explanation, setExplanation] = useState("");
  const [disputing, setDisputing] = useState(false);

  function respond(response: "accept" | "dispute") {
    startTransition(async () => {
      await respondToNoShowReport(challengeId, reportId, response, explanation || undefined);
      router.refresh();
    });
  }

  const statusColor: Record<string, string> = {
    pending: "var(--warn-500)",
    disputed: "var(--danger-500)",
    resolved_upheld: "var(--ok-500)",
    resolved_dismissed: "var(--chalk-300)",
  };

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
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>No-show report</div>
        <span style={{ fontSize: 11, color: statusColor[status] || "var(--chalk-300)", fontWeight: 700, textTransform: "capitalize" }}>
          {status.replace("_", " ")}
        </span>
      </div>
      <p style={{ fontSize: 13, color: "var(--chalk-300)", marginTop: 6 }}>{claim}</p>

      {isAccused && status === "pending" && (
        <>
          {disputing && (
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={2}
              placeholder="Your side of the story"
              style={{ ...inputStyle, marginTop: 8 }}
            />
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              onClick={() => respond("accept")}
              disabled={isPending}
              style={{ fontSize: 12, padding: "8px 14px", background: "var(--ok-500)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700 }}
            >
              Accept
            </button>
            <button
              onClick={() => (disputing ? respond("dispute") : setDisputing(true))}
              disabled={isPending}
              style={{ fontSize: 12, padding: "8px 14px", background: "var(--danger-500)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700 }}
            >
              {disputing ? "Submit dispute" : "Dispute"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
