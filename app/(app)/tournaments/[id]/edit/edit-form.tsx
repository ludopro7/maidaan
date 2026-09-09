"use client";

import { useState, useTransition } from "react";
import { updateTournament } from "./actions";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "var(--pitch-950)",
  border: "1px solid var(--pitch-700)",
  borderRadius: 8,
  color: "var(--chalk-100)",
  marginBottom: 14,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  marginBottom: 6,
  color: "var(--chalk-300)",
};

const sectionTitle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "var(--gold)",
  marginTop: 20,
  marginBottom: 10,
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

type Defaults = {
  name: string;
  description: string;
  city: string;
  format: string;
  match_type: string;
  num_teams: string;
  registration_deadline: string;
  start_date: string;
  end_date: string;
  status: string;
  overs: string;
  playing_xi: string;
  substitute_rules: string;
  powerplay: string;
  ball_type: string;
  pitch_type: string;
  eligibility: string;
  tie_rules: string;
  nrr_rules: string;
  points_win: string;
  points_tie: string;
  points_loss: string;
  registration_fee: string;
  prize_money: string;
  expected_sponsorship: string;
  ground_cost: string;
  umpire_cost: string;
  scorer_cost: string;
  equipment_cost: string;
  trophy_cost: string;
  food_cost: string;
  staff_cost: string;
  other_expenses: string;
};

export function EditTournamentForm({ tournamentId, defaults }: { tournamentId: string; defaults: Defaults }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateTournament(tournamentId, formData);
      if (result && !result.success) {
        setError(result.message);
      }
    });
  }

  return (
    <form action={handleSubmit}>
      <div style={sectionTitle}>Basics</div>
      <label style={labelStyle}>Tournament name</label>
      <input name="name" defaultValue={defaults.name} required style={inputStyle} />

      <label style={labelStyle}>Description</label>
      <textarea name="description" defaultValue={defaults.description} rows={3} style={{ ...inputStyle, resize: "vertical" }} />

      <label style={labelStyle}>City</label>
      <input name="city" defaultValue={defaults.city} style={inputStyle} />

      <label style={labelStyle}>Format</label>
      <select name="format" defaultValue={defaults.format} style={inputStyle}>
        <option value="">Not set</option>
        <option value="T10">T10</option>
        <option value="T20">T20</option>
        <option value="ODI">ODI / 50-over</option>
        <option value="custom">Custom</option>
      </select>

      <label style={labelStyle}>Match type</label>
      <input name="match_type" defaultValue={defaults.match_type} style={inputStyle} placeholder="e.g. Knockout, League" />

      <label style={labelStyle}>Number of teams</label>
      <input name="num_teams" type="number" min={2} defaultValue={defaults.num_teams} style={inputStyle} />

      <label style={labelStyle}>Status</label>
      <select name="status" defaultValue={defaults.status} style={inputStyle}>
        <option value="draft">Draft</option>
        <option value="published">Published</option>
        <option value="registration_open">Registration open</option>
        <option value="registration_closed">Registration closed</option>
        <option value="in_progress">In progress</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>

      <label style={labelStyle}>Registration deadline</label>
      <input name="registration_deadline" type="date" defaultValue={defaults.registration_deadline} style={inputStyle} />

      <label style={labelStyle}>Start date</label>
      <input name="start_date" type="date" defaultValue={defaults.start_date} style={inputStyle} />

      <label style={labelStyle}>End date</label>
      <input name="end_date" type="date" defaultValue={defaults.end_date} style={inputStyle} />

      <div style={sectionTitle}>Rules</div>
      <label style={labelStyle}>Overs per innings</label>
      <input name="overs" type="number" min={1} defaultValue={defaults.overs} style={inputStyle} />

      <label style={labelStyle}>Playing XI size</label>
      <input name="playing_xi" type="number" min={1} defaultValue={defaults.playing_xi} style={inputStyle} />

      <label style={labelStyle}>Substitute rules</label>
      <input name="substitute_rules" defaultValue={defaults.substitute_rules} style={inputStyle} />

      <label style={labelStyle}>Powerplay</label>
      <input name="powerplay" defaultValue={defaults.powerplay} style={inputStyle} />

      <label style={labelStyle}>Ball type</label>
      <input name="ball_type" defaultValue={defaults.ball_type} style={inputStyle} placeholder="e.g. Tennis, Leather" />

      <label style={labelStyle}>Pitch type</label>
      <input name="pitch_type" defaultValue={defaults.pitch_type} style={inputStyle} placeholder="e.g. Matting, Turf" />

      <label style={labelStyle}>Eligibility</label>
      <input name="eligibility" defaultValue={defaults.eligibility} style={inputStyle} />

      <label style={labelStyle}>Tie-breaker rules</label>
      <input name="tie_rules" defaultValue={defaults.tie_rules} style={inputStyle} />

      <label style={labelStyle}>NRR rules</label>
      <input name="nrr_rules" defaultValue={defaults.nrr_rules} style={inputStyle} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        <div>
          <label style={labelStyle}>Points: win</label>
          <input name="points_win" type="number" defaultValue={defaults.points_win} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Points: tie</label>
          <input name="points_tie" type="number" defaultValue={defaults.points_tie} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Points: loss</label>
          <input name="points_loss" type="number" defaultValue={defaults.points_loss} style={inputStyle} />
        </div>
      </div>

      <div style={sectionTitle}>Finances (private)</div>
      <label style={labelStyle}>Team registration fee (₹)</label>
      <input name="registration_fee" type="number" min={0} defaultValue={defaults.registration_fee} style={inputStyle} />

      <label style={labelStyle}>Prize money (₹)</label>
      <input name="prize_money" type="number" min={0} defaultValue={defaults.prize_money} style={inputStyle} />

      <label style={labelStyle}>Expected sponsorship (₹)</label>
      <input name="expected_sponsorship" type="number" min={0} defaultValue={defaults.expected_sponsorship} style={inputStyle} />

      <label style={labelStyle}>Ground cost (₹)</label>
      <input name="ground_cost" type="number" min={0} defaultValue={defaults.ground_cost} style={inputStyle} />

      <label style={labelStyle}>Umpire cost (₹)</label>
      <input name="umpire_cost" type="number" min={0} defaultValue={defaults.umpire_cost} style={inputStyle} />

      <label style={labelStyle}>Scorer cost (₹)</label>
      <input name="scorer_cost" type="number" min={0} defaultValue={defaults.scorer_cost} style={inputStyle} />

      <label style={labelStyle}>Equipment cost (₹)</label>
      <input name="equipment_cost" type="number" min={0} defaultValue={defaults.equipment_cost} style={inputStyle} />

      <label style={labelStyle}>Trophy cost (₹)</label>
      <input name="trophy_cost" type="number" min={0} defaultValue={defaults.trophy_cost} style={inputStyle} />

      <label style={labelStyle}>Food cost (₹)</label>
      <input name="food_cost" type="number" min={0} defaultValue={defaults.food_cost} style={inputStyle} />

      <label style={labelStyle}>Staff cost (₹)</label>
      <input name="staff_cost" type="number" min={0} defaultValue={defaults.staff_cost} style={inputStyle} />

      <label style={labelStyle}>Other expenses (₹)</label>
      <input name="other_expenses" type="number" min={0} defaultValue={defaults.other_expenses} style={inputStyle} />

      {error && <div style={{ color: "var(--danger-500)", fontSize: 13, marginBottom: 14 }}>{error}</div>}

      <button
        type="submit"
        disabled={isPending}
        style={{
          padding: "12px 20px",
          background: "var(--gold)",
          color: "#10150f",
          border: "none",
          borderRadius: 8,
          fontWeight: 700,
          cursor: isPending ? "default" : "pointer",
          opacity: isPending ? 0.6 : 1,
          marginTop: 8,
        }}
      >
        {isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
