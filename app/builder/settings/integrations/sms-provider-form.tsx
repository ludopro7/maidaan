"use client";

import { useRef, useState, useTransition } from "react";
import { saveSmsProvider } from "./actions";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "var(--pitch-950)",
  border: "1px solid var(--pitch-700)",
  borderRadius: 8,
  color: "var(--chalk-100)",
  marginBottom: 14,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  marginBottom: 6,
  color: "var(--chalk-300)",
};

export function SmsProviderForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSubmit(formData: FormData) {
    setFeedback(null);
    startTransition(async () => {
      const result = await saveSmsProvider(formData);
      if (result.success) {
        setFeedback({ ok: true, message: "Saved. Provider credentials are encrypted in Vault." });
        formRef.current?.reset();
      } else {
        setFeedback({ ok: false, message: result.message });
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit}>
      <label style={labelStyle}>Provider</label>
      <select name="provider_name" required style={inputStyle} defaultValue="">
        <option value="" disabled>
          Select a provider
        </option>
        <option value="twilio">Twilio</option>
        <option value="msg91">MSG91</option>
        <option value="custom">Custom gateway</option>
      </select>

      <label style={labelStyle}>Account SID / API key ID (not secret)</label>
      <input name="account_sid" style={inputStyle} placeholder="e.g. ACxxxxxxxxxxxxxxxx" />

      <label style={labelStyle}>Auth token / API secret</label>
      <input
        name="auth_token"
        type="password"
        required
        style={inputStyle}
        placeholder="Encrypted in Vault on save"
        autoComplete="off"
      />

      <label style={labelStyle}>Sender ID</label>
      <input name="sender_id" style={inputStyle} placeholder="e.g. MAIDAN" />

      {feedback && (
        <div
          style={{
            fontSize: 13,
            marginBottom: 14,
            color: feedback.ok ? "var(--ok-500)" : "var(--danger-500)",
          }}
        >
          {feedback.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        style={{
          padding: "10px 18px",
          background: "var(--ball-500)",
          color: "var(--chalk-100)",
          border: "none",
          borderRadius: 8,
          fontWeight: 600,
          cursor: isPending ? "default" : "pointer",
          opacity: isPending ? 0.6 : 1,
        }}
      >
        {isPending ? "Saving…" : "Save provider"}
      </button>
    </form>
  );
}
