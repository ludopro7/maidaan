import Link from "next/link";
import { createClient } from "../../../../../lib/supabase/server";
import { EditTournamentForm } from "./edit-form";

export default async function EditTournamentPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select(
      "id, name, description, organizer_id, format, match_type, num_teams, registration_deadline, start_date, end_date, status, cities(name)"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!tournament) {
    return <p style={{ color: "var(--chalk-300)" }}>Tournament not found.</p>;
  }

  const { data: isSuperAdmin } = await supabase.rpc("is_super_admin");

  if (tournament.organizer_id !== user?.id && !isSuperAdmin) {
    return <p style={{ color: "var(--chalk-300)" }}>Only the organizer can edit this tournament.</p>;
  }

  const [{ data: rules }, { data: finance }] = await Promise.all([
    supabase
      .from("tournament_rules")
      .select("overs, playing_xi, substitute_rules, powerplay, ball_type, pitch_type, eligibility, tie_rules, nrr_rules, points_system")
      .eq("tournament_id", params.id)
      .maybeSingle(),
    supabase
      .from("tournament_finance")
      .select(
        "registration_fee, prize_money, expected_sponsorship, ground_cost, umpire_cost, scorer_cost, equipment_cost, trophy_cost, food_cost, staff_cost, other_expenses"
      )
      .eq("tournament_id", params.id)
      .maybeSingle(),
  ]);

  const points = (rules?.points_system as any) || {};

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <Link href={`/tournaments/${params.id}`} style={{ color: "var(--chalk-400)", fontSize: 12, fontWeight: 700 }}>
          ← {tournament.name}
        </Link>
      </div>

      <h1 style={{ fontSize: 22, marginBottom: 24 }}>Edit tournament</h1>

      <EditTournamentForm
        tournamentId={params.id}
        defaults={{
          name: tournament.name || "",
          description: tournament.description || "",
          city: (tournament as any).cities?.name || "",
          format: tournament.format || "",
          match_type: tournament.match_type || "",
          num_teams: tournament.num_teams?.toString() || "",
          registration_deadline: tournament.registration_deadline || "",
          start_date: tournament.start_date || "",
          end_date: tournament.end_date || "",
          status: tournament.status || "draft",
          overs: rules?.overs?.toString() || "",
          playing_xi: rules?.playing_xi?.toString() || "",
          substitute_rules: rules?.substitute_rules || "",
          powerplay: rules?.powerplay || "",
          ball_type: rules?.ball_type || "",
          pitch_type: rules?.pitch_type || "",
          eligibility: rules?.eligibility || "",
          tie_rules: rules?.tie_rules || "",
          nrr_rules: rules?.nrr_rules || "",
          points_win: points.win?.toString() || "",
          points_tie: points.tie?.toString() || "",
          points_loss: points.loss?.toString() || "",
          registration_fee: finance?.registration_fee?.toString() || "",
          prize_money: finance?.prize_money?.toString() || "",
          expected_sponsorship: finance?.expected_sponsorship?.toString() || "",
          ground_cost: finance?.ground_cost?.toString() || "",
          umpire_cost: finance?.umpire_cost?.toString() || "",
          scorer_cost: finance?.scorer_cost?.toString() || "",
          equipment_cost: finance?.equipment_cost?.toString() || "",
          trophy_cost: finance?.trophy_cost?.toString() || "",
          food_cost: finance?.food_cost?.toString() || "",
          staff_cost: finance?.staff_cost?.toString() || "",
          other_expenses: finance?.other_expenses?.toString() || "",
        }}
      />
    </div>
  );
}
