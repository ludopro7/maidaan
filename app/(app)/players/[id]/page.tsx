import { createClient } from "../../../../lib/supabase/server";
import { getCareerStats } from "../../../../lib/cricket-stats";
import { FollowButton } from "./follow-button";

export default async function PlayerProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: player }, stats, { count: followerCount }, { count: followingCount }, { data: iFollow }] =
    await Promise.all([
      supabase.from("profiles").select("full_name, bio, avatar_url").eq("id", params.id).maybeSingle(),
      supabase
        .from("players")
        .select("playing_role, batting_hand, bowling_style, reliability_score, matches_completed, no_show_count, late_cancel_count")
        .eq("user_id", params.id)
        .maybeSingle(),
      getCareerStats(supabase, params.id),
      supabase.from("player_follows").select("id", { count: "exact", head: true }).eq("following_id", params.id),
      supabase.from("player_follows").select("id", { count: "exact", head: true }).eq("follower_id", params.id),
      user
        ? supabase
            .from("player_follows")
            .select("id")
            .eq("follower_id", user.id)
            .eq("following_id", params.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  if (!profile) {
    return <p style={{ color: "var(--chalk-300)" }}>Player not found.</p>;
  }

  const isSelf = user?.id === params.id;
  const reliability = player?.reliability_score != null ? Number(player.reliability_score) : null;

  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--pitch-700)" }}
          />
        ) : (
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--pitch-900)",
              border: "1px solid var(--pitch-700)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
            }}
          >
            🏏
          </div>
        )}
        <div>
          <h1 style={{ fontSize: 20, margin: 0 }}>{profile.full_name || "Player"}</h1>
          <div style={{ fontSize: 12, color: "var(--chalk-300)", marginTop: 2 }}>
            {player?.playing_role || "Role not set"}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--chalk-300)", marginBottom: 16 }}>
        <span>
          <strong style={{ color: "var(--chalk-100)" }}>{followerCount ?? 0}</strong> followers
        </span>
        <span>
          <strong style={{ color: "var(--chalk-100)" }}>{followingCount ?? 0}</strong> following
        </span>
      </div>

      {profile.bio && <p style={{ fontSize: 14, color: "var(--chalk-300)", marginBottom: 16 }}>{profile.bio}</p>}

      {isSelf ? (
        <a
          href="/profile"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            background: "var(--pitch-700)",
            color: "#fff",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            marginBottom: 24,
          }}
        >
          Edit your profile
        </a>
      ) : user ? (
        <div style={{ marginBottom: 24 }}>
          <FollowButton playerId={params.id} isFollowing={!!iFollow} />
        </div>
      ) : null}

      {reliability !== null && (
        <div
          style={{
            background: "var(--pitch-900)",
            border: "1px solid var(--pitch-700)",
            borderRadius: 14,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--chalk-300)", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Cricket Trust
            </div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{reliability.toFixed(0)}%</div>
          </div>
          <div style={{ height: 8, background: "var(--pitch-800)", borderRadius: 8, overflow: "hidden", margin: "10px 0" }}>
            <div
              style={{
                height: "100%",
                width: `${Math.max(0, Math.min(100, reliability))}%`,
                background: "var(--ball-500)",
                borderRadius: 8,
              }}
            />
          </div>
          <div style={{ fontSize: 12, color: "var(--chalk-300)" }}>
            {player?.matches_completed ?? 0} matches · {player?.no_show_count ?? 0} no-shows · {player?.late_cancel_count ?? 0} late cancels
          </div>
        </div>
      )}

      {(stats.batting.innings > 0 || stats.bowling.innings > 0) && (
        <div
          style={{
            background: "var(--pitch-900)",
            border: "1px solid var(--pitch-700)",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--chalk-300)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
            Career stats
          </div>

          {stats.batting.innings > 0 && (
            <div style={{ marginBottom: stats.bowling.innings > 0 ? 14 : 0 }}>
              <div style={{ fontSize: 11, color: "var(--gold)", fontWeight: 700, marginBottom: 6 }}>Batting</div>
              <div style={{ fontSize: 13, color: "var(--chalk-100)" }}>
                {stats.batting.runs} runs · {stats.batting.innings} inn · HS {stats.batting.highScore} ·{" "}
                Avg {stats.batting.average != null ? stats.batting.average.toFixed(1) : "—"} · SR{" "}
                {stats.batting.strikeRate != null ? stats.batting.strikeRate.toFixed(1) : "—"}
              </div>
            </div>
          )}

          {stats.bowling.innings > 0 && (
            <div>
              <div style={{ fontSize: 11, color: "var(--gold)", fontWeight: 700, marginBottom: 6 }}>Bowling</div>
              <div style={{ fontSize: 13, color: "var(--chalk-100)" }}>
                {stats.bowling.wickets} wkts · {stats.bowling.innings} inn · Best {stats.bowling.bestFigures || "—"} ·{" "}
                Econ {stats.bowling.economy != null ? stats.bowling.economy.toFixed(2) : "—"}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
