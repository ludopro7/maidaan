import { TournamentForm } from "./tournament-form";

export default function NewTournamentPage() {
  return (
    <main style={{ paddingBottom: 100 }}>
      {/* HEADER */}
      <section
        style={{
          borderRadius: 23,
          padding: 21,
          marginBottom: 15,
          background:
            "radial-gradient(circle at 90% 10%, rgba(220,170,60,.22), transparent 34%), linear-gradient(145deg, var(--pitch-900), var(--pitch-700))",
          border: "1px solid rgba(218,174,75,.25)",
          boxShadow: "0 18px 45px rgba(0,0,0,.22)",
        }}
      >
        <div
          style={{
            color: "var(--gold)",
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 1.5,
          }}
        >
          MAIDAAN ORGANIZER
        </div>

        <h1
          style={{
            fontSize: 28,
            lineHeight: 1.08,
            margin: "8px 0 7px",
          }}
        >
          Create your tournament.
        </h1>

        <p
          style={{
            margin: 0,
            color: "var(--chalk-300)",
            fontSize: 13,
            lineHeight: 1.5,
            maxWidth: 430,
          }}
        >
          Set up the event, rules and finances. Maidaan will turn it into an
          operational tournament you can manage from one place.
        </p>
      </section>

      {/* CREATION FLOW */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 5,
          marginBottom: 18,
        }}
      >
        {[
          ["1", "Basics"],
          ["2", "Rules"],
          ["3", "Finance"],
          ["4", "Review"],
          ["5", "Publish"],
        ].map(([number, label]) => (
          <div
            key={number}
            style={{
              textAlign: "center",
              padding: "8px 2px",
              borderRadius: 10,
              background:
                number === "1"
                  ? "rgba(255,190,50,.11)"
                  : "var(--pitch-900)",
              border:
                number === "1"
                  ? "1px solid rgba(218,174,75,.25)"
                  : "1px solid var(--pitch-700)",
            }}
          >
            <div
              style={{
                color:
                  number === "1"
                    ? "var(--gold)"
                    : "var(--chalk-500)",
                fontSize: 10,
                fontWeight: 900,
              }}
            >
              {number}
            </div>

            <div
              style={{
                color:
                  number === "1"
                    ? "var(--chalk-200)"
                    : "var(--chalk-500)",
                fontSize: 8,
                marginTop: 2,
                fontWeight: 700,
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </section>

      <TournamentForm />
    </main>
  );
}
