"use client";

import { useState, useTransition } from "react";
import { saveProfile } from "./actions";

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

type Values = {
  full_name: string;
  bio: string;
  batting_hand: string;
  bowling_style: string;
  playing_role: string;
  preferred_format: string;
  experience_years: string;
};

export function ProfileForm({ defaultValues }: { defaultValues: Values }) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSubmit(formData: FormData) {
    setFeedback(null);
    startTransition(async () => {
      const result = await saveProfile(formData);
      setFeedback(
        result.success
          ? { ok: true, message: "Saved." }
          : { ok: false, message: result.message }
      );
    });
  }

  return (
    <form action={handleSubmit}>
      <label style={labelStyle}>Full name</label>
      <input name="full_name" defaultValue={defaultValues.full_name} style={inputStyle} />

      <label style={labelStyle}>Bio</label>
      <textarea
        name="bio"
        defaultValue={defaultValues.bio}
        rows={3}
        style={{ ...inputStyle, resize: "vertical" }}
      />

      <label style={labelStyle}>Batting hand</label>
      <select name="batting_hand" defaultValue={defaultValues.batting_hand} style={inputStyle}>
        <option value="">Not set</option>
        <option value="right">Right-handed</option>
        <option value="left">Left-handed</option>
      </select>

      <label style={labelStyle}>Bowling style</label>
      <input
        name="bowling_style"
        defaultValue={defaultValues.bowling_style}
        placeholder="e.g. Right-arm medium, Leg spin"
        style={inputStyle}
      />

      <label style={labelStyle}>Playing role</label>
      <select name="playing_role" defaultValue={defaultValues.playing_role} style={inputStyle}>
        <option value="">Not set</option>
        <option value="batter">Batter</option>
        <option value="bowler">Bowler</option>
        <option value="all_rounder">All-rounder</option>
        <option value="wicket_keeper">Wicket-keeper</option>
      </select>

      <label style={labelStyle}>Preferred format</label>
      <select
        name="preferred_format"
        defaultValue={defaultValues.preferred_format}
        style={inputStyle}
      >
        <option value="">Not set</option>
        <option value="T10">T10</option>
        <option value="T20">T20</option>
        <option value="ODI">ODI / 50-over</option>
        <option value="custom">Custom</option>
      </select>

      <label style={labelStyle}>Years of experience</label>
      <input
        name="experience_years"
        type="number"
        min={0}
        defaultValue={defaultValues.experience_years}
        style={inputStyle}
      />

      {feedback && (
        <div
          style={{
            fontSize: 13,
            marginBottom: 14,
            color: feedback.ok ? "var(--ok-500)" : "var(--danger-500)",
          }}
        >
          {feedback.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        style={{
          padding: "12px 20px",
          background: "var(--ball-500)",
          color: "var(--chalk-100)",
          border: "none",
          borderRadius: 8,
          fontWeight: 600,
          cursor: isPending ? "default" : "pointer",
          opacity: isPending ? 0.6 : 1,
        }}
      >
        {isPending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
