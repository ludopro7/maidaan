"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../../lib/supabase/server";

export type ActionResult = { success: true } | { success: false; message: string };

export async function reportNoShow(challengeId: string, claim: string): Promise<ActionResult> {
  const supabase = createClient();

  const { error } = await supabase.rpc("report_no_show", {
    p_challenge_id: challengeId,
    p_claim: claim,
  });

  if (error) return { success: false, message: error.message };

  revalidatePath(`/challenges/${challengeId}`);
  return { success: true };
}

export async function respondToNoShowReport(
  challengeId: string,
  reportId: string,
  response: "accept" | "dispute",
  explanation?: string
): Promise<ActionResult> {
  const supabase = createClient();

  const { error } = await supabase.rpc("respond_to_no_show_report", {
    p_report_id: reportId,
    p_response: response,
    p_explanation: explanation || null,
  });

  if (error) return { success: false, message: error.message };

  revalidatePath(`/challenges/${challengeId}`);
  return { success: true };
}
