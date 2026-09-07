import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

export default async function BuilderLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Server-side authorization check — never trust a client-side flag.
  // is_super_admin() reads super_admins keyed off auth.uid(), enforced by RLS.
  const { data: isSuperAdmin, error } = await supabase.rpc("is_super_admin");

  if (error || !isSuperAdmin) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>Not authorized</h1>
          <p style={{ color: "var(--chalk-300)", fontSize: 14 }}>
            Your account ({user.email}) doesn&apos;t have Builder Command Center access.
            This area is restricted to super admins.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <header
        style={{
          borderBottom: "1px solid var(--pitch-700)",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: "var(--chalk-300)", letterSpacing: 0.4 }}>Maidan</div>
          <div style={{ fontWeight: 600 }}>Builder Command Center</div>
        </div>
        <div style={{ fontSize: 13, color: "var(--chalk-300)" }}>{user.email}</div>
      </header>
      <nav
        style={{
          display: "flex",
          gap: 4,
          padding: "10px 20px",
          borderBottom: "1px solid var(--pitch-800)",
          overflowX: "auto",
        }}
      >
        {[
          { href: "/builder", label: "Overview" },
          { href: "/builder/settings/integrations", label: "Integrations" },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 14,
              whiteSpace: "nowrap",
              background: "var(--pitch-900)",
            }}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <main style={{ padding: 20 }}>{children}</main>
    </div>
  );
}
