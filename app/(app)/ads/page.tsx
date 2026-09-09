import { createClient } from "../../../lib/supabase/server";

export default async function AdsPage() {
  const supabase = createClient();

  const { data: ads } = await supabase
    .from("ads")
    .select("id, title, description, sellers(business_name), cities(name)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Local offers</h1>
      <p style={{ color: "var(--chalk-300)", fontSize: 13, marginBottom: 20 }}>Cricket businesses around you.</p>

      {(ads || []).length === 0 && <p style={{ color: "var(--chalk-300)", fontSize: 14 }}>No local offers yet.</p>}

      {(ads || []).map((a: any) => (
        <div
          key={a.id}
          style={{
            display: "flex",
            gap: 14,
            alignItems: "center",
            background: "linear-gradient(135deg, rgba(214,168,64,0.09), rgba(255,255,255,0.025))",
            border: "1px solid rgba(214,168,64,0.25)",
            borderRadius: 18,
            padding: 15,
            marginBottom: 10,
          }}
        >
          <div style={{ width: 54, height: 54, borderRadius: 15, background: "var(--gold)", color: "#173e2b", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 19, flex: "none" }}>
            {a.sellers?.business_name?.[0]?.toUpperCase() || "M"}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{a.title}</div>
            <div style={{ fontSize: 11, color: "var(--chalk-300)", marginTop: 3 }}>
              {a.sellers?.business_name} · {a.cities?.name || "Local"}
            </div>
            {a.description && <div style={{ fontSize: 12, color: "var(--chalk-300)", marginTop: 4 }}>{a.description}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
