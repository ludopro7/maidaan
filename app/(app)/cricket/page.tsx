import { createClient } from "../../../lib/supabase/server";
import { getCareerStats } from "../../../lib/cricket-stats";
import { CricketHubTabs } from "./hub-tabs";

export default async function CricketHubPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id, member_role, teams(id, name)")
    .eq("user_id", user.id);

  const teams = (memberships || []).map((m: any) => ({ ...m.teams, member_role: m.member_role })).filter(Boolean);
  const teamIds = teams.map((t: any) => t.id);

  const [{ data: matches }, { data: tournamentRegs }, stats] = await Promise.all([
    teamIds.length > 0
      ? supabase
          .from("matches")
          .select("id, status, scheduled_at, team_a:team_a_id(name), team_b:team_b_id(name), tournaments(name)")
          .or(`team_a_id.in.(${teamIds.join(",")}),team_b_id.in.(${teamIds.join(",")})`)
          .order("scheduled_at", { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
    teamIds.length > 0
      ? supabase
          .from("tournament_teams")
          .select("status, tournaments(id, name)")
          .in("team_id", teamIds)
      : Promise.resolve({ data: [] as any[] }),
    getCareerStats(supabase, user.id),
  ]);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Your cricket</h1>
      <p style={{ color: "var(--chalk-300)", fontSize: 14, marginBottom: 20 }}>
        Matches, tournaments, teams, and your career numbers — all in one place.
      </p>

      <CricketHubTabs
        matches={matches || []}
        tournaments={tournamentRegs || []}
        teams={teams}
        batting={stats.batting}
        bowling={stats.bowling}
      />
    </div>
  );
}
