import { createClient } from "../../../../lib/supabase/server";
import { OrderForm, OrderStatusButtons } from "./order-widgets";

const statusColor: Record<string, string> = {
  pending: "var(--warn-500)",
  confirmed: "var(--ok-500)",
  fulfilled: "var(--gold)",
  cancelled: "var(--danger-500)",
};

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: listing } = await supabase
    .from("listings")
    .select("id, listing_type, title, description, price, image_emoji, seller_id, sellers(user_id, business_name, category)")
    .eq("id", params.id)
    .maybeSingle();

  if (!listing) {
    return <p style={{ color: "var(--chalk-300)" }}>Listing not found.</p>;
  }

  const isSeller = (listing as any).sellers?.user_id === user?.id;

  const { data: orders } = await supabase
    .from("orders")
    .select("id, quantity, total_price, status, buyer_id")
    .eq("listing_id", params.id)
    .order("created_at", { ascending: false });

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60, background: "var(--pitch-900)", border: "1px solid var(--pitch-700)", borderRadius: 18, marginBottom: 16 }}>
        {listing.image_emoji || "🏏"}
      </div>

      <h1 style={{ fontSize: 22, marginBottom: 2 }}>{listing.title}</h1>
      <div style={{ fontSize: 13, color: "var(--chalk-300)", marginBottom: 12 }}>
        {(listing as any).sellers?.business_name} · {listing.listing_type === "service" ? "Service" : "Product"}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--gold)", marginBottom: 16 }}>
        ₹{Number(listing.price).toLocaleString("en-IN")}
      </div>

      {listing.description && <p style={{ fontSize: 14, color: "var(--chalk-300)", marginBottom: 24 }}>{listing.description}</p>}

      {!isSeller && (
        <div style={{ marginBottom: 28 }}>
          <OrderForm listingId={listing.id} sellerId={listing.seller_id} price={Number(listing.price)} />
        </div>
      )}

      <h2 style={{ fontSize: 16, marginBottom: 8 }}>{isSeller ? "Orders" : "Your orders"}</h2>
      {(orders || []).length === 0 && <p style={{ fontSize: 14, color: "var(--chalk-300)" }}>No orders yet.</p>}
      {(orders || [])
        .filter((o: any) => isSeller || o.buyer_id === user?.id)
        .map((o: any) => (
          <div key={o.id} style={{ background: "var(--pitch-900)", border: "1px solid var(--pitch-700)", borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                Qty {o.quantity} · ₹{Number(o.total_price).toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: 11, color: statusColor[o.status], fontWeight: 700, textTransform: "capitalize" }}>{o.status}</span>
            </div>
            {o.status === "pending" && (
              <OrderStatusButtons orderId={o.id} listingId={listing.id} isSeller={isSeller} isBuyer={o.buyer_id === user?.id} />
            )}
          </div>
        ))}
    </div>
  );
}
