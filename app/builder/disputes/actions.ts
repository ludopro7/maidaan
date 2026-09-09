"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../lib/supabase/server";

export type ActionResult = { success: true } | { success: false; message: string };

export async function resolveDispute(
  reportId: string,
  uphold: boolean,
  adminNotes: string
): Promise<ActionResult> {
  const supabase = createClient();

  const { error } = await supabase.rpc("resolve_no_show_dispute", {
    p_report_id: reportId,
    p_uphold: uphold,
    p_admin_notes: adminNotes || null,
  });

  if (error) return { success: false, message: error.message };

  revalidatePath("/builder/disputes");
  return { success: true };
}
