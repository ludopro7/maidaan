import Link from "next/link";
import { createClient } from "../../../lib/supabase/server";

export default async function MarketplacePage() {
  const supabase = createClient();

  const { data: listings } = await supabase
    .from("listings")
    .select("id, listing_type, title, price, image_emoji, sellers(business_name, category)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22 }}>Marketplace</h1>
        <Link
          href="/marketplace/new"
          style={{ fontSize: 13, padding: "8px 14px", background: "var(--gold)", color: "#10150f", borderRadius: 8, fontWeight: 700, textDecoration: "none" }}
        >
          + List something
        </Link>
      </div>
      <p style={{ color: "var(--chalk-300)", fontSize: 13, marginBottom: 20 }}>Products and services from cricket businesses near you.</p>

      {(listings || []).length === 0 && (
        <p style={{ color: "var(--chalk-300)", fontSize: 14 }}>Nothing listed yet. Be the first.</p>
      )}

      {(listings || []).map((l: any) => (
        <Link
          key={l.id}
          href={`/marketplace/${l.id}`}
          style={{ display: "flex", gap: 11, alignItems: "center", background: "var(--pitch-900)", border: "1px solid var(--pitch-700)", borderRadius: 15, padding: 13, marginBottom: 8, textDecoration: "none" }}
        >
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,255,255,0.05)", display: "grid", placeItems: "center", fontSize: 21, flex: "0 0 auto" }}>
            {l.image_emoji || "🏏"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--chalk-100)" }}>{l.title}</div>
            <div style={{ fontSize: 10, color: "var(--chalk-300)", marginTop: 3 }}>
              {l.sellers?.business_name} · {l.listing_type === "service" ? "Service" : "Product"}
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--gold)" }}>
            ₹{Number(l.price).toLocaleString("en-IN")}
          </div>
        </Link>
      ))}
    </div>
  );
}
