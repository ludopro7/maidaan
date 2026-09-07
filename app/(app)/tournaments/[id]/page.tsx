import { createClient } from "../../../../lib/supabase/server";
import { RegisterTeamButton } from "./register-team-button";

export default async function TournamentDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name, organizer_id, format, status, start_date, end_date, num_teams, cities(name)")
    .eq("id", params.id)
    .maybeSingle();

  if (!tournament) {
    return <p style={{ color: "var(--chalk-300)" }}>Tournament not found.</p>;
  }

  const isOrganizer = tournament.organizer_id === user?.id;

  const [{ data: rules }, { data: finance }, { data: registrations }, { data: myTeams }] =
    await Promise.all([
      supabase.from("tournament_rules").select("overs").eq("tournament_id", params.id).maybeSingle(),
      isOrganizer
        ? supabase
            .from("tournament_finance")
            .select("registration_fee, prize_money, ground_cost, umpire_cost")
            .eq("tournament_id", params.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("tournament_teams")
        .select("status, teams(id, name)")
        .eq("tournament_id", params.id),
      supabase.from("teams").select("id, name").eq("captain_id", user!.id),
    ]);

  const registeredTeamIds = new Set((registrations || []).map((r: any) => r.teams?.id));
  const eligibleTeams = (myTeams || []).filter((t) => !registeredTeamIds.has(t.id));

  let netFinance = null;
  if (finance) {
    const income = Number(finance.registration_fee) * (tournament.num_teams || 0) + Number(finance.prize_money) * 0;
    const expenses =
      Number(finance.prize_money) + Number(finance.ground_cost) + Number(finance.umpire_cost);
    netFinance = { income, expenses, net: income - expenses };
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <h1 style={{ fontSize: 22, marginBottom: 2 }}>{tournament.name}</h1>
        <span style={{ fontSize: 12, color: "var(--warn-500)" }}>
          {tournament.status.replace("_", " ")}
        </span>
      </div>
      <div style={{ fontSize: 13, color: "var(--chalk-300)", marginBottom: 20 }}>
        {(tournament as any).cities?.name || "City TBD"} · {tournament.format || "Format TBD"}
        {tournament.start_date ? ` · starts ${tournament.start_date}` : ""}
      </div>

      {rules && (
        <div style={{ marginBottom: 20, fontSize: 14 }}>
          <strong>Overs:</strong> {rules.overs ?? "Not set"}
        </div>
      )}

      {isOrganizer && netFinance && (
        <div
          style={{
            background: "var(--pitch-900)",
            border: "1px solid var(--pitch-700)",
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
            Finance (visible only to you)
          </div>
          <Row label="Expected income (fees × teams)" value={netFinance.income} />
          <Row label="Prize + ground + umpire costs" value={-netFinance.expenses} />
          <Row label="Net" value={netFinance.net} bold />
        </div>
      )}

      <h2 style={{ fontSize: 16, marginBottom: 8 }}>
        Registered teams ({(registrations || []).length})
      </h2>
      {(registrations || []).map((r: any, i: number) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "10px 0",
            borderBottom: "1px solid var(--pitch-800)",
            fontSize: 14,
          }}
        >
          <span>{r.teams?.name}</span>
          <span style={{ color: "var(--warn-500)", fontSize: 12, textTransform: "capitalize" }}>
            {r.status}
          </span>
        </div>
      ))}

      {!isOrganizer && eligibleTeams.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>Register your team</h2>
          {eligibleTeams.map((t) => (
            <RegisterTeamButton key={t.id} tournamentId={tournament.id} teamId={t.id} teamName={t.name} />
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 14,
        padding: "4px 0",
        fontWeight: bold ? 700 : 400,
        borderTop: bold ? "1px solid var(--pitch-700)" : "none",
        marginTop: bold ? 6 : 0,
        paddingTop: bold ? 10 : 4,
      }}
    >
      <span style={{ color: "var(--chalk-300)" }}>{label}</span>
      <span>₹{value.toLocaleString("en-IN")}</span>
    </div>
  );
}
