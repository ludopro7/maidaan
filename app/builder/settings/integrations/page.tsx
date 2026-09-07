import { createClient } from "../../../../lib/supabase/server";
import { SmsProviderForm } from "./sms-provider-form";

export default async function IntegrationsPage() {
  const supabase = createClient();

  const { data: integrations } = await supabase
    .from("platform_integrations")
    .select("id, provider_type, provider_name, config, status, updated_at")
    .order("updated_at", { ascending: false });

  const smsIntegrations = (integrations || []).filter((i) => i.provider_type === "sms_otp");

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Integrations</h1>
      <p style={{ color: "var(--chalk-300)", fontSize: 14, marginBottom: 28 }}>
        Connect the services Maidan depends on. Credentials are encrypted at
        rest via Supabase Vault — never stored as plaintext.
      </p>

      <section
        style={{
          background: "var(--pitch-900)",
          border: "1px solid var(--pitch-700)",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 16, marginBottom: 4 }}>Phone verification (SMS OTP)</h2>
        <p style={{ color: "var(--chalk-300)", fontSize: 13, marginBottom: 20 }}>
          Used to send OTP codes for phone sign-in and verification. Needs an
          SMS provider account (Twilio, MSG91, or a custom gateway).
        </p>

        {smsIntegrations.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            {smsIntegrations.map((i) => (
              <div
                key={i.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  background: "var(--pitch-950)",
                  borderRadius: 8,
                  marginBottom: 8,
                  fontSize: 14,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, textTransform: "capitalize" }}>{i.provider_name}</div>
                  <div style={{ fontSize: 12, color: "var(--chalk-300)" }}>
                    Sender ID: {(i.config as any)?.sender_id || "—"}
                  </div>
                </div>
                <StatusBadge status={i.status} />
              </div>
            ))}
          </div>
        )}

        <SmsProviderForm />
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    not_configured: "var(--chalk-300)",
    configured: "var(--warn-500)",
    active: "var(--ok-500)",
    error: "var(--danger-500)",
  };
  return (
    <span
      style={{
        fontSize: 12,
        padding: "3px 10px",
        borderRadius: 999,
        border: `1px solid ${colors[status] || "var(--chalk-300)"}`,
        color: colors[status] || "var(--chalk-300)",
      }}
    >
      {status.replace("_", " ")}
    </span>
  );
}
