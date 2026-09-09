import Link from "next/link";
import { createClient } from "../../../../lib/supabase/server";
import { RegisterTeamButton } from "./register-team-button";

type Tournament = {
  id: string;
  name: string;
  organizer_id: string;
  format: string | null;
  match_type: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  num_teams: number | null;
  cities: { name: string } | { name: string }[] | null;
};

type TeamRegistration = {
  id?: string;
  status: string;
  teams:
    | { id: string; name: string }
    | { id: string; name: string }[]
    | null;
};

function formatDate(value: string | null) {
  if (!value) return "Date TBA";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function statusLabel(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusStyle(status: string) {
  if (status === "registration_open") {
    return {
      background: "rgba(70, 190, 110, .14)",
      color: "var(--ok-500)",
    };
  }

  if (status === "in_progress") {
    return {
      background: "rgba(255, 190, 50, .14)",
      color: "var(--ball-500)",
    };
  }

  if (status === "cancelled") {
    return {
      background: "rgba(230, 70, 70, .14)",
      color: "var(--danger-500)",
    };
  }

  return {
    background: "rgba(255,255,255,.07)",
    color: "var(--chalk-300)",
  };
}

function money(value: number | null | undefined) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export default async function TournamentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div style={emptyPage}>
        <h2 style={{ marginTop: 0 }}>Sign in required</h2>
        <p style={{ color: "var(--chalk-300)" }}>
          Please sign in to view this tournament.
        </p>
        <Link href="/login" style={primaryButton}>
          Sign in
        </Link>
      </div>
    );
  }

  const { data: tournament } = await supabase
    .from("tournaments")
    .select(
      `
        id,
        name,
        organizer_id,
        format,
        match_type,
        status,
        start_date,
        end_date,
        num_teams,
        cities(name)
      `
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!tournament) {
    return (
      <div style={emptyPage}>
        <div style={{ fontSize: 40 }}>🏏</div>
        <h2 style={{ margin: "10px 0 5px" }}>Tournament not found</h2>
        <p style={{ color: "var(--chalk-300)", fontSize: 13 }}>
          This tournament may have been removed or is no longer available.
        </p>
        <Link href="/tournaments" style={primaryButton}>
          Back to tournaments
        </Link>
      </div>
    );
  }

  const typedTournament = tournament as Tournament;
  const isOrganizer = typedTournament.organizer_id === user.id;

  const [
    { data: rules },
    { data: finance },
    { data: registrations },
    { data: myTeams },
    { data: tournamentMatches },
  ] = await Promise.all([
    supabase
      .from("tournament_rules")
      .select(
        `
          overs,
          playing_xi,
          substitute_rules,
          powerplay,
          ball_type,
          pitch_type,
          eligibility,
          points_for_win,
          points_for_tie,
          points_for_loss,
          tie_breaker,
          nrr_enabled
        `
      )
      .eq("tournament_id", params.id)
      .maybeSingle(),

    isOrganizer
      ? supabase
          .from("tournament_finance")
          .select(
            `
              registration_fee,
              prize_money,
              ground_cost,
              umpire_cost,
              scorer_cost,
              equipment_cost,
              trophy_cost,
              food_cost,
              staff_cost,
              other_expenses
            `
          )
          .eq("tournament_id", params.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),

    supabase
      .from("tournament_teams")
      .select(
        `
          id,
          status,
          teams(id, name)
        `
      )
      .eq("tournament_id", params.id)
      .order("id", { ascending: true }),

    supabase
      .from("teams")
      .select("id, name")
      .eq("captain_id", user.id),

    supabase
      .from("matches")
      .select(
        `
          id,
          status,
          scheduled_at,
          team_a_id,
          team_b_id,
          teams_a:teams!matches_team_a_id_fkey(id,name),
          teams_b:teams!matches_team_b_id_fkey(id,name)
        `
      )
      .eq("tournament_id", params.id)
      .order("scheduled_at", { ascending: true }),
  ]);

  const teamRegistrations = (registrations || []) as TeamRegistration[];

  const registeredTeamIds = new Set(
    teamRegistrations
      .map((registration) => getTeam(registration.teams)?.id)
      .filter(Boolean)
  );

  const eligibleTeams = (myTeams || []).filter(
    (team: any) => !registeredTeamIds.has(team.id)
  );

  const registeredCount = teamRegistrations.filter(
    (registration) =>
      registration.status !== "rejected" &&
      registration.status !== "cancelled"
  ).length;

  const capacity = Number(typedTournament.num_teams || 0);

  const registrationProgress =
    capacity > 0
      ? Math.min(100, Math.round((registeredCount / capacity) * 100))
      : 0;

  let financeSummary:
    | {
        revenue: number;
        expenses: number;
        profit: number;
        breakEvenTeams: number;
      }
    | null = null;

  if (finance) {
    const registrationFee = Number(finance.registration_fee || 0);

    const revenue = registrationFee * registeredCount;

    const expenses =
      Number(finance.prize_money || 0) +
      Number(finance.ground_cost || 0) +
      Number(finance.umpire_cost || 0) +
      Number(finance.scorer_cost || 0) +
      Number(finance.equipment_cost || 0) +
      Number(finance.trophy_cost || 0) +
      Number(finance.food_cost || 0) +
      Number(finance.staff_cost || 0) +
      Number(finance.other_expenses || 0);

    const breakEvenTeams =
      registrationFee > 0 ? Math.ceil(expenses / registrationFee) : 0;

    financeSummary = {
      revenue,
      expenses,
      profit: revenue - expenses,
      breakEvenTeams,
    };
  }

  const completedMatches =
    tournamentMatches?.filter(
      (match: any) => match.status === "completed"
    ).length || 0;

  const liveMatches =
    tournamentMatches?.filter(
      (match: any) => match.status === "live"
    ).length || 0;

  const upcomingMatches =
    tournamentMatches?.filter(
      (match: any) =>
        match.status !== "completed" &&
        match.status !== "cancelled"
    ).length || 0;

  return (
    <main style={{ paddingBottom: 100 }}>
      {/* BACK */}
      <div style={{ marginBottom: 12 }}>
        <Link
          href="/tournaments"
          style={{
            color: "var(--chalk-400)",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          ← All tournaments
        </Link>
      </div>

      {/* HERO */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 24,
          padding: 22,
          marginBottom: 14,
          background:
            "radial-gradient(circle at 90% 10%, rgba(220,170,60,.23), transparent 35%), linear-gradient(145deg, var(--pitch-900), var(--pitch-700))",
          border: "1px solid rgba(218,174,75,.25)",
          boxShadow: "0 18px 50px rgba(0,0,0,.24)",
        }}
      >
        <div
          style={{
            color: "var(--gold)",
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          MAIDAAN TOURNAMENT
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            marginTop: 8,
          }}
        >
          <h1
            style={{
              fontSize: 29,
              lineHeight: 1.08,
              margin: 0,
              maxWidth: 420,
            }}
          >
            {typedTournament.name}
          </h1>

          <span
            style={{
              ...statusStyle(typedTournament.status),
              padding: "7px 10px",
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            {statusLabel(typedTournament.status)}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: 7,
            flexWrap: "wrap",
            marginTop: 15,
          }}
        >
          <MetaChip
            text={`📍 ${
              getCityName(typedTournament.cities) || "City TBA"
            }`}
          />
          <MetaChip text={`🏏 ${typedTournament.format || "Format TBA"}`} />
          <MetaChip
            text={`⚡ ${
              typedTournament.match_type || "Match type TBA"
            }`}
          />
        </div>

        <div
          style={{
            marginTop: 16,
            color: "var(--chalk-300)",
            fontSize: 13,
          }}
        >
          📅 {formatDate(typedTournament.start_date)}
          {typedTournament.end_date
            ? ` – ${formatDate(typedTournament.end_date)}`
            : ""}
        </div>

        {isOrganizer && (
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 18,
            }}
          >
            <Link href={`/tournaments/${params.id}/edit`} style={primaryButton}>
              Edit tournament
            </Link>

            <Link
              href={`/tournaments/${params.id}/fixtures`}
              style={secondaryButton}
            >
              Manage fixtures
            </Link>
          </div>
        )}
      </section>

      {/* QUICK STATS */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <StatCard
          value={registeredCount}
          label={`of ${capacity || "—"} teams`}
        />

        <StatCard value={completedMatches} label="completed" />

        <StatCard value={liveMatches} label="live now" />
      </section>

      {/* REGISTRATION PROGRESS */}
      <section style={card}>
        <div style={sectionHeader}>
          <div>
            <div style={kicker}>REGISTRATION</div>
            <h2 style={heading}>Team registrations</h2>
          </div>

          <strong style={{ color: "var(--gold)", fontSize: 14 }}>
            {registeredCount}/{capacity || "—"}
          </strong>
        </div>

        {capacity > 0 && (
          <>
            <div
              style={{
                height: 7,
                background: "rgba(255,255,255,.07)",
                borderRadius: 99,
                overflow: "hidden",
                marginTop: 13,
              }}
            >
              <div
                style={{
                  width: `${registrationProgress}%`,
                  height: "100%",
                  background: "var(--ball-500)",
                  borderRadius: 99,
                }}
              />
            </div>

            <div
              style={{
                color: "var(--chalk-400)",
                fontSize: 11,
                marginTop: 7,
              }}
            >
              {registrationProgress}% of planned tournament capacity filled
            </div>
          </>
        )}
      </section>

      {/* RULES */}
      <section style={card}>
        <div style={sectionHeader}>
          <div>
            <div style={kicker}>MATCH RULES</div>
            <h2 style={heading}>Tournament rules</h2>
          </div>

          {isOrganizer && (
            <Link
              href={`/tournaments/${params.id}/edit`}
              style={tinyLink}
            >
              Edit
            </Link>
          )}
        </div>

        {rules ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 8,
              marginTop: 13,
            }}
          >
            <Rule label="Overs" value={rules.overs} />
            <Rule label="Playing XI" value={rules.playing_xi} />
            <Rule
              label="Substitutes"
              value={rules.substitute_rules}
            />
            <Rule label="Powerplay" value={rules.powerplay} />
            <Rule label="Ball" value={rules.ball_type} />
            <Rule label="Pitch" value={rules.pitch_type} />
            <Rule label="Eligibility" value={rules.eligibility} />
            <Rule label="Tie-breaker" value={rules.tie_breaker} />
            <Rule
              label="Points"
              value={
                rules.points_for_win != null
                  ? `W ${rules.points_for_win} · T ${
                      rules.points_for_tie ?? 0
                    } · L ${rules.points_for_loss ?? 0}`
                  : null
              }
            />
            <Rule
              label="NRR"
              value={rules.nrr_enabled ? "Enabled" : "Not enabled"}
            />
          </div>
        ) : (
          <EmptyInline text="Tournament rules have not been published yet." />
        )}
      </section>

      {/* ORGANIZER FINANCE */}
      {isOrganizer && (
        <section style={card}>
          <div style={sectionHeader}>
            <div>
              <div style={kicker}>ORGANIZER ONLY</div>
              <h2 style={heading}>Tournament finance</h2>
            </div>

            <span style={privateBadge}>PRIVATE</span>
          </div>

          {financeSummary ? (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                  marginTop: 14,
                }}
              >
                <FinanceMetric
                  label="Revenue"
                  value={money(financeSummary.revenue)}
                />

                <FinanceMetric
                  label="Expenses"
                  value={money(financeSummary.expenses)}
                />

                <FinanceMetric
                  label="Net"
                  value={money(financeSummary.profit)}
                  positive={financeSummary.profit >= 0}
                />
              </div>

              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 12,
                  background: "rgba(255,255,255,.045)",
                  fontSize: 12,
                  color: "var(--chalk-300)",
                }}
              >
                Break-even:
                <strong
                  style={{
                    color: "var(--chalk-100)",
                    marginLeft: 5,
                  }}
                >
                  {financeSummary.breakEvenTeams || "—"} teams
                </strong>
              </div>
            </>
          ) : (
            <EmptyInline text="Finance has not been configured yet." />
          )}
        </section>
      )}

      {/* TEAMS */}
      <section style={card}>
        <div style={sectionHeader}>
          <div>
            <div style={kicker}>TEAMS</div>
            <h2 style={heading}>Registered teams</h2>
          </div>

          <span
            style={{
              color: "var(--chalk-400)",
              fontSize: 12,
            }}
          >
            {teamRegistrations.length}
          </span>
        </div>

        {teamRegistrations.length === 0 ? (
          <EmptyInline text="No teams have registered yet." />
        ) : (
          <div style={{ marginTop: 10 }}>
            {teamRegistrations.map((registration, index) => (
              <div
                key={registration.id || index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 0",
                  borderBottom:
                    index === teamRegistrations.length - 1
                      ? "none"
                      : "1px solid rgba(255,255,255,.06)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={teamAvatar}>
                    🏏
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                      }}
                    >
                      {getTeam(registration.teams)?.name || "Unknown team"}
                    </div>

                    <div
                      style={{
                        color: "var(--chalk-400)",
                        fontSize: 10,
                        marginTop: 2,
                        textTransform: "capitalize",
                      }}
                    >
                      {registration.status.replaceAll("_", " ")}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    color:
                      registration.status === "approved"
                        ? "var(--ok-500)"
                        : "var(--chalk-400)",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {statusLabel(registration.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* TEAM REGISTRATION */}
      {!isOrganizer &&
        typedTournament.status === "registration_open" &&
        eligibleTeams.length > 0 && (
          <section style={highlightCard}>
            <div style={kicker}>YOUR TEAM</div>

            <h2 style={{ margin: "5px 0 7px", fontSize: 20 }}>
              Register for this tournament
            </h2>

            <p
              style={{
                margin: 0,
                color: "var(--chalk-300)",
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              Select one of your teams to submit a tournament registration.
            </p>

            <div style={{ marginTop: 15 }}>
              {eligibleTeams.map((team: any) => (
                <RegisterTeamButton
                  key={team.id}
                  tournamentId={typedTournament.id}
                  teamId={team.id}
                  teamName={team.name}
                />
              ))}
            </div>
          </section>
        )}

      {!isOrganizer &&
        typedTournament.status === "registration_open" &&
        eligibleTeams.length === 0 &&
        (myTeams || []).length > 0 && (
          <section style={card}>
            <div style={kicker}>REGISTRATION</div>
            <h2 style={heading}>Your teams</h2>
            <p
              style={{
                color: "var(--chalk-300)",
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              Your available teams are already registered for this tournament
              or cannot currently be registered.
            </p>
          </section>
        )}

      {!isOrganizer &&
        (myTeams || []).length === 0 &&
        typedTournament.status === "registration_open" && (
          <section style={highlightCard}>
            <div style={{ fontSize: 28 }}>👥</div>

            <h2 style={{ fontSize: 18, margin: "8px 0 5px" }}>
              You need a team first
            </h2>

            <p
              style={{
                color: "var(--chalk-300)",
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              Create a team and become its captain to register for this
              tournament.
            </p>

            <Link href="/teams/new" style={primaryButton}>
              Create team
            </Link>
          </section>
        )}

      {/* MATCHES */}
      <section style={card}>
        <div style={sectionHeader}>
          <div>
            <div style={kicker}>MATCH OPERATIONS</div>
            <h2 style={heading}>Fixtures & matches</h2>
          </div>

          <span
            style={{
              color: "var(--chalk-400)",
              fontSize: 12,
            }}
          >
            {tournamentMatches?.length || 0}
          </span>
        </div>

        {!tournamentMatches || tournamentMatches.length === 0 ? (
          <EmptyInline text="Fixtures have not been generated yet." />
        ) : (
          <div style={{ marginTop: 10 }}>
            {tournamentMatches.slice(0, 5).map((match: any) => (
              <Link
                key={match.id}
                href={`/matches/${match.id}`}
                style={{
                  display: "block",
                  padding: "13px 0",
                  borderBottom: "1px solid rgba(255,255,255,.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {match.teams_a?.name || "TBD"}
                    </div>

                    <div
                      style={{
                        color: "var(--chalk-500)",
                        fontSize: 10,
                        margin: "3px 0",
                      }}
                    >
                      VS
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {match.teams_b?.name || "TBD"}
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign: "right",
                      color: "var(--chalk-400)",
                      fontSize: 10,
                    }}
                  >
                    <div>
                      {match.scheduled_at
                        ? formatDate(match.scheduled_at)
                        : "Date TBA"}
                    </div>

                    <div
                      style={{
                        marginTop: 5,
                        color:
                          match.status === "live"
                            ? "var(--ball-500)"
                            : "var(--chalk-300)",
                        fontWeight: 800,
                        textTransform: "capitalize",
                      }}
                    >
                      {match.status?.replaceAll("_", " ") || "Scheduled"}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {tournamentMatches && tournamentMatches.length > 5 && (
          <Link
            href={`/tournaments/${params.id}/fixtures`}
            style={{
              display: "block",
              textAlign: "center",
              paddingTop: 13,
              color: "var(--gold)",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            View all fixtures →
          </Link>
        )}
      </section>

      {/* OPERATIONS */}
      <section style={card}>
        <div style={kicker}>MAIDAAN OPERATIONS</div>

        <h2 style={heading}>Run this tournament</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 8,
            marginTop: 13,
          }}
        >
          <OperationLink
            href="/grounds"
            icon="🏟️"
            title="Grounds"
            description="Find a venue"
          />

          <OperationLink
            href="/officials"
            icon="🧑‍⚖️"
            title="Officials"
            description="Umpires & scorers"
          />

          <OperationLink
            href={`/tournaments/${params.id}/fixtures`}
            icon="📋"
            title="Fixtures"
            description="Schedule matches"
          />

          <OperationLink
            href="/challenges"
            icon="⚔️"
            title="Challenges"
            description="Create matchups"
          />
        </div>
      </section>

      {/* ORGANIZER ACTIONS */}
      {isOrganizer && (
        <section style={card}>
          <div style={kicker}>ORGANIZER CONTROL</div>

          <h2 style={heading}>Tournament management</h2>

          <div style={{ display: "grid", gap: 8, marginTop: 13 }}>
            <ActionRow
              href={`/tournaments/${params.id}/edit`}
              icon="⚙️"
              title="Tournament settings"
              description="Rules, dates, format and configuration"
            />

            <ActionRow
              href={`/tournaments/${params.id}/fixtures`}
              icon="🏏"
              title="Fixture management"
              description="Generate and manage tournament matches"
            />

            <ActionRow
              href="/grounds"
              icon="🏟️"
              title="Ground marketplace"
              description="Find and book tournament venues"
            />

            <ActionRow
              href="/officials"
              icon="🧑‍⚖️"
              title="Officials marketplace"
              description="Find umpires and scorers"
            />
          </div>
        </section>
      )}

      {/* FOOTER STATUS */}
      <div
        style={{
          textAlign: "center",
          color: "var(--chalk-500)",
          fontSize: 10,
          marginTop: 22,
          lineHeight: 1.5,
        }}
      >
        Maidaan · The operating platform for grassroots cricket
      </div>
    </main>
  );
}

/* ---------- COMPONENTS ---------- */

function getCityName(
  cities: { name: string } | { name: string }[] | null
): string | null {
  if (!cities) return null;
  if (Array.isArray(cities)) {
    return cities[0]?.name ?? null;
  }
  return cities.name ?? null;
}

function getTeam(
  teams:
    | { id: string; name: string }
    | { id: string; name: string }[]
    | null
): { id: string; name: string } | null {
  if (!teams) return null;
  if (Array.isArray(teams)) {
    return teams[0] ?? null;
  }
  return teams;
}

function MetaChip({ text }: { text: string }) {
  return (
    <span
      style={{
        background: "rgba(255,255,255,.06)",
        border: "1px solid rgba(255,255,255,.08)",
        color: "var(--chalk-200)",
        borderRadius: 9,
        padding: "7px 9px",
        fontSize: 10,
        fontWeight: 700,
      }}
    >
      {text}
    </span>
  );
}

function StatCard({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div
      style={{
        padding: "13px 10px",
        borderRadius: 14,
        background: "var(--pitch-900)",
        border: "1px solid var(--pitch-700)",
      }}
    >
      <div
        style={{
          fontSize: 21,
          fontWeight: 900,
          color: "var(--chalk-100)",
        }}
      >
        {value}
      </div>

      <div
        style={{
          color: "var(--chalk-400)",
          fontSize: 10,
          marginTop: 2,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function Rule({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div
      style={{
        padding: 10,
        borderRadius: 10,
        background: "rgba(255,255,255,.045)",
      }}
    >
      <div
        style={{
          color: "var(--chalk-500)",
          fontSize: 9,
          textTransform: "uppercase",
          letterSpacing: 0.7,
          fontWeight: 800,
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "var(--chalk-200)",
          fontSize: 11,
          fontWeight: 700,
          marginTop: 4,
        }}
      >
        {value ?? "Not set"}
      </div>
    </div>
  );
}

function FinanceMetric({
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
        padding: 10,
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
          color:
            positive === undefined
              ? "var(--chalk-100)"
              : positive
              ? "var(--ok-500)"
              : "var(--danger-500)",
          fontSize: 14,
          fontWeight: 900,
          marginTop: 4,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function OperationLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      style={{
        padding: 12,
        borderRadius: 12,
        background: "rgba(255,255,255,.045)",
        border: "1px solid rgba(255,255,255,.06)",
      }}
    >
      <div style={{ fontSize: 20 }}>{icon}</div>

      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          marginTop: 7,
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: "var(--chalk-400)",
          fontSize: 10,
          marginTop: 3,
        }}
      >
        {description}
      </div>
    </Link>
  );
}

function ActionRow({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: 12,
        borderRadius: 12,
        background: "rgba(255,255,255,.045)",
        border: "1px solid rgba(255,255,255,.06)",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          display: "grid",
          placeItems: "center",
          background: "rgba(255,190,50,.09)",
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {title}
        </div>

        <div
          style={{
            color: "var(--chalk-400)",
            fontSize: 10,
            marginTop: 3,
          }}
        >
          {description}
        </div>
      </div>

      <span
        style={{
          marginLeft: "auto",
          color: "var(--chalk-500)",
          fontSize: 15,
        }}
      >
        →
      </span>
    </Link>
  );
}

function EmptyInline({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: "18px 8px 5px",
        color: "var(--chalk-400)",
        fontSize: 12,
      }}
    >
      {text}
    </div>
  );
}

/* ---------- STYLES ---------- */

const card: React.CSSProperties = {
  background: "var(--pitch-900)",
  border: "1px solid var(--pitch-700)",
  borderRadius: 17,
  padding: 16,
  marginBottom: 13,
};

const highlightCard: React.CSSProperties = {
  background:
    "linear-gradient(145deg, rgba(218,174,75,.12), var(--pitch-900))",
  border: "1px solid rgba(218,174,75,.25)",
  borderRadius: 17,
  padding: 17,
  marginBottom: 13,
};

const emptyPage: React.CSSProperties = {
  textAlign: "center",
  padding: "60px 20px",
};

const heading: React.CSSProperties = {
  fontSize: 18,
  margin: "4px 0 0",
};

const kicker: React.CSSProperties = {
  color: "var(--gold)",
  fontSize: 9,
  fontWeight: 900,
  letterSpacing: 1.4,
};

const sectionHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
};

const primaryButton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 13px",
  borderRadius: 10,
  background: "var(--ball-500)",
  color: "#fff",
  fontSize: 11,
  fontWeight: 900,
};

const secondaryButton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 13px",
  borderRadius: 10,
  background: "rgba(255,255,255,.07)",
  border: "1px solid rgba(255,255,255,.12)",
  color: "var(--chalk-100)",
  fontSize: 11,
  fontWeight: 800,
};

const tinyLink: React.CSSProperties = {
  color: "var(--gold)",
  fontSize: 10,
  fontWeight: 800,
};

const privateBadge: React.CSSProperties = {
  background: "rgba(255,255,255,.06)",
  color: "var(--chalk-400)",
  padding: "5px 8px",
  borderRadius: 999,
  fontSize: 8,
  fontWeight: 900,
  letterSpacing: 0.7,
};

const teamAvatar: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 10,
  display: "grid",
  placeItems: "center",
  background: "rgba(255,190,50,.08)",
  fontSize: 16,
};
