"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";

export type SaveResult = { success: true; id: string } | { success: false; message: string };

export async function createTournament(formData: FormData): Promise<SaveResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Not signed in." };
  }

  const name = String(formData.get("name") || "").trim();
  const cityName = String(formData.get("city") || "").trim();
  const format = String(formData.get("format") || "") || null;
  const overs = parseInt(String(formData.get("overs") || ""), 10) || null;
  const ballType = String(formData.get("ball_type") || "") || null;
  const serviceTier = String(formData.get("service_tier") || "self_managed") as
    | "full_service"
    | "assisted"
    | "self_managed";

  if (!name) {
    return { success: false, message: "Tournament name is required." };
  }

  let cityId: string | null = null;
  if (cityName) {
    const { data: existingCity } = await supabase
      .from("cities")
      .select("id")
      .eq("name", cityName)
      .maybeSingle();
    if (existingCity) {
      cityId = existingCity.id;
    } else {
      const { data: newCity, error: cityError } = await supabase
        .from("cities")
        .insert({ name: cityName })
        .select("id")
        .single();
      if (cityError) return { success: false, message: cityError.message };
      cityId = newCity.id;
    }
  }

  if (serviceTier === "full_service") {
    const requestedBudget = parseFloat(String(formData.get("requested_budget") || "0")) || 0;

    if (!requestedBudget) {
      return { success: false, message: "Enter a budget for us to work with." };
    }

    const { data: tournament, error: tError } = await supabase
      .from("tournaments")
      .insert({
        organizer_id: user.id,
        name,
        city_id: cityId,
        format,
        service_tier: serviceTier,
        requested_budget: requestedBudget,
        status: "draft",
      })
      .select("id")
      .single();

    if (tError) return { success: false, message: tError.message };

    const { error: rulesError } = await supabase.from("tournament_rules").insert({
      tournament_id: tournament.id,
      overs,
      ball_type: ballType,
    });
    if (rulesError) return { success: false, message: rulesError.message };

    redirect(`/tournaments/${tournament.id}`);
  }

  const numTeams = parseInt(String(formData.get("num_teams") || ""), 10) || null;
  const startDate = String(formData.get("start_date") || "") || null;
  const endDate = String(formData.get("end_date") || "") || null;
  const registrationDeadline = String(formData.get("registration_deadline") || "") || null;
  const registrationFee = parseFloat(String(formData.get("registration_fee") || "0")) || 0;
  const prizeMoney = parseFloat(String(formData.get("prize_money") || "0")) || 0;
  const groundCost = serviceTier === "self_managed" ? parseFloat(String(formData.get("ground_cost") || "0")) || 0 : 0;
  const umpireCost = serviceTier === "self_managed" ? parseFloat(String(formData.get("umpire_cost") || "0")) || 0 : 0;

  const { data: tournament, error: tError } = await supabase
    .from("tournaments")
    .insert({
      organizer_id: user.id,
      name,
      city_id: cityId,
      format,
      service_tier: serviceTier,
      num_teams: numTeams,
      start_date: startDate,
      end_date: endDate,
      registration_deadline: registrationDeadline,
      status: "published",
    })
    .select("id")
    .single();

  if (tError) return { success: false, message: tError.message };

  const { error: rulesError } = await supabase.from("tournament_rules").insert({
    tournament_id: tournament.id,
    overs,
    ball_type: ballType,
  });
  if (rulesError) return { success: false, message: rulesError.message };

  const { error: financeError } = await supabase.from("tournament_finance").insert({
    tournament_id: tournament.id,
    registration_fee: registrationFee,
    prize_money: prizeMoney,
    ground_cost: groundCost,
    umpire_cost: umpireCost,
  });
  if (financeError) return { success: false, message: financeError.message };

  redirect(`/tournaments/${tournament.id}`);
}

export async function registerTeam(tournamentId: string, teamId: string): Promise<SaveResult> {
  const supabase = createClient();

  const { error } = await supabase
    .from("tournament_teams")
    .insert({ tournament_id: tournamentId, team_id: teamId, status: "pending" });

  if (error) return { success: false, message: error.message };
  return { success: true, id: tournamentId };
}
