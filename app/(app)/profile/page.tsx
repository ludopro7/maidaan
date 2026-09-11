import { createClient } from "../../../lib/supabase/server";
import { getCareerStats } from "../../../lib/cricket-stats";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: player }, stats] = await Promise.all([
    supabase.from("profiles").select("full_name, bio, avatar_url").eq("id", user!.id).maybeSingle(),
    supabase
      .from("players")
      .select(
        "batting_hand, bowling_style, playing_role, preferred_format, experience_years, reliability_score, matches_completed, no_show_count, late_cancel_count"
      )
      .eq("user_id", user!.id)
      .maybeSingle(),
    getCareerStats(supabase, user!.id),
  ]);

  const reliability = player?.reliability_score != null ? Number(player.reliability_score) : null;

  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--pitch-700)" }}
          />
        ) : (
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--pitch-900)",
              border: "1px solid var(--pitch-700)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            🏏
          </div>
        )}
        <h1 style={{ fontSize: 22, margin: 0 }}>Your profile</h1>
      </div>
      <p style={{ color: "var(--chalk-300)", fontSize: 14, marginBottom: 24 }}>{user!.email}</p>

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
            {player?.matches_completed ?? 0} matches completed · {player?.no_show_count ?? 0} no-shows ·{" "}
            {player?.late_cancel_count ?? 0} late cancels
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
            marginBottom: 24,
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

          <a href="/cricket" style={{ display: "block", marginTop: 12, fontSize: 12, color: "var(--gold)", fontWeight: 700 }}>
            View full cricket hub →
          </a>
        </div>
      )}

      <ProfileForm
        defaultValues={{
          full_name: profile?.full_name || "",
          bio: profile?.bio || "",
          batting_hand: player?.batting_hand || "",
          bowling_style: player?.bowling_style || "",
          playing_role: player?.playing_role || "",
          preferred_format: player?.preferred_format || "",
          experience_years: player?.experience_years?.toString() || "",
          avatar_url: profile?.avatar_url || "",
        }}
      />
    </div>
  );
}
