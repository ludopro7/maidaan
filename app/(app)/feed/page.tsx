import Link from "next/link";
import { createClient } from "../../../lib/supabase/server";
import { LikeButton } from "../matches/[id]/like-button";

export default async function FeedPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: follows } = await supabase
    .from("player_follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followedIds = (follows || []).map((f: any) => f.following_id);

  if (followedIds.length === 0) {
    return (
      <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>👀</div>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>Your feed is empty</h1>
        <p style={{ color: "var(--chalk-300)", fontSize: 14, marginBottom: 20 }}>
          Follow players from your team rosters or match squads to see their recent matches here.
        </p>
        <Link
          href="/cricket"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            background: "var(--gold)",
            color: "#10150f",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          Go to your teams
        </Link>
      </div>
    );
  }

  const { data: followedMemberships } = await supabase
    .from("team_members")
    .select("team_id, user_id")
    .in("user_id", followedIds);

  const followedTeamIds = Array.from(new Set((followedMemberships || []).map((m: any) => m.team_id)));
  const teamToFollowedUsers = new Map<string, string[]>();
  for (const m of followedMemberships || []) {
    const list = teamToFollowedUsers.get(m.team_id) || [];
    list.push(m.user_id);
    teamToFollowedUsers.set(m.team_id, list);
  }

  const { data: matches } =
    followedTeamIds.length > 0
      ? await supabase
          .from("matches")
          .select(
            "id, scheduled_at, status, result_summary, team_a_id, team_b_id, winner_team_id, team_a:team_a_id(name), team_b:team_b_id(name), tournaments(name)"
          )
          .or(`team_a_id.in.(${followedTeamIds.join(",")}),team_b_id.in.(${followedTeamIds.join(",")})`)
          .eq("status", "completed")
          .order("scheduled_at", { ascending: false })
          .limit(20)
      : { data: [] as any[] };

  const followedProfileIds = Array.from(new Set((followedMemberships || []).map((m: any) => m.user_id)));
  const { data: followedProfiles } =
    followedProfileIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", followedProfileIds)
      : { data: [] as any[] };
  const nameById = new Map((followedProfiles || []).map((p: any) => [p.id, p.full_name || "Player"]));

  function followedNamesForMatch(m: any): string[] {
    const ids = new Set([
      ...(teamToFollowedUsers.get(m.team_a_id) || []),
      ...(teamToFollowedUsers.get(m.team_b_id) || []),
    ]);
    return Array.from(ids).map((id) => nameById.get(id) || "Player");
  }

  const matchIds = (matches || []).map((m: any) => m.id);
  const [{ data: allLikes }, { data: myLikes }] = await Promise.all([
    matchIds.length > 0
      ? supabase.from("match_likes").select("match_id").in("match_id", matchIds)
      : Promise.resolve({ data: [] as any[] }),
    matchIds.length > 0
      ? supabase.from("match_likes").select("match_id").in("match_id", matchIds).eq("user_id", user.id)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const likeCounts = new Map<string, number>();
  for (const l of allLikes || []) {
    likeCounts.set(l.match_id, (likeCounts.get(l.match_id) || 0) + 1);
  }
  const myLikedIds = new Set((myLikes || []).map((l: any) => l.match_id));

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Feed</h1>
      <p style={{ color: "var(--chalk-300)", fontSize: 14, marginBottom: 20 }}>
        Recent completed matches from players you follow.
      </p>

      {(matches || []).length === 0 && (
        <p style={{ color: "var(--chalk-300)", fontSize: 14 }}>No completed matches yet from who you follow.</p>
      )}

      {(matches || []).map((m: any) => {
        const winnerName =
          m.winner_team_id === m.team_a_id ? m.team_a?.name : m.winner_team_id === m.team_b_id ? m.team_b?.name : null;
        const names = followedNamesForMatch(m);

        return (
          <div
            key={m.id}
            style={{
              background: "var(--pitch-900)",
              border: "1px solid var(--pitch-700)",
              borderRadius: 14,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <Link href={`/matches/${m.id}`} style={{ display: "block", textDecoration: "none", color: "inherit" }}>
              <div style={{ fontSize: 11, color: "var(--chalk-300)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                {m.tournaments?.name || "Match"} · {m.scheduled_at ? new Date(m.scheduled_at).toLocaleDateString() : ""}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>
                {m.team_a?.name || "TBD"} vs {m.team_b?.name || "TBD"}
              </div>
              <div style={{ fontSize: 13, color: "var(--gold)", fontWeight: 700, marginTop: 4 }}>
                {winnerName ? `${winnerName} won` : "Match tied"}
                {m.result_summary ? ` · ${m.result_summary}` : ""}
              </div>
              {names.length > 0 && (
                <div style={{ fontSize: 12, color: "var(--chalk-300)", marginTop: 8 }}>
                  Following: {names.join(", ")}
                </div>
              )}
            </Link>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--pitch-800)" }}>
              <LikeButton matchId={m.id} initialLiked={myLikedIds.has(m.id)} initialCount={likeCounts.get(m.id) || 0} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
