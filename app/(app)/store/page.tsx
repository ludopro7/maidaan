import Link from "next/link";
import { createClient } from "../../../lib/supabase/server";

export default async function StorePage() {
  const supabase = createClient();

  const { data: products } = await supabase
    .from("listings")
    .select("id, title, price, image_emoji, sellers(business_name)")
    .eq("status", "active")
    .eq("listing_type", "product")
    .order("created_at", { ascending: false });

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22 }}>Maidan Store</h1>
        <Link
          href="/marketplace/new"
          style={{ fontSize: 13, padding: "8px 14px", background: "var(--gold)", color: "#10150f", borderRadius: 8, fontWeight: 700, textDecoration: "none" }}
        >
          + Sell
        </Link>
      </div>
      <p style={{ color: "var(--chalk-300)", fontSize: 13, marginBottom: 20 }}>Gear, kits, and cricket equipment from local sellers.</p>

      {(products || []).length === 0 && (
        <p style={{ color: "var(--chalk-300)", fontSize: 14 }}>No products listed yet.</p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        {(products || []).map((p: any) => (
          <Link
            key={p.id}
            href={`/marketplace/${p.id}`}
            style={{ display: "block", background: "var(--pitch-900)", border: "1px solid var(--pitch-700)", borderRadius: 16, overflow: "hidden", textDecoration: "none" }}
          >
            <div style={{ height: 90, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, background: "rgba(255,255,255,0.035)" }}>
              {p.image_emoji || "🏏"}
            </div>
            <div style={{ padding: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{p.title}</div>
              <div style={{ fontSize: 10, color: "var(--chalk-300)", marginTop: 2 }}>{p.sellers?.business_name}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--gold)", marginTop: 6 }}>
                ₹{Number(p.price).toLocaleString("en-IN")}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
