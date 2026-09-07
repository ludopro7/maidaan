import { createClient } from "../../../lib/supabase/server";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: player }] = await Promise.all([
    supabase.from("profiles").select("full_name, bio").eq("id", user!.id).maybeSingle(),
    supabase
      .from("players")
      .select(
        "batting_hand, bowling_style, playing_role, preferred_format, experience_years, reliability_score, matches_completed, no_show_count, late_cancel_count"
      )
      .eq("user_id", user!.id)
      .maybeSingle(),
  ]);

  const reliability = player?.reliability_score != null ? Number(player.reliability_score) : null;

  return (
    <div style={{ maxWidth: 480 }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Your profile</h1>
      <p style={{ color: "var(--chalk-300)", fontSize: 14, marginBottom: 24 }}>{user!.email}</p>

      {reliability !== null && (
        <div
          style={{
            background: "var(--pitch-900)",
            border: "1px solid var(--pitch-700)",
            borderRadius: 14,
            padding: 16,
            marginBottom: 24,
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

      <ProfileForm
        defaultValues={{
          full_name: profile?.full_name || "",
          bio: profile?.bio || "",
          batting_hand: player?.batting_hand || "",
          bowling_style: player?.bowling_style || "",
          playing_role: player?.playing_role || "",
          preferred_format: player?.preferred_format || "",
          experience_years: player?.experience_years?.toString() || "",
        }}
      />
    </div>
  );
}
