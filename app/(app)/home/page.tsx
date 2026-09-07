import { createClient } from "../../../lib/supabase/server";

const cardStyle: React.CSSProperties = {
  display: "block",
  background: "var(--pitch-900)",
  border: "1px solid var(--pitch-700)",
  borderRadius: 12,
  padding: 20,
  marginBottom: 12,
};

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .maybeSingle();

  const { count: myTeamsCount } = await supabase
    .from("teams")
    .select("id", { count: "exact", head: true })
    .eq("captain_id", user!.id);

  const { count: openTournaments } = await supabase
    .from("tournaments")
    .select("id", { count: "exact", head: true })
    .in("status", ["published", "registration_open"]);

  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user!.id);
  const teamIds = (memberships || []).map((m) => m.team_id);

  const { data: nextMatch } =
    teamIds.length > 0
      ? await supabase
          .from("matches")
          .select("id, scheduled_at, team_a:team_a_id(name), team_b:team_b_id(name)")
          .or(`team_a_id.in.(${teamIds.join(",")}),team_b_id.in.(${teamIds.join(",")})`)
          .not("scheduled_at", "is", null)
          .gte("scheduled_at", new Date().toISOString())
          .order("scheduled_at", { ascending: true })
          .limit(1)
          .maybeSingle()
      : { data: null };

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>
        {profile?.full_name ? `Hey, ${profile.full_name}` : "Welcome"}
      </h1>
      <p style={{ color: "var(--chalk-300)", fontSize: 14, marginBottom: 24 }}>
        What do you want to do?
      </p>

      {nextMatch && (
        <a href={`/matches/${nextMatch.id}`} style={cardStyle}>
          <div style={{ fontWeight: 600 }}>
            Next: {(nextMatch as any).team_a?.name} vs {(nextMatch as any).team_b?.name}
          </div>
          <div style={{ fontSize: 13, color: "var(--chalk-300)" }}>
            {new Date(nextMatch.scheduled_at).toLocaleString()}
          </div>
        </a>
      )}

      <a href="/matches" style={cardStyle}>
        <div style={{ fontWeight: 600 }}>All your matches</div>
        <div style={{ fontSize: 13, color: "var(--chalk-300)" }}>Fixtures, readiness, check-in</div>
      </a>

      <a href="/teams/new" style={cardStyle}>
        <div style={{ fontWeight: 600 }}>Create a team</div>
        <div style={{ fontSize: 13, color: "var(--chalk-300)" }}>
          You have {myTeamsCount ?? 0} team{myTeamsCount === 1 ? "" : "s"} as captain
        </div>
      </a>

      <a href="/tournaments/new" style={cardStyle}>
        <div style={{ fontWeight: 600 }}>Organize a tournament</div>
        <div style={{ fontSize: 13, color: "var(--chalk-300)" }}>
          Set format, rules, fees, and open registration
        </div>
      </a>

      <a href="/tournaments" style={cardStyle}>
        <div style={{ fontWeight: 600 }}>Browse tournaments</div>
        <div style={{ fontSize: 13, color: "var(--chalk-300)" }}>
          {openTournaments ?? 0} open for registration right now
        </div>
      </a>

      <a href="/grounds" style={cardStyle}>
        <div style={{ fontWeight: 600 }}>Find or list a ground</div>
        <div style={{ fontSize: 13, color: "var(--chalk-300)" }}>
          Book a slot or list your ground for others
        </div>
      </a>

      <a href="/officials" style={cardStyle}>
        <div style={{ fontWeight: 600 }}>Umpires & scorers</div>
        <div style={{ fontSize: 13, color: "var(--chalk-300)" }}>
          Request an official or offer your services
        </div>
      </a>

      <a href="/challenges" style={cardStyle}>
        <div style={{ fontWeight: 600 }}>Challenges</div>
        <div style={{ fontSize: 13, color: "var(--chalk-300)" }}>
          Challenge a player or team — no betting
        </div>
      </a>

      <a href="/profile" style={cardStyle}>
        <div style={{ fontWeight: 600 }}>Complete your player profile</div>
        <div style={{ fontSize: 13, color: "var(--chalk-300)" }}>
          Batting/bowling style, role, format
        </div>
      </a>
    </div>
  );
}
