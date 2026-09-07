import { createClient } from "../../../lib/supabase/server";

const roleLabel: Record<string, string> = {
  umpire: "Umpire",
  scorer: "Scorer",
  umpire_scorer: "Umpire + Scorer",
};

export default async function OfficialsPage() {
  const supabase = createClient();

  const { data: officials } = await supabase
    .from("officials")
    .select("id, role, experience_years, price_per_match, cities(name), profiles(full_name)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22 }}>Officials</h1>
        <a
          href="/officials/new"
          style={{
            fontSize: 13,
            padding: "8px 14px",
            background: "var(--ball-500)",
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          + Offer services
        </a>
      </div>

      {(officials || []).length === 0 && (
        <p style={{ color: "var(--chalk-300)", fontSize: 14 }}>
          No officials listed yet. Be the first to offer your services.
        </p>
      )}

      {(officials || []).map((o: any) => (
        <a
          key={o.id}
          href={`/officials/${o.id}`}
          style={{
            display: "block",
            background: "var(--pitch-900)",
            border: "1px solid var(--pitch-700)",
            borderRadius: 12,
            padding: 16,
            marginBottom: 10,
          }}
        >
          <div style={{ fontWeight: 600 }}>{o.profiles?.full_name || "Official"}</div>
          <div style={{ fontSize: 12, color: "var(--chalk-300)", marginTop: 4 }}>
            {roleLabel[o.role]} · {o.experience_years ?? "?"} yrs · {o.cities?.name || "City TBD"}
          </div>
          <div style={{ fontSize: 13, marginTop: 6 }}>
            ₹{Number(o.price_per_match).toLocaleString("en-IN")} / match
          </div>
        </a>
      ))}
    </div>
  );
}
