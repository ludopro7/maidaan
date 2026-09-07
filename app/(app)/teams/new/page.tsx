import { TeamForm } from "./team-form";

export default function NewTeamPage() {
  return (
    <div style={{ maxWidth: 480 }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Create a team</h1>
      <p style={{ color: "var(--chalk-300)", fontSize: 14, marginBottom: 24 }}>
        You'll be added as captain.
      </p>
      <TeamForm />
    </div>
  );
}
