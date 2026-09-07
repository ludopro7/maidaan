import { OfficialForm } from "./official-form";

export default function NewOfficialPage() {
  return (
    <div style={{ maxWidth: 480 }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Offer official services</h1>
      <p style={{ color: "var(--chalk-300)", fontSize: 14, marginBottom: 24 }}>
        Organizers can find and request you for matches.
      </p>
      <OfficialForm />
    </div>
  );
}
