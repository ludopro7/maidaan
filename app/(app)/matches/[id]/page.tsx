import { createClient } from "../../../../lib/supabase/server";
import { CheckInButton } from "./checkin-button";

const roleLabel: Record<string, string> = {
  umpire: "Umpire",
  scorer: "Scorer",
  umpire_scorer: "Umpire + Scorer",
};

export default async function MatchDayPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: match } = await supabase
    .from("matches")
    .select(
      "id, round, match_number, scheduled_at, status, tournaments(name), team_a_id, team_b_id, team_a:team_a_id(name), team_b:team_b_id(name), grounds(name, address)"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!match) {
    return <p style={{ color: "var(--chalk-300)" }}>Match not found.</p>;
  }

  const [{ data: officials }, { data: squadA }, { data: squadB }, { data: checkins }] =
    await Promise.all([
      supabase
        .from("match_officials")
        .select("role, status, officials(profiles(full_name))")
        .eq("match_id", params.id),
      match.team_a_id
        ? supabase
            .from("team_members")
            .select("user_id, member_role, profiles(full_name)")
            .eq("team_id", match.team_a_id)
        : Promise.resolve({ data: [] as any[] }),
      match.team_b_id
        ? supabase
            .from("team_members")
            .select("user_id, member_role, profiles(full_name)")
            .eq("team_id", match.team_b_id)
        : Promise.resolve({ data: [] as any[] }),
      supabase.from("match_checkins").select("user_id").eq("match_id", params.id),
    ]);

  const checkedInIds = new Set((checkins || []).map((c: any) => c.user_id));
  const squad = [...(squadA || []), ...(squadB || [])];
  const isInSquad = squad.some((s: any) => s.user_id === user?.id);
  const alreadyCheckedIn = checkedInIds.has(user?.id);
  const canCheckIn =
    isInSquad && !alreadyCheckedIn && !["completed", "cancelled", "postponed"].includes(match.status);

  const umpireAssigned = (officials || []).some((o: any) => o.role !== "scorer" && o.status !== "declined");
  const scorerAssigned = (officials || []).some((o: any) => o.role !== "umpire" && o.status !== "declined");

  return (
    <div style={{ maxWidth: 520 }}>
      <div
        style={{
          background: "linear-gradient(135deg, var(--pitch-900), var(--pitch-800))",
          border: "1px solid var(--pitch-700)",
          borderRadius: 16,
          padding: 18,
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 11, color: "var(--chalk-300)", textTransform: "uppercase", letterSpacing: 0.6 }}>
          {(match as any).tournaments?.name} · {match.round}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginTop: 12, textAlign: "center" }}>
          <div style={{ fontWeight: 700 }}>{(match as any).team_a?.name || "TBD"}</div>
          <div style={{ color: "var(--chalk-300)", fontSize: 12, padding: "0 8px" }}>vs</div>
          <div style={{ fontWeight: 700 }}>{(match as any).team_b?.name || "TBD"}</div>
        </div>
        <div style={{ textAlign: "center", fontSize: 12, color: "var(--chalk-300)", marginTop: 10 }}>
          {(match as any).grounds?.name || "Ground TBD"}
          {match.scheduled_at ? ` · ${new Date(match.scheduled_at).toLocaleString()}` : ""}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        <ReadinessStat label="Ground" ok={!!(match as any).grounds} />
        <ReadinessStat label="Umpire" ok={umpireAssigned} />
        <ReadinessStat label="Scorer" ok={scorerAssigned} />
        <div
          style={{
            background: "var(--pitch-900)",
            border: "1px solid var(--pitch-700)",
            borderRadius: 12,
            padding: 12,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {checkedInIds.size}/{squad.length}
          </div>
          <div style={{ fontSize: 11, color: "var(--chalk-300)" }}>Checked in</div>
        </div>
      </div>

      {canCheckIn && (
        <div style={{ marginBottom: 24 }}>
          <CheckInButton matchId={match.id} />
        </div>
      )}
      {alreadyCheckedIn && (
        <div style={{ marginBottom: 24, color: "var(--ok-500)", fontSize: 13, fontWeight: 600 }}>
          ✓ You're checked in
        </div>
      )}

      <h2 style={{ fontSize: 16, marginBottom: 8 }}>{(match as any).team_a?.name} squad</h2>
      <SquadList members={squadA || []} checkedInIds={checkedInIds} />

      <h2 style={{ fontSize: 16, marginBottom: 8, marginTop: 20 }}>{(match as any).team_b?.name} squad</h2>
      <SquadList members={squadB || []} checkedInIds={checkedInIds} />

      {(officials || []).length > 0 && (
        <>
          <h2 style={{ fontSize: 16, marginBottom: 8, marginTop: 20 }}>Officials</h2>
          {(officials || []).map((o: any, i: number) => (
            <div key={i} style={{ fontSize: 14, padding: "8px 0", borderBottom: "1px solid var(--pitch-800)" }}>
              {roleLabel[o.role]}: {o.officials?.profiles?.full_name || "Unnamed"}
              <span style={{ color: "var(--chalk-300)", fontSize: 12 }}> · {o.status}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function ReadinessStat({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div
      style={{
        background: "var(--pitch-900)",
        border: "1px solid var(--pitch-700)",
        borderRadius: 12,
        padding: 12,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 18, color: ok ? "var(--ok-500)" : "var(--chalk-300)" }}>{ok ? "✓" : "—"}</div>
      <div style={{ fontSize: 11, color: "var(--chalk-300)" }}>{label}</div>
    </div>
  );
}

function SquadList({ members, checkedInIds }: { members: any[]; checkedInIds: Set<string> }) {
  if (members.length === 0) {
    return <p style={{ fontSize: 13, color: "var(--chalk-300)" }}>No roster yet.</p>;
  }
  return (
    <>
      {members.map((m: any) => (
        <div
          key={m.user_id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "8px 0",
            borderBottom: "1px solid var(--pitch-800)",
            fontSize: 14,
          }}
        >
          <span>
            {m.profiles?.full_name || "Player"}
            {m.member_role === "captain" ? " (C)" : ""}
          </span>
          {checkedInIds.has(m.user_id) && <span style={{ color: "var(--ok-500)", fontSize: 12 }}>✓ In</span>}
        </div>
      ))}
    </>
  );
}
