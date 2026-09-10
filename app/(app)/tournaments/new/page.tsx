import { TournamentForm } from "./tournament-form";

export default function NewTournamentPage() {
  return (
    <div style={{ maxWidth: 480 }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Organize a tournament</h1>
      <p style={{ color: "var(--chalk-300)", fontSize: 14, marginBottom: 24 }}>
        Choose how you want to run it, then fill in the details.
      </p>
      <TournamentForm />
    </div>
  );
}
