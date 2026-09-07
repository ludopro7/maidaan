import { createClient } from "../../../../lib/supabase/server";
import { BookingForm, BookingStatusButtons } from "./booking-widgets";

const statusColor: Record<string, string> = {
  pending: "var(--warn-500)",
  confirmed: "var(--ok-500)",
  rejected: "var(--danger-500)",
  cancelled: "var(--chalk-300)",
};

export default async function GroundDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: ground } = await supabase
    .from("grounds")
    .select("id, name, address, owner_id, price_per_slot, slot_label, facilities, cities(name)")
    .eq("id", params.id)
    .maybeSingle();

  if (!ground) {
    return <p style={{ color: "var(--chalk-300)" }}>Ground not found.</p>;
  }

  const isOwner = ground.owner_id === user?.id;

  const { data: bookings } = await supabase
    .from("ground_bookings")
    .select("id, booking_date, time_slot, status, notes, requested_by, profiles(full_name, email)")
    .eq("ground_id", params.id)
    .order("created_at", { ascending: false });

  return (
    <div style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: 22, marginBottom: 2 }}>{ground.name}</h1>
      <div style={{ fontSize: 13, color: "var(--chalk-300)", marginBottom: 4 }}>
        {(ground as any).cities?.name || "City TBD"}
        {ground.address ? ` · ${ground.address}` : ""}
      </div>
      <div style={{ fontSize: 14, marginBottom: 16 }}>
        ₹{Number(ground.price_per_slot).toLocaleString("en-IN")} / {ground.slot_label}
      </div>

      {ground.facilities?.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          {ground.facilities.map((f: string) => (
            <span
              key={f}
              style={{ fontSize: 11, background: "var(--pitch-800)", borderRadius: 999, padding: "3px 8px", color: "var(--chalk-300)" }}
            >
              {f}
            </span>
          ))}
        </div>
      )}

      {!isOwner && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>Request a booking</h2>
          <BookingForm groundId={ground.id} />
        </div>
      )}

      <h2 style={{ fontSize: 16, marginBottom: 8 }}>
        {isOwner ? "Booking requests" : "Your requests"}
      </h2>
      {(bookings || []).length === 0 && (
        <p style={{ fontSize: 14, color: "var(--chalk-300)" }}>No bookings yet.</p>
      )}
      {(bookings || [])
        .filter((b: any) => isOwner || b.requested_by === user?.id)
        .map((b: any) => (
          <div
            key={b.id}
            style={{
              background: "var(--pitch-900)",
              border: "1px solid var(--pitch-700)",
              borderRadius: 12,
              padding: 14,
              marginBottom: 10,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {b.booking_date} · {b.time_slot}
              </div>
              <span style={{ fontSize: 11, color: statusColor[b.status], fontWeight: 700, textTransform: "capitalize" }}>
                {b.status}
              </span>
            </div>
            {isOwner && (
              <div style={{ fontSize: 12, color: "var(--chalk-300)", marginTop: 4 }}>
                Requested by {b.profiles?.full_name || b.profiles?.email}
              </div>
            )}
            {b.notes && <div style={{ fontSize: 12, color: "var(--chalk-300)", marginTop: 4 }}>{b.notes}</div>}
            {b.status === "pending" && (
              <BookingStatusButtons
                bookingId={b.id}
                groundId={ground.id}
                isOwner={isOwner}
                isRequester={b.requested_by === user?.id}
              />
            )}
          </div>
        ))}
    </div>
  );
}
