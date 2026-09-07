import { GroundForm } from "./ground-form";

export default function NewGroundPage() {
  return (
    <div style={{ maxWidth: 480 }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>List a ground</h1>
      <p style={{ color: "var(--chalk-300)", fontSize: 14, marginBottom: 24 }}>
        Bookings come in as requests — you approve or decline each one.
      </p>
      <GroundForm />
    </div>
  );
}
