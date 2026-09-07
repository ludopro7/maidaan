"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../../lib/supabase/server";

export type ActionResult = { success: true } | { success: false; message: string };

export async function requestReplacement(
  challengeId: string,
  vacatedRole: "challenger" | "opponent"
): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Not signed in." };

  const { error } = await supabase.from("challenge_replacement_requests").insert({
    challenge_id: challengeId,
    vacated_role: vacatedRole,
    requested_by: user.id,
  });

  if (error) return { success: false, message: error.message };

  revalidatePath(`/challenges/${challengeId}`);
  return { success: true };
}

export async function offerReplacement(
  challengeId: string,
  requestId: string,
  candidateId: string
): Promise<ActionResult> {
  const supabase = createClient();

  const { error } = await supabase.rpc("offer_replacement", {
    p_request_id: requestId,
    p_candidate_id: candidateId,
  });

  if (error) return { success: false, message: error.message };

  revalidatePath(`/challenges/${challengeId}`);
  return { success: true };
}

export async function respondToReplacementOffer(
  challengeId: string,
  offerId: string,
  response: "accept" | "decline"
): Promise<ActionResult> {
  const supabase = createClient();

  const { error } = await supabase.rpc("respond_to_replacement_offer", {
    p_offer_id: offerId,
    p_response: response,
  });

  if (error) return { success: false, message: error.message };

  revalidatePath(`/challenges/${challengeId}`);
  return { success: true };
}
