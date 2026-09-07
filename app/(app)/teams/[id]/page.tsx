import { createClient } from "../../../../lib/supabase/server";

export default async function TeamDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: team } = await supabase
    .from("teams")
    .select("id, name, description, captain_id, verification_status, cities(name)")
    .eq("id", params.id)
    .maybeSingle();

  if (!team) {
    return <p style={{ color: "var(--chalk-300)" }}>Team not found.</p>;
  }

  const { data: members } = await supabase
    .from("team_members")
    .select("user_id, member_role, profiles(full_name, email)")
    .eq("team_id", params.id);

  const { data: registrations } = await supabase
    .from("tournament_teams")
    .select("status, tournaments(id, name, start_date)")
    .eq("team_id", params.id);

  return (
    <div style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: 22, marginBottom: 2 }}>{team.name}</h1>
      <div style={{ fontSize: 13, color: "var(--chalk-300)", marginBottom: 4 }}>
        {(team as any).cities?.name || "No city set"} · {team.verification_status}
      </div>
      {team.description && (
        <p style={{ fontSize: 14, color: "var(--chalk-300)", marginBottom: 20 }}>
          {team.description}
        </p>
      )}

      <h2 style={{ fontSize: 16, marginBottom: 8, marginTop: 20 }}>Roster</h2>
      {(members || []).map((m: any) => (
        <div
          key={m.user_id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "10px 0",
            borderBottom: "1px solid var(--pitch-800)",
            fontSize: 14,
          }}
        >
          <span>{m.profiles?.full_name || m.profiles?.email || "Player"}</span>
          <span style={{ color: "var(--chalk-300)", fontSize: 12, textTransform: "capitalize" }}>
            {m.member_role}
          </span>
        </div>
      ))}

      <h2 style={{ fontSize: 16, marginBottom: 8, marginTop: 24 }}>Tournament registrations</h2>
      {(registrations || []).length === 0 && (
        <p style={{ fontSize: 14, color: "var(--chalk-300)" }}>
          Not registered for any tournaments yet. Find one in{" "}
          <a href="/tournaments" style={{ color: "var(--ball-500)" }}>
            Tournaments
          </a>
          .
        </p>
      )}
      {(registrations || []).map((r: any, i: number) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "10px 0",
            borderBottom: "1px solid var(--pitch-800)",
            fontSize: 14,
          }}
        >
          <a href={`/tournaments/${r.tournaments?.id}`} style={{ color: "inherit" }}>
            {r.tournaments?.name}
          </a>
          <span style={{ color: "var(--warn-500)", fontSize: 12, textTransform: "capitalize" }}>
            {r.status}
          </span>
        </div>
      ))}
    </div>
  );
}
