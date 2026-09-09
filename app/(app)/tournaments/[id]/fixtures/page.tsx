import Link from "next/link";
import { createClient } from "../../../../../lib/supabase/server";
import { GenerateFixturesButton, ScheduleMatchForm } from "./fixture-widgets";

export default async function FixturesPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name, organizer_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!tournament) {
    return <p style={{ color: "var(--chalk-300)" }}>Tournament not found.</p>;
  }

  const isOrganizer = tournament.organizer_id === user?.id;

  const { data: matches } = await supabase
    .from("matches")
    .select(
      "id, round, match_number, scheduled_at, status, ground_id, team_a:team_a_id(name), team_b:team_b_id(name), grounds(name)"
    )
    .eq("tournament_id", params.id)
    .order("round", { ascending: true })
    .order("match_number", { ascending: true });

  const { data: grounds } = isOrganizer
    ? await supabase.from("grounds").select("id, name").eq("status", "active")
    : { data: [] as any[] };

  const rounds = Array.from(new Set((matches || []).map((m: any) => m.round)));

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <Link href={`/tournaments/${params.id}`} style={{ color: "var(--chalk-400)", fontSize: 12, fontWeight: 700 }}>
          ← {tournament.name}
        </Link>
      </div>

      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Fixtures</h1>

      {(!matches || matches.length === 0) && (
        <div style={{ marginTop: 20 }}>
          <p style={{ color: "var(--chalk-300)", fontSize: 14, marginBottom: 16 }}>
            No fixtures generated yet.
          </p>
          {isOrganizer ? (
            <GenerateFixturesButton tournamentId={params.id} />
          ) : (
            <p style={{ color: "var(--chalk-300)", fontSize: 13 }}>
              Only the organizer can generate fixtures.
            </p>
          )}
        </div>
      )}

      {rounds.map((round: any) => (
        <div key={round} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
            {round}
          </div>

          {(matches || [])
            .filter((m: any) => m.round === round)
            .map((m: any) => (
              <div
                key={m.id}
                style={{
                  background: "var(--pitch-900)",
                  border: "1px solid var(--pitch-700)",
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 10,
                }}
              >
                <Link href={`/matches/${m.id}`} style={{ display: "block" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>
                      {m.team_a?.name || "TBD"} vs {m.team_b?.name || "TBD"}
                    </div>
                    <span style={{ fontSize: 11, color: "var(--chalk-300)", textTransform: "capitalize" }}>
                      {m.status?.replace("_", " ")}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--chalk-300)", marginTop: 4 }}>
                    {m.scheduled_at ? new Date(m.scheduled_at).toLocaleString() : "Not scheduled"}
                    {m.grounds?.name ? ` · ${m.grounds.name}` : ""}
                  </div>
                </Link>

                {isOrganizer && (
                  <ScheduleMatchForm
                    tournamentId={params.id}
                    matchId={m.id}
                    currentScheduledAt={m.scheduled_at}
                    currentGroundId={m.ground_id}
                    grounds={grounds || []}
                  />
                )}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
