"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../../lib/supabase/server";

export type SaveSmsProviderResult = { success: true } | { success: false; message: string };

export async function saveSmsProvider(formData: FormData): Promise<SaveSmsProviderResult> {
  const supabase = createClient();

  const providerName = String(formData.get("provider_name") || "");
  const accountSid = String(formData.get("account_sid") || "");
  const authToken = String(formData.get("auth_token") || "");
  const senderId = String(formData.get("sender_id") || "");

  if (!providerName || !authToken) {
    return { success: false, message: "Provider and auth token/API key are required." };
  }

  // Non-secret fields (account SID, sender ID) go in `config`.
  // The secret credential (auth token / API key) is passed separately and
  // stored via Supabase Vault by the set_integration_secret function —
  // it never touches a plaintext column.
  const { error } = await supabase.rpc("set_integration_secret", {
    p_provider_type: "sms_otp",
    p_provider_name: providerName,
    p_config: { account_sid: accountSid, sender_id: senderId },
    p_secret_value: authToken,
    p_secret_label: `sms_otp_${providerName}_auth_token`,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/builder/settings/integrations");
  return { success: true };
}
