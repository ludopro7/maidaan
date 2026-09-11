"use client";

import { useState } from "react";
import Link from "next/link";
import type { CareerBatting, CareerBowling } from "../../../lib/cricket-stats";

type Tab = "matches" | "tournaments" | "teams" | "stats";

const tabs: { id: Tab; label: string }[] = [
  { id: "matches", label: "Matches" },
  { id: "tournaments", label: "Tournaments" },
  { id: "teams", label: "Teams" },
  { id: "stats", label: "Stats" },
];

export function CricketHubTabs({
  matches,
  tournaments,
  teams,
  batting,
  bowling,
}: {
  matches: any[];
  tournaments: any[];
  teams: any[];
  batting: CareerBatting;
  bowling: CareerBowling;
}) {
  const [tab, setTab] = useState<Tab>("matches");

  return (
    <div>
      <div style={{ display: "flex", gap: 4, overflowX: "auto", marginBottom: 18, borderBottom: "1px solid var(--pitch-800)" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "10px 14px",
              background: "transparent",
              border: "none",
              borderBottom: tab === t.id ? "2px solid var(--gold)" : "2px solid transparent",
              color: tab === t.id ? "var(--chalk-100)" : "var(--chalk-300)",
              fontWeight: tab === t.id ? 700 : 500,
              fontSize: 14,
              whiteSpace: "nowrap",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "matches" && (
        <div>
          {matches.length === 0 && <p style={{ color: "var(--chalk-300)", fontSize: 14 }}>No matches yet.</p>}
          {matches.map((m: any) => (
            <Link
              key={m.id}
              href={`/matches/${m.id}`}
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
                <div style={{ fontWeight: 600 }}>
                  {m.team_a?.name || "TBD"} vs {m.team_b?.name || "TBD"}
                </div>
                <span style={{ fontSize: 11, color: "var(--chalk-300)", textTransform: "capitalize" }}>{m.status}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--chalk-300)", marginTop: 4 }}>
                {m.tournaments?.name} {m.scheduled_at ? `· ${new Date(m.scheduled_at).toLocaleString()}` : ""}
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === "tournaments" && (
        <div>
          {tournaments.length === 0 && <p style={{ color: "var(--chalk-300)", fontSize: 14 }}>Not registered for any tournaments yet.</p>}
          {tournaments.map((r: any, i: number) => (
            <Link
              key={i}
              href={`/tournaments/${r.tournaments?.id}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                background: "var(--pitch-900)",
                border: "1px solid var(--pitch-700)",
                borderRadius: 12,
                padding: 16,
                marginBottom: 10,
              }}
            >
              <span style={{ fontWeight: 600 }}>{r.tournaments?.name}</span>
              <span style={{ fontSize: 12, color: "var(--warn-500)", textTransform: "capitalize" }}>{r.status}</span>
            </Link>
          ))}
        </div>
      )}

      {tab === "teams" && (
        <div>
          {teams.length === 0 && <p style={{ color: "var(--chalk-300)", fontSize: 14 }}>No teams yet.</p>}
          {teams.map((t: any) => (
            <Link
              key={t.id}
              href={`/teams/${t.id}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                background: "var(--pitch-900)",
                border: "1px solid var(--pitch-700)",
                borderRadius: 12,
                padding: 16,
                marginBottom: 10,
              }}
            >
              <span style={{ fontWeight: 600 }}>{t.name}</span>
              <span style={{ fontSize: 12, color: "var(--chalk-300)" }}>{t.member_role === "captain" ? "Captain" : "Player"}</span>
            </Link>
          ))}
        </div>
      )}

      {tab === "stats" && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
            Batting
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
            <StatBox label="Runs" value={batting.runs} />
            <StatBox label="Innings" value={batting.innings} />
            <StatBox label="High score" value={batting.highScore} />
            <StatBox label="Average" value={batting.average != null ? batting.average.toFixed(1) : "—"} />
            <StatBox label="Strike rate" value={batting.strikeRate != null ? batting.strikeRate.toFixed(1) : "—"} />
            <StatBox label="4s / 6s" value={`${batting.fours} / ${batting.sixes}`} />
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
            Bowling
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            <StatBox label="Wickets" value={bowling.wickets} />
            <StatBox label="Innings" value={bowling.innings} />
            <StatBox label="Best figures" value={bowling.bestFigures || "—"} />
            <StatBox label="Economy" value={bowling.economy != null ? bowling.economy.toFixed(2) : "—"} />
            <StatBox label="Runs conceded" value={bowling.runsConceded} />
            <StatBox label="Balls bowled" value={bowling.balls} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: "var(--pitch-900)", border: "1px solid var(--pitch-700)", borderRadius: 12, padding: 12, textAlign: "center" }}>
      <div style={{ fontSize: 18, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 10, color: "var(--chalk-300)", marginTop: 2 }}>{label}</div>
    </div>
  );
}

