import { createClient } from "../../../../../lib/supabase/server";
import { ScoringPanel, StartInningsForm } from "./scoring-widgets";

function oversDisplay(totalBalls: number) {
  const overs = Math.floor(totalBalls / 6);
  const balls = totalBalls % 6;
  return `${overs}.${balls}`;
}

function ballLabel(d: {
  runs: number;
  extra_type: string | null;
  extra_runs: number;
  is_wicket: boolean;
}) {
  if (d.is_wicket) return "W";
  if (d.extra_type === "wide") return `${d.extra_runs}wd`;
  if (d.extra_type === "noball") return `${d.extra_runs}nb`;
  if (d.extra_type === "bye") return `${d.extra_runs}b`;
  if (d.extra_type === "legbye") return `${d.extra_runs}lb`;
  return String(d.runs);
}

function ballColor(d: {
  runs: number;
  extra_type: string | null;
  is_wicket: boolean;
}) {
  if (d.is_wicket) return "var(--danger-500)";
  if (d.extra_type) return "var(--warn-500)";
  if (d.runs === 4 || d.runs === 6) return "var(--gold)";
  return "var(--chalk-300)";
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

  const { data: recentDeliveries, count: deliveryCount } = currentInnings
    ? await supabase
        .from("deliveries")
        .select("id, ball_sequence, runs, extra_type, extra_runs, is_wicket, wicket_type", { count: "exact" })
        .eq("innings_id", currentInnings.id)
        .order("ball_sequence", { ascending: false })
        .limit(18)
    : { data: [] as any[], count: 0 };

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

      {currentInnings && (recentDeliveries || []).length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "var(--chalk-300)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
            This over · recent balls
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {[...(recentDeliveries || [])].reverse().map((d: any) => (
              <div
                key={d.id}
                title={d.is_wicket ? d.wicket_type || "Out" : undefined}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 800,
                  color: d.runs === 4 || d.runs === 6 || d.is_wicket ? "#10150f" : "var(--chalk-100)",
                  background: d.is_wicket
                    ? "var(--danger-500)"
                    : d.runs === 4 || d.runs === 6
                    ? "var(--gold)"
                    : d.extra_type
                    ? "rgba(217, 164, 65, 0.2)"
                    : "var(--pitch-900)",
                  border: `1px solid ${ballColor(d)}`,
                }}
              >
                {ballLabel(d)}
              </div>
            ))}
          </div>
        </div>
      )}

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
