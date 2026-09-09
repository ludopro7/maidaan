"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "../../../../../lib/supabase/server";

export type ActionResult = { success: true } | { success: false; message: string };

export async function updateTournament(tournamentId: string, formData: FormData): Promise<ActionResult> {
  const supabase = createClient();

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "");
  const cityName = String(formData.get("city") || "").trim();
  const format = String(formData.get("format") || "") || null;
  const matchType = String(formData.get("match_type") || "") || null;
  const numTeams = parseInt(String(formData.get("num_teams") || ""), 10) || null;
  const registrationDeadline = String(formData.get("registration_deadline") || "") || null;
  const startDate = String(formData.get("start_date") || "") || null;
  const endDate = String(formData.get("end_date") || "") || null;
  const status = String(formData.get("status") || "");

  if (!name) return { success: false, message: "Tournament name is required." };

  let cityId: string | null = null;
  if (cityName) {
    const { data: existingCity } = await supabase.from("cities").select("id").eq("name", cityName).maybeSingle();
    if (existingCity) {
      cityId = existingCity.id;
    } else {
      const { data: newCity, error: cityError } = await supabase.from("cities").insert({ name: cityName }).select("id").single();
      if (cityError) return { success: false, message: cityError.message };
      cityId = newCity.id;
    }
  }

  const { error: tError } = await supabase
    .from("tournaments")
    .update({
      name,
      description,
      city_id: cityId,
      format,
      match_type: matchType,
      num_teams: numTeams,
      registration_deadline: registrationDeadline,
      start_date: startDate,
      end_date: endDate,
      status,
    })
    .eq("id", tournamentId);

  if (tError) return { success: false, message: tError.message };

  const overs = parseInt(String(formData.get("overs") || ""), 10) || null;
  const playingXi = parseInt(String(formData.get("playing_xi") || ""), 10) || null;
  const substituteRules = String(formData.get("substitute_rules") || "") || null;
  const powerplay = String(formData.get("powerplay") || "") || null;
  const ballType = String(formData.get("ball_type") || "") || null;
  const pitchType = String(formData.get("pitch_type") || "") || null;
  const eligibility = String(formData.get("eligibility") || "") || null;
  const tieRules = String(formData.get("tie_rules") || "") || null;
  const nrrRules = String(formData.get("nrr_rules") || "") || null;
  const pointsWin = parseInt(String(formData.get("points_win") || ""), 10) || 0;
  const pointsTie = parseInt(String(formData.get("points_tie") || ""), 10) || 0;
  const pointsLoss = parseInt(String(formData.get("points_loss") || ""), 10) || 0;

  const { error: rError } = await supabase.from("tournament_rules").upsert(
    {
      tournament_id: tournamentId,
      overs,
      playing_xi: playingXi,
      substitute_rules: substituteRules,
      powerplay,
      ball_type: ballType,
      pitch_type: pitchType,
      eligibility,
      tie_rules: tieRules,
      nrr_rules: nrrRules,
      points_system: { win: pointsWin, tie: pointsTie, loss: pointsLoss },
    },
    { onConflict: "tournament_id" }
  );

  if (rError) return { success: false, message: rError.message };

  const registrationFee = parseFloat(String(formData.get("registration_fee") || "0")) || 0;
  const prizeMoney = parseFloat(String(formData.get("prize_money") || "0")) || 0;
  const expectedSponsorship = parseFloat(String(formData.get("expected_sponsorship") || "0")) || 0;
  const groundCost = parseFloat(String(formData.get("ground_cost") || "0")) || 0;
  const umpireCost = parseFloat(String(formData.get("umpire_cost") || "0")) || 0;
  const scorerCost = parseFloat(String(formData.get("scorer_cost") || "0")) || 0;
  const equipmentCost = parseFloat(String(formData.get("equipment_cost") || "0")) || 0;
  const trophyCost = parseFloat(String(formData.get("trophy_cost") || "0")) || 0;
  const foodCost = parseFloat(String(formData.get("food_cost") || "0")) || 0;
  const staffCost = parseFloat(String(formData.get("staff_cost") || "0")) || 0;
  const otherExpenses = parseFloat(String(formData.get("other_expenses") || "0")) || 0;

  const { error: fError } = await supabase.from("tournament_finance").upsert(
    {
      tournament_id: tournamentId,
      registration_fee: registrationFee,
      prize_money: prizeMoney,
      expected_sponsorship: expectedSponsorship,
      ground_cost: groundCost,
      umpire_cost: umpireCost,
      scorer_cost: scorerCost,
      equipment_cost: equipmentCost,
      trophy_cost: trophyCost,
      food_cost: foodCost,
      staff_cost: staffCost,
      other_expenses: otherExpenses,
    },
    { onConflict: "tournament_id" }
  );

  if (fError) return { success: false, message: fError.message };

  revalidatePath(`/tournaments/${tournamentId}`);
  redirect(`/tournaments/${tournamentId}`);
}
