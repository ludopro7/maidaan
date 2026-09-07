export default function BuilderOverview() {
  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Overview</h1>
      <p style={{ color: "var(--chalk-300)", fontSize: 14, maxWidth: 520 }}>
        This is Phase 1 of the Builder Command Center. Live platform metrics
        (users, tournaments, revenue, disputes) land here in a later phase.
        For now, head to <strong>Integrations</strong> to configure the
        SMS/phone-verification provider.
      </p>
    </div>
  );
}
