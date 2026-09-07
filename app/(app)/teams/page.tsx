import { createClient } from "../../../lib/supabase/server";

export default async function TeamsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id, member_role, teams(id, name, city_id, verification_status)")
    .eq("user_id", user!.id);

  const teams = (memberships || [])
    .map((m: any) => ({ ...m.teams, member_role: m.member_role }))
    .filter(Boolean);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22 }}>Your teams</h1>
        <a
          href="/teams/new"
          style={{
            fontSize: 13,
            padding: "8px 14px",
            background: "var(--ball-500)",
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          + New team
        </a>
      </div>

      {teams.length === 0 && (
        <p style={{ color: "var(--chalk-300)", fontSize: 14 }}>
          No teams yet. Create one to start registering for tournaments and challenges.
        </p>
      )}

      {teams.map((team: any) => (
        <a
          key={team.id}
          href={`/teams/${team.id}`}
          style={{
            display: "block",
            background: "var(--pitch-900)",
            border: "1px solid var(--pitch-700)",
            borderRadius: 12,
            padding: 16,
            marginBottom: 10,
          }}
        >
          <div style={{ fontWeight: 600 }}>{team.name}</div>
          <div style={{ fontSize: 12, color: "var(--chalk-300)", marginTop: 2 }}>
            {team.member_role === "captain" ? "Captain" : "Member"}
          </div>
        </a>
      ))}
    </div>
  );
}
