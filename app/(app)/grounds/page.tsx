import { createClient } from "../../../lib/supabase/server";

export default async function GroundsPage() {
  const supabase = createClient();

  const { data: grounds } = await supabase
    .from("grounds")
    .select("id, name, price_per_slot, slot_label, facilities, photo_url, cities(name)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22 }}>Grounds</h1>
        <a
          href="/grounds/new"
          style={{
            fontSize: 13,
            padding: "8px 14px",
            background: "var(--ball-500)",
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          + List a ground
        </a>
      </div>

      {(grounds || []).length === 0 && (
        <p style={{ color: "var(--chalk-300)", fontSize: 14 }}>
          No grounds listed yet. Be the first to list one.
        </p>
      )}

      {(grounds || []).map((g: any) => (
        <a
          key={g.id}
          href={`/grounds/${g.id}`}
          style={{
            display: "block",
            background: "var(--pitch-900)",
            border: "1px solid var(--pitch-700)",
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 10,
          }}
        >
          {g.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={g.photo_url} alt="" style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
          ) : (
            <div
              style={{
                width: "100%",
                height: 90,
                background: "var(--pitch-950)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
              }}
            >
              🏟️
            </div>
          )}
          <div style={{ padding: 16 }}>
            <div style={{ fontWeight: 600 }}>{g.name}</div>
            <div style={{ fontSize: 12, color: "var(--chalk-300)", marginTop: 4 }}>
              {g.cities?.name || "City TBD"} · ₹{Number(g.price_per_slot).toLocaleString("en-IN")} / {g.slot_label}
            </div>
            {g.facilities?.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                {g.facilities.map((f: string) => (
                  <span
                    key={f}
                    style={{
                      fontSize: 11,
                      background: "var(--pitch-800)",
                      borderRadius: 999,
                      padding: "3px 8px",
                      color: "var(--chalk-300)",
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}
