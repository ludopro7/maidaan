import { createClient } from "../../../../lib/supabase/server";
import { OfficialBookingForm, OfficialBookingStatusButtons } from "./booking-widgets";

const roleLabel: Record<string, string> = {
  umpire: "Umpire",
  scorer: "Scorer",
  umpire_scorer: "Umpire + Scorer",
};

const statusColor: Record<string, string> = {
  pending: "var(--warn-500)",
  confirmed: "var(--ok-500)",
  rejected: "var(--danger-500)",
  cancelled: "var(--chalk-300)",
};

export default async function OfficialDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: official } = await supabase
    .from("officials")
    .select("id, role, experience_years, price_per_match, bio, user_id, photo_url, cities(name), profiles(full_name)")
    .eq("id", params.id)
    .maybeSingle();

  if (!official) {
    return <p style={{ color: "var(--chalk-300)" }}>Official not found.</p>;
  }

  const isOwner = official.user_id === user?.id;

  const { data: bookings } = await supabase
    .from("official_bookings")
    .select("id, role_requested, scheduled_at, status, notes, requested_by, profiles(full_name, email)")
    .eq("official_id", params.id)
    .order("created_at", { ascending: false });

  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        {official.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={official.photo_url}
            alt=""
            style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--pitch-700)" }}
          />
        ) : (
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "var(--pitch-900)",
              border: "1px solid var(--pitch-700)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            🧑‍⚖️
          </div>
        )}
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>{(official as any).profiles?.full_name || "Official"}</h1>
          <div style={{ fontSize: 13, color: "var(--chalk-300)", marginTop: 2 }}>
            {roleLabel[official.role]} · {official.experience_years ?? "?"} yrs · {(official as any).cities?.name || "City TBD"}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 14, marginBottom: 16 }}>
        ₹{Number(official.price_per_match).toLocaleString("en-IN")} / match
      </div>
      {official.bio && <p style={{ fontSize: 14, color: "var(--chalk-300)", marginBottom: 20 }}>{official.bio}</p>}

      {!isOwner && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>Request assignment</h2>
          <OfficialBookingForm officialId={official.id} role={official.role} />
        </div>
      )}

      <h2 style={{ fontSize: 16, marginBottom: 8 }}>
        {isOwner ? "Assignment requests" : "Your requests"}
      </h2>
      {(bookings || []).length === 0 && (
        <p style={{ fontSize: 14, color: "var(--chalk-300)" }}>No requests yet.</p>
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
                {roleLabel[b.role_requested]} · {new Date(b.scheduled_at).toLocaleString()}
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
              <OfficialBookingStatusButtons
                bookingId={b.id}
                officialId={official.id}
                isOwner={isOwner}
                isRequester={b.requested_by === user?.id}
              />
            )}
          </div>
        ))}
    </div>
  );
}
