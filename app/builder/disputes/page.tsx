import { createClient } from "../../../lib/supabase/server";
import { ResolveDisputeForm } from "./resolve-widgets";

export default async function DisputesPage() {
  const supabase = createClient();

  const { data: reports } = await supabase
    .from("challenge_no_show_reports")
    .select(
      "id, challenge_id, reported_by, claim, accused_subject_type, accused_subject_id, accused_response, accused_explanation, status, created_at, challenges(challenge_type, scheduled_at)"
    )
    .eq("status", "disputed")
    .order("created_at", { ascending: true });

  const userIds = Array.from(
    new Set(
      (reports || []).flatMap((r: any) => [
        r.reported_by,
        r.accused_subject_type === "player" ? r.accused_subject_id : null,
      ].filter(Boolean))
    )
  );
  const teamIds = Array.from(
    new Set(
      (reports || [])
        .filter((r: any) => r.accused_subject_type === "team")
        .map((r: any) => r.accused_subject_id)
    )
  );

  const [{ data: profiles }, { data: teams }] = await Promise.all([
    userIds.length > 0
      ? supabase.from("profiles").select("id, full_name").in("id", userIds)
      : Promise.resolve({ data: [] as any[] }),
    teamIds.length > 0
      ? supabase.from("teams").select("id, name").in("id", teamIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const nameById = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));
  const teamNameById = new Map((teams || []).map((t: any) => [t.id, t.name]));

  function accusedName(report: any) {
    if (report.accused_subject_type === "team") {
      return teamNameById.get(report.accused_subject_id) || "Unknown team";
    }
    return nameById.get(report.accused_subject_id) || "Unknown player";
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Disputes</h1>
      <p style={{ color: "var(--chalk-300)", fontSize: 14, marginBottom: 28 }}>
        No-show reports the accused party has disputed. Resolving upholds the original report (penalty applies) or dismisses it (no penalty).
      </p>

      {(reports || []).length === 0 && (
        <p style={{ color: "var(--chalk-300)", fontSize: 14 }}>No open disputes right now.</p>
      )}

      {(reports || []).map((r: any) => (
        <div
          key={r.id}
          style={{
            background: "var(--pitch-900)",
            border: "1px solid var(--pitch-700)",
            borderRadius: 14,
            padding: 18,
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 12, color: "var(--chalk-300)", marginBottom: 4 }}>
            {r.challenges?.challenge_type} · {r.challenges?.scheduled_at ? new Date(r.challenges.scheduled_at).toLocaleString() : "No date"}
          </div>

          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
            Accused: {accusedName(r)} ({r.accused_subject_type})
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "var(--chalk-300)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>
              Reporter's claim ({nameById.get(r.reported_by) || "Unknown"})
            </div>
            <p style={{ fontSize: 13, margin: 0 }}>{r.claim}</p>
          </div>

          {r.accused_explanation && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "var(--warn-500)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>
                Accused's dispute
              </div>
              <p style={{ fontSize: 13, margin: 0 }}>{r.accused_explanation}</p>
            </div>
          )}

          <ResolveDisputeForm reportId={r.id} />
        </div>
      ))}
    </div>
  );
}
