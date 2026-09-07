import { createClient } from "../../../lib/supabase/server";

const statusColor: Record<string, string> = {
  draft: "var(--chalk-300)",
  published: "var(--warn-500)",
  registration_open: "var(--ok-500)",
  registration_closed: "var(--warn-500)",
  in_progress: "var(--ball-500)",
  completed: "var(--chalk-300)",
  cancelled: "var(--danger-500)",
};

export default async function TournamentsPage() {
  const supabase = createClient();

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("id, name, format, status, start_date, cities(name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22 }}>Tournaments</h1>
        <a
          href="/tournaments/new"
          style={{
            fontSize: 13,
            padding: "8px 14px",
            background: "var(--ball-500)",
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          + Organize
        </a>
      </div>

      {(tournaments || []).length === 0 && (
        <p style={{ color: "var(--chalk-300)", fontSize: 14 }}>
          No tournaments yet. Be the first to organize one.
        </p>
      )}

      {(tournaments || []).map((t: any) => (
        <a
          key={t.id}
          href={`/tournaments/${t.id}`}
          style={{
            display: "block",
            background: "var(--pitch-900)",
            border: "1px solid var(--pitch-700)",
            borderRadius: 12,
            padding: 16,
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 600 }}>{t.name}</div>
            <span style={{ fontSize: 12, color: statusColor[t.status] || "var(--chalk-300)" }}>
              {t.status.replace("_", " ")}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--chalk-300)", marginTop: 4 }}>
            {t.cities?.name || "City TBD"} · {t.format || "Format TBD"}
            {t.start_date ? ` · starts ${t.start_date}` : ""}
          </div>
        </a>
      ))}
    </div>
  );
}
