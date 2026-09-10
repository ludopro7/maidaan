"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateRegistrationStatus } from "./registration-actions";

const btnStyle = (bg: string, color = "#fff"): React.CSSProperties => ({
  fontSize: 11,
  padding: "6px 10px",
  background: bg,
  color,
  border: "none",
  borderRadius: 6,
  fontWeight: 700,
});

export function OrganizerRegistrationButtons({
  tournamentId,
  registrationId,
}: {
  tournamentId: string;
  registrationId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function set(status: "approved" | "rejected" | "waitlisted") {
    startTransition(async () => {
      await updateRegistrationStatus(tournamentId, registrationId, status);
      router.refresh();
    });
  }

  return (
    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
      <button onClick={() => set("approved")} disabled={isPending} style={btnStyle("var(--ok-500)")}>
        Approve
      </button>
      <button onClick={() => set("waitlisted")} disabled={isPending} style={btnStyle("var(--warn-500)", "#10150f")}>
        Waitlist
      </button>
      <button onClick={() => set("rejected")} disabled={isPending} style={btnStyle("var(--danger-500)")}>
        Reject
      </button>
    </div>
  );
}

export function WithdrawButton({
  tournamentId,
  registrationId,
}: {
  tournamentId: string;
  registrationId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function withdraw() {
    startTransition(async () => {
      await updateRegistrationStatus(tournamentId, registrationId, "withdrawn");
      router.refresh();
    });
  }

  return (
    <button onClick={withdraw} disabled={isPending} style={{ ...btnStyle("var(--pitch-700)"), marginTop: 6 }}>
      Withdraw
    </button>
  );
}
