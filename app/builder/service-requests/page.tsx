import Link from "next/link";
import { createClient } from "../../../lib/supabase/server";

export default async function ServiceRequestsPage() {
  const supabase = createClient();

  const { data: requests } = await supabase
    .from("tournaments")
    .select("id, name, requested_budget, status, created_at, cities(name), profiles:organizer_id(full_name, email)")
    .eq("service_tier", "full_service")
    .order("created_at", { ascending: false });

  const pending = (requests || []).filter((r: any) => r.status === "draft");
  const completed = (requests || []).filter((r: any) => r.status !== "draft");

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Full-service requests</h1>
      <p style={{ color: "var(--chalk-300)", fontSize: 14, marginBottom: 28 }}>
        Organizers who handed us a budget and asked us to design the tournament. Complete each one via its edit page, then publish.
      </p>

      <h2 style={{ fontSize: 16, marginBottom: 10 }}>Pending ({pending.length})</h2>
      {pending.length === 0 && <p style={{ color: "var(--chalk-300)", fontSize: 14 }}>Nothing waiting.</p>}
      {pending.map((r: any) => (
        <Link
          key={r.id}
          href={`/tournaments/${r.id}/edit`}
          style={{
            display: "block",
            background: "var(--pitch-900)",
            border: "1px solid var(--warn-500)",
            borderRadius: 12,
            padding: 16,
            marginBottom: 10,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15 }}>{r.name}</div>
          <div style={{ fontSize: 12, color: "var(--chalk-300)", marginTop: 4 }}>
            {r.cities?.name || "City not set"} · Budget ₹{Number(r.requested_budget || 0).toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: 12, color: "var(--chalk-300)", marginTop: 2 }}>
            From {r.profiles?.full_name || r.profiles?.email} · {new Date(r.created_at).toLocaleDateString()}
          </div>
        </Link>
      ))}

      <h2 style={{ fontSize: 16, marginTop: 28, marginBottom: 10 }}>Completed ({completed.length})</h2>
      {completed.length === 0 && <p style={{ color: "var(--chalk-300)", fontSize: 14 }}>None yet.</p>}
      {completed.map((r: any) => (
        <Link
          key={r.id}
          href={`/tournaments/${r.id}`}
          style={{
            display: "block",
            background: "var(--pitch-900)",
            border: "1px solid var(--pitch-700)",
            borderRadius: 12,
            padding: 14,
            marginBottom: 8,
            fontSize: 13,
          }}
        >
          {r.name} <span style={{ color: "var(--chalk-300)" }}>· {r.status}</span>
        </Link>
      ))}
    </div>
  );
}
