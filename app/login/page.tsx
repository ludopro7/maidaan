"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign_in" | "sign_up">("sign_in");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } =
      mode === "sign_in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/home");
    router.refresh();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 360,
          background: "var(--pitch-900)",
          border: "1px solid var(--pitch-700)",
          borderRadius: 12,
          padding: 32,
        }}
      >
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <img src="/logo.png" alt="Maidan" style={{ width: 64, height: 64, marginBottom: 10 }} />
          <div style={{ fontSize: 13, letterSpacing: 0.4, color: "var(--chalk-300)" }}>
            Maidan
          </div>
          <h1 style={{ fontSize: 22, margin: "4px 0 0", fontWeight: 600 }}>
            Builder Command Center
          </h1>
        </div>

        <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--chalk-300)" }}>
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <label style={{ display: "block", fontSize: 13, margin: "16px 0 6px", color: "var(--chalk-300)" }}>
          Password
        </label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        {error && (
          <div style={{ color: "var(--danger-500)", fontSize: 13, marginTop: 12 }}>{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 24,
            padding: "12px 0",
            background: "var(--ball-500)",
            color: "var(--chalk-100)",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Working…" : mode === "sign_in" ? "Sign in" : "Create account"}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "sign_in" ? "sign_up" : "sign_in")}
          style={{
            width: "100%",
            marginTop: 12,
            padding: "10px 0",
            background: "transparent",
            color: "var(--chalk-300)",
            border: "none",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          {mode === "sign_in" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "var(--pitch-950)",
  border: "1px solid var(--pitch-700)",
  borderRadius: 8,
  color: "var(--chalk-100)",
};
