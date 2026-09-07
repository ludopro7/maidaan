import { createClient } from "../../../lib/supabase/server";

const statusColor: Record<string, string> = {
  open: "var(--warn-500)",
  accepted: "var(--ok-500)",
  declined: "var(--danger-500)",
  confirmed: "var(--ok-500)",
  completed: "var(--chalk-300)",
  cancelled: "var(--danger-500)",
};

export default async function ChallengesPage() {
  const supabase = createClient();

  const { data: challenges } = await supabase
    .from("challenges")
    .select(
      "id, challenge_type, scheduled_at, status, opponent_type, challenger_id, opponent_user_id, challenger_team:challenger_team_id(name), opponent_team:opponent_team_id(name)"
    )
    .order("created_at", { ascending: false });

  const userIds = Array.from(
    new Set(
      (challenges || []).flatMap((c: any) => [c.challenger_id, c.opponent_user_id].filter(Boolean))
    )
  );

  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
      : { data: [] as any[] };

  const nameById = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22 }}>Challenges</h1>
        <a
          href="/challenges/new"
          style={{
            fontSize: 13,
            padding: "8px 14px",
            background: "var(--ball-500)",
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          + Create
        </a>
      </div>

      {(challenges || []).length === 0 && (
        <p style={{ color: "var(--chalk-300)", fontSize: 14 }}>No challenges yet.</p>
      )}

      {(challenges || []).map((c: any) => (
        <a
          key={c.id}
          href={`/challenges/${c.id}`}
          style={{
            display: "block",
            background: "var(--pitch-900)",
            border: "1px solid var(--pitch-700)",
            borderRadius: 12,
            padding: 16,
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 600 }}>{c.challenge_type}</div>
            <span style={{ fontSize: 11, color: statusColor[c.status], fontWeight: 700, textTransform: "capitalize" }}>
              {c.status}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--chalk-300)", marginTop: 4 }}>
            {c.challenger_team?.name || nameById.get(c.challenger_id) || "Challenger"} vs{" "}
            {c.opponent_type === "team" ? c.opponent_team?.name : nameById.get(c.opponent_user_id) || "Opponent"}
          </div>
          {c.scheduled_at && (
            <div style={{ fontSize: 12, color: "var(--chalk-300)", marginTop: 2 }}>
              {new Date(c.scheduled_at).toLocaleString()}
            </div>
          )}
        </a>
      ))}
    </div>
  );
}
