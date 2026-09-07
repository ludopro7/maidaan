"use client";

import { useMemo, useState, useTransition } from "react";
import { createTournament } from "./actions";

type Step = 1 | 2 | 3 | 4;

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 13px",
  background: "var(--pitch-950)",
  border: "1px solid var(--pitch-700)",
  borderRadius: 10,
  color: "var(--chalk-100)",
  marginTop: 6,
  outline: "none",
  fontSize: 13,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 800,
  color: "var(--chalk-300)",
  marginTop: 14,
  letterSpacing: 0.2,
};

const cardStyle: React.CSSProperties = {
  background: "var(--pitch-900)",
  border: "1px solid var(--pitch-700)",
  borderRadius: 17,
  padding: 16,
  marginBottom: 12,
};

const primaryButton: React.CSSProperties = {
  border: 0,
  borderRadius: 10,
  padding: "12px 16px",
  background: "var(--ball-500)",
  color: "#fff",
  fontSize: 12,
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: 10,
  padding: "12px 16px",
  background: "rgba(255,255,255,.055)",
  color: "var(--chalk-200)",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};

export function TournamentForm() {
  const [step, setStep] = useState<Step>(1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [format, setFormat] = useState("");
  const [matchType, setMatchType] = useState("league");
  const [numTeams, setNumTeams] = useState("");

  const [registrationDeadline, setRegistrationDeadline] =
    useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [overs, setOvers] = useState("");

  const [registrationFee, setRegistrationFee] =
    useState("0");
  const [prizeMoney, setPrizeMoney] = useState("0");
  const [groundCost, setGroundCost] = useState("0");
  const [umpireCost, setUmpireCost] = useState("0");

  const teamCount = Number(numTeams || 0);
  const fee = Number(registrationFee || 0);

  const revenue = teamCount * fee;

  const expenses =
    Number(prizeMoney || 0) +
    Number(groundCost || 0) +
    Number(umpireCost || 0);

  const projectedProfit = revenue - expenses;

  const breakEven =
    fee > 0 ? Math.ceil(expenses / fee) : 0;

  const progress = useMemo(() => {
    return `${(step / 4) * 100}%`;
  }, [step]);

  function validateCurrentStep() {
    setError(null);

    if (step === 1) {
      if (!name.trim()) {
        setError("Tournament name is required.");
        return false;
      }

      if (!format) {
        setError("Select a tournament format.");
        return false;
      }

      if (!numTeams || Number(numTeams) < 2) {
        setError("Enter at least 2 teams.");
        return false;
      }

      if (startDate && endDate && endDate < startDate) {
        setError("End date cannot be before start date.");
        return false;
      }
    }

    if (step === 2) {
      if (!overs || Number(overs) < 1) {
        setError("Enter the number of overs.");
        return false;
      }
    }

    if (step === 3) {
      if (
        Number(registrationFee) < 0 ||
        Number(prizeMoney) < 0 ||
        Number(groundCost) < 0 ||
        Number(umpireCost) < 0
      ) {
        setError("Finance values cannot be negative.");
        return false;
      }
    }

    return true;
  }

  function next() {
    if (!validateCurrentStep()) return;

    setStep((current) =>
      Math.min(4, current + 1) as Step
    );
  }

  function back() {
    setError(null);

    setStep((current) =>
      Math.max(1, current - 1) as Step
    );
  }

  function submit() {
    if (!validateCurrentStep()) return;

    setError(null);

    const formData = new FormData();

    formData.set("name", name);
    formData.set("city", city);
    formData.set("format", format);
    formData.set("match_type", matchType);
    formData.set("num_teams", numTeams);
    formData.set(
      "registration_deadline",
      registrationDeadline
    );
    formData.set("start_date", startDate);
    formData.set("end_date", endDate);
    formData.set("overs", overs);
    formData.set(
      "registration_fee",
      registrationFee || "0"
    );
    formData.set("prize_money", prizeMoney || "0");
    formData.set("ground_cost", groundCost || "0");
    formData.set("umpire_cost", umpireCost || "0");

    startTransition(async () => {
      const result = await createTournament(formData);

      if (result && !result.success) {
        setError(result.message);
      }
    });
  }

  return (
    <div>
      {/* PROGRESS */}
      <div
        style={{
          height: 5,
          borderRadius: 99,
          background: "rgba(255,255,255,.07)",
          overflow: "hidden",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: progress,
            height: "100%",
            background: "var(--ball-500)",
            transition: "width .2s ease",
          }}
        />
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <section style={cardStyle}>
          <div style={kicker}>STEP 1 · BASICS</div>

          <h2 style={heading}>
            Tell us about the tournament
          </h2>

          <p style={description}>
            These details appear on the public tournament page.
          </p>

          <label style={labelStyle}>
            Tournament name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              placeholder="e.g. Jaipur Corporate Cup"
            />
          </label>

          <label style={labelStyle}>
            City
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={inputStyle}
              placeholder="e.g. Jaipur"
            />
          </label>

          <label style={labelStyle}>
            Format
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select format</option>
              <option value="T10">T10</option>
              <option value="T20">T20</option>
              <option value="ODI">ODI / 50-over</option>
              <option value="custom">Custom</option>
            </select>
          </label>

          <label style={labelStyle}>
            Competition structure
            <select
              value={matchType}
              onChange={(e) =>
                setMatchType(e.target.value)
              }
              style={inputStyle}
            >
              <option value="league">League</option>
              <option value="round_robin">
                Round Robin
              </option>
              <option value="knockout">
                Knockout
              </option>
              <option value="group_knockout">
                Groups + Knockout
              </option>
              <option value="double_elimination">
                Double Elimination
              </option>
              <option value="custom">Custom</option>
            </select>
          </label>

          <label style={labelStyle}>
            Number of teams
            <input
              type="number"
              min={2}
              value={numTeams}
              onChange={(e) =>
                setNumTeams(e.target.value)
              }
              style={inputStyle}
              placeholder="e.g. 16"
            />
          </label>

          <label style={labelStyle}>
            Registration deadline
            <input
              type="date"
              value={registrationDeadline}
              onChange={(e) =>
                setRegistrationDeadline(e.target.value)
              }
              style={inputStyle}
            />
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 9,
            }}
          >
            <label style={labelStyle}>
              Start date
              <input
                type="date"
                value={startDate}
                onChange={(e) =>
                  setStartDate(e.target.value)
                }
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              End date
              <input
                type="date"
                value={endDate}
                onChange={(e) =>
                  setEndDate(e.target.value)
                }
                style={inputStyle}
              />
            </label>
          </div>
        </section>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <section style={cardStyle}>
          <div style={kicker}>STEP 2 · RULES</div>

          <h2 style={heading}>
            Define how cricket will be played
          </h2>

          <p style={description}>
            Start with the core rules. More advanced tournament
            rules can be added to the tournament control centre.
          </p>

          <label style={labelStyle}>
            Overs per innings
            <input
              type="number"
              min={1}
              value={overs}
              onChange={(e) => setOvers(e.target.value)}
              style={inputStyle}
              placeholder={
                format === "T10"
                  ? "10"
                  : format === "T20"
                  ? "20"
                  : "20"
              }
            />
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 9,
              marginTop: 15,
            }}
          >
            <RulePreview
              icon="🏏"
              title="Playing XI"
              value="Configure later"
            />

            <RulePreview
              icon="🔄"
              title="Substitutes"
              value="Configure later"
            />

            <RulePreview
              icon="⚡"
              title="Powerplay"
              value="Configure later"
            />

            <RulePreview
              icon="🎯"
              title="Tie-breaker"
              value="Configure later"
            />

            <RulePreview
              icon="📈"
              title="Net Run Rate"
              value="Available later"
            />

            <RulePreview
              icon="🏐"
              title="Ball & pitch"
              value="Configure later"
            />
          </div>

          <div
            style={{
              marginTop: 15,
              padding: 12,
              borderRadius: 11,
              background: "rgba(255,190,50,.06)",
              border:
                "1px solid rgba(255,190,50,.12)",
              color: "var(--chalk-300)",
              fontSize: 11,
              lineHeight: 1.5,
            }}
          >
            💡 You can refine detailed playing conditions after
            creating the tournament.
          </div>
        </section>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <section style={cardStyle}>
          <div style={kicker}>STEP 3 · FINANCE</div>

          <h2 style={heading}>
            Know your tournament numbers
          </h2>

          <p style={description}>
            Maidaan uses these numbers to estimate revenue,
            expenses and break-even.
          </p>

          <label style={labelStyle}>
            Team registration fee (₹)
            <input
              type="number"
              min={0}
              value={registrationFee}
              onChange={(e) =>
                setRegistrationFee(e.target.value)
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Prize money (₹)
            <input
              type="number"
              min={0}
              value={prizeMoney}
              onChange={(e) =>
                setPrizeMoney(e.target.value)
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Ground cost — total (₹)
            <input
              type="number"
              min={0}
              value={groundCost}
              onChange={(e) =>
                setGroundCost(e.target.value)
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Umpire cost — total (₹)
            <input
              type="number"
              min={0}
              value={umpireCost}
              onChange={(e) =>
                setUmpireCost(e.target.value)
              }
              style={inputStyle}
            />
          </label>

          <div
            style={{
              marginTop: 17,
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 8,
            }}
          >
            <FinanceBox
              label="Projected revenue"
              value={money(revenue)}
            />

            <FinanceBox
              label="Projected expenses"
              value={money(expenses)}
            />

            <FinanceBox
              label="Projected net"
              value={money(projectedProfit)}
              positive={projectedProfit >= 0}
            />

            <FinanceBox
              label="Break-even"
              value={
                breakEven
                  ? `${breakEven} teams`
                  : "—"
              }
            />
          </div>
        </section>
      )}

      {/* STEP 4 */}
      {step === 4 && (
        <section>
          <div style={cardStyle}>
            <div style={kicker}>STEP 4 · REVIEW</div>

            <h2 style={heading}>
              Your tournament is ready
            </h2>

            <p style={description}>
              Review the essentials before publishing.
            </p>

            <ReviewRow
              label="Tournament"
              value={name || "Not set"}
            />

            <ReviewRow
              label="City"
              value={city || "Not set"}
            />

            <ReviewRow
              label="Format"
              value={format || "Not set"}
            />

            <ReviewRow
              label="Structure"
              value={matchType.replaceAll("_", " ")}
            />

            <ReviewRow
              label="Teams"
              value={numTeams || "Not set"}
            />

            <ReviewRow
              label="Overs"
              value={overs || "Not set"}
            />

            <ReviewRow
              label="Registration fee"
              value={money(fee)}
            />

            <ReviewRow
              label="Start"
              value={startDate || "Not set"}
            />

            <ReviewRow
              label="Registration deadline"
              value={
                registrationDeadline || "Not set"
              }
            />
          </div>

          <div style={cardStyle}>
            <div style={kicker}>OPERATIONS</div>

            <h3
              style={{
                fontSize: 15,
                margin: "5px 0 5px",
              }}
            >
              What happens after publishing?
            </h3>

            <div style={{ display: "grid", gap: 9 }}>
              <NextStep
                icon="👥"
                title="Team registration"
                text="Teams can discover and register for your tournament."
              />

              <NextStep
                icon="🏟️"
                title="Grounds"
                text="Find and manage tournament venues."
              />

              <NextStep
                icon="🧑‍⚖️"
                title="Officials"
                text="Assign umpires and scorers."
              />

              <NextStep
                icon="🏏"
                title="Fixtures"
                text="Build the tournament match schedule."
              />

              <NextStep
                icon="💰"
                title="Finance"
                text="Track revenue, expenses and profitability."
              />
            </div>
          </div>
        </section>
      )}

      {/* ERROR */}
      {error && (
        <div
          style={{
            padding: 12,
            marginBottom: 12,
            borderRadius: 11,
            background: "rgba(230,70,70,.10)",
            border:
              "1px solid rgba(230,70,70,.22)",
            color: "var(--danger-500)",
            fontSize: 12,
            lineHeight: 1.45,
          }}
        >
          {error}
        </div>
      )}

      {/* NAVIGATION */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 9,
          marginTop: 14,
        }}
      >
        {step > 1 ? (
          <button
            type="button"
            onClick={back}
            style={secondaryButton}
            disabled={isPending}
          >
            ← Back
          </button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <button
            type="button"
            onClick={next}
            style={primaryButton}
            disabled={isPending}
          >
            Continue →
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            style={{
              ...primaryButton,
              minWidth: 160,
              opacity: isPending ? 0.6 : 1,
            }}
            disabled={isPending}
          >
            {isPending
              ? "Publishing…"
              : "🏆 Publish tournament"}
          </button>
        )}
      </div>

      <div
        style={{
          textAlign: "center",
          color: "var(--chalk-500)",
          fontSize: 9,
          marginTop: 14,
        }}
      >
        You can refine tournament operations after creation.
      </div>
    </div>
  );
}

/* ---------- COMPONENTS ---------- */

function RulePreview({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        padding: 11,
        borderRadius: 11,
        background: "rgba(255,255,255,.045)",
        border: "1px solid rgba(255,255,255,.055)",
      }}
    >
      <div style={{ fontSize: 17 }}>{icon}</div>

      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          marginTop: 5,
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: "var(--chalk-500)",
          fontSize: 9,
          marginTop: 2,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function FinanceBox({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 11,
        background: "rgba(255,255,255,.045)",
      }}
    >
      <div
        style={{
          color: "var(--chalk-500)",
          fontSize: 9,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 4,
          fontSize: 15,
          fontWeight: 900,
          color:
            positive === undefined
              ? "var(--chalk-100)"
              : positive
              ? "var(--ok-500)"
              : "var(--danger-500)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 15,
        padding: "11px 0",
        borderBottom:
          "1px solid rgba(255,255,255,.06)",
      }}
    >
      <span
        style={{
          color: "var(--chalk-500)",
          fontSize: 10,
        }}
      >
        {label}
      </span>

      <span
        style={{
          color: "var(--chalk-200)",
          fontSize: 11,
          fontWeight: 800,
          textAlign: "right",
          textTransform:
            label === "Structure"
              ? "capitalize"
              : "none",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function NextStep({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        padding: 10,
        borderRadius: 10,
        background: "rgba(255,255,255,.04)",
      }}
    >
      <div style={{ fontSize: 18 }}>{icon}</div>

      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          {title}
        </div>

        <div
          style={{
            color: "var(--chalk-500)",
            fontSize: 9,
            marginTop: 2,
            lineHeight: 1.4,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

function money(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

/* ---------- STYLES ---------- */

const kicker: React.CSSProperties = {
  color: "var(--gold)",
  fontSize: 9,
  fontWeight: 900,
  letterSpacing: 1.4,
};

const heading: React.CSSProperties = {
  fontSize: 19,
  margin: "5px 0 5px",
};

const description: React.CSSProperties = {
  color: "var(--chalk-400)",
  fontSize: 11,
  lineHeight: 1.5,
  margin: 0,
};
