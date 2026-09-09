import { createClient } from "../../../../../lib/supabase/server";
import { ScoringPanel, StartInningsForm } from "./scoring-widgets";

function oversDisplay(totalBalls: number) {
  const overs = Math.floor(totalBalls / 6);
  const balls = totalBalls % 6;
  return `${overs}.${balls}`;
}

export default async function ScoringPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: match } = await supabase
    .from("matches")
    .select("id, team_a_id, team_b_id, team_a:team_a_id(name), team_b:team_b_id(name)")
    .eq("id", params.id)
    .maybeSingle();

  if (!match) {
    return <p style={{ color: "var(--chalk-300)" }}>Match not found.</p>;
  }

  const { data: inningsList } = await supabase
    .from("innings")
    .select("id, innings_number, batting_team_id, bowling_team_id, total_runs, total_wickets, total_balls, status")
    .eq("match_id", params.id)
    .order("innings_number", { ascending: true });

  const currentInnings = (inningsList || []).find((i: any) => i.status === "in_progress");
  const nextInningsNumber = ((inningsList || []).length + 1) as 1 | 2;

  const { count: deliveryCount } = currentInnings
    ? await supabase
        .from("deliveries")
        .select("id", { count: "exact", head: true })
        .eq("innings_id", currentInnings.id)
    : { count: 0 };

  const teamA = (match as any).team_a;
  const teamB = (match as any).team_b;

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Live scoring</h1>

      {(inningsList || []).map((inn: any) => {
        const battingName = inn.batting_team_id === match.team_a_id ? teamA?.name : teamB?.name;
        return (
          <div
            key={inn.id}
            style={{
              background: "var(--pitch-900)",
              border: "1px solid var(--pitch-700)",
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 11, color: "var(--chalk-300)", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Innings {inn.innings_number} · {inn.status === "completed" ? "Completed" : "In progress"}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 30, fontWeight: 900 }}>
                {inn.total_runs}/{inn.total_wickets}
              </span>
              <span style={{ fontSize: 13, color: "var(--chalk-300)" }}>({oversDisplay(inn.total_balls)} ov)</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--chalk-300)", marginTop: 4 }}>{battingName} batting</div>
          </div>
        );
      })}

      {currentInnings && (
        <ScoringPanel
          matchId={params.id}
          inningsId={currentInnings.id}
          nextBallSequence={(deliveryCount || 0) + 1}
        />
      )}

      {!currentInnings && nextInningsNumber <= 2 && teamA && teamB && (
        <StartInningsForm
          matchId={params.id}
          inningsNumber={nextInningsNumber}
          teamAId={match.team_a_id}
          teamAName={teamA.name}
          teamBId={match.team_b_id}
          teamBName={teamB.name}
        />
      )}

      {!currentInnings && nextInningsNumber > 2 && (
        <p style={{ color: "var(--ok-500)", fontSize: 14, fontWeight: 700 }}>Both innings complete.</p>
      )}
    </div>
  );
}
