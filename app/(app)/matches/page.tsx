import { createClient } from "../../../lib/supabase/server";

const statusColor: Record<string, string> = {
  scheduled: "var(--warn-500)",
  in_progress: "var(--ball-500)",
  completed: "var(--chalk-300)",
  cancelled: "var(--danger-500)",
  postponed: "var(--danger-500)",
};

export default async function MatchesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user!.id);

  const teamIds = (memberships || []).map((m) => m.team_id);

  const { data: matches } =
    teamIds.length > 0
      ? await supabase
          .from("matches")
          .select(
            "id, round, match_number, scheduled_at, status, tournaments(name), team_a:team_a_id(name), team_b:team_b_id(name)"
          )
          .or(`team_a_id.in.(${teamIds.join(",")}),team_b_id.in.(${teamIds.join(",")})`)
          .order("scheduled_at", { ascending: true })
      : { data: [] as any[] };

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Your matches</h1>

      {(matches || []).length === 0 && (
        <p style={{ color: "var(--chalk-300)", fontSize: 14 }}>
          No matches yet. They'll show up here once your team is placed in a tournament fixture.
        </p>
      )}

      {(matches || []).map((m: any) => (
        <a
          key={m.id}
          href={`/matches/${m.id}`}
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
            <div style={{ fontWeight: 600 }}>
              {m.team_a?.name || "TBD"} vs {m.team_b?.name || "TBD"}
            </div>
            <span style={{ fontSize: 11, color: statusColor[m.status], fontWeight: 700, textTransform: "capitalize" }}>
              {m.status.replace("_", " ")}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--chalk-300)", marginTop: 4 }}>
            {m.tournaments?.name} · {m.round}
            {m.scheduled_at ? ` · ${new Date(m.scheduled_at).toLocaleString()}` : " · Not scheduled"}
          </div>
        </a>
      ))}
    </div>
  );
}
