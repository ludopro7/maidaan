import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { BottomNav } from "./bottom-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: isSuperAdmin } = await supabase.rpc("is_super_admin");

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 76 }}>
      <header
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--pitch-800)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/logo.png" alt="Maidan" style={{ width: 32, height: 32 }} />
          <div style={{ fontWeight: 700, fontSize: 18 }}>Maidan</div>
        </div>
        {isSuperAdmin && (
          <a href="/builder" style={{ fontSize: 13, color: "var(--chalk-300)" }}>
            Builder →
          </a>
        )}
      </header>
      <main style={{ padding: 20 }}>{children}</main>
      <BottomNav />
    </div>
  );
}
