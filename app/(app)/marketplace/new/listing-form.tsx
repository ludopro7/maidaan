"use client";

import { useState, useTransition } from "react";
import { createListing } from "./actions";

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
  marginTop: 18,
  marginBottom: 10,
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

export function ListingForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createListing(formData);
      if (result && !result.success) {
        setError(result.message);
      }
    });
  }

  return (
    <form action={handleSubmit}>
      <div style={sectionTitle}>Your business</div>
      <label style={labelStyle}>Business / seller name</label>
      <input name="business_name" required style={inputStyle} placeholder="e.g. Sharma Sports" />

      <label style={labelStyle}>Category</label>
      <input name="category" style={inputStyle} placeholder="e.g. Gear, Coaching, Photography" />

      <label style={labelStyle}>City</label>
      <input name="city" style={inputStyle} placeholder="e.g. Jaipur" />

      <div style={sectionTitle}>Your listing</div>
      <label style={labelStyle}>Type</label>
      <select name="listing_type" style={inputStyle} defaultValue="product">
        <option value="product">Product</option>
        <option value="service">Service</option>
      </select>

      <label style={labelStyle}>Title</label>
      <input name="title" required style={inputStyle} placeholder="e.g. Cricket kit bag" />

      <label style={labelStyle}>Description</label>
      <textarea name="description" rows={3} style={{ ...inputStyle, resize: "vertical" }} />

      <label style={labelStyle}>Price (₹)</label>
      <input name="price" type="number" min={0} required style={inputStyle} placeholder="e.g. 1200" />

      <label style={labelStyle}>Icon (emoji, optional)</label>
      <input name="image_emoji" style={inputStyle} placeholder="🏏" maxLength={4} />

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
        }}
      >
        {isPending ? "Publishing…" : "Publish listing"}
      </button>
    </form>
  );
}
