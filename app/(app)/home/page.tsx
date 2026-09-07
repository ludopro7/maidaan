import Link from "next/link";
import { createClient } from "../../../lib/supabase/server";

type MatchRow = {
  id: string;
  scheduled_at: string | null;
  team_a: { name: string } | { name: string }[] | null;
  team_b: { name: string } | { name: string }[] | null;
  status?: string | null;
};

type ChallengeRow = {
  id: string;
  title: string | null;
  status: string | null;
  scheduled_at: string | null;
  challenge_type?: string | null;
};

function getTeamName(
  team: { name: string } | { name: string }[] | null
) {
  if (Array.isArray(team)) {
    return team[0]?.name ?? "TBD";
  }

  return team?.name ?? "TBD";
}

function formatDate(date: string | null) {
  if (!date) return "Date TBC";

  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusClass(status: string | null | undefined) {
  const value = (status || "").toLowerCase();

  if (
    value.includes("ready") ||
    value.includes("confirmed") ||
    value.includes("live")
  ) {
    return {
      background: "rgba(20, 170, 105, 0.14)",
      color: "#49d99b",
    };
  }

  if (
    value.includes("pending") ||
    value.includes("await")
  ) {
    return {
      background: "rgba(214, 168, 64, 0.14)",
      color: "#d9b65b",
    };
  }

  return {
    background: "rgba(255,255,255,0.08)",
    color: "var(--chalk-300)",
  };
}

const cardStyle: React.CSSProperties = {
  display: "block",
  background: "var(--pitch-900)",
  border: "1px solid var(--pitch-700)",
  borderRadius: 16,
  padding: 16,
  marginBottom: 12,
  textDecoration: "none",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.14em",
  color: "var(--gold)",
  textTransform: "uppercase",
};

export default async function HomePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  /*
   * ---------------------------------------------------------
   * PROFILE
   * ---------------------------------------------------------
   */

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  /*
   * ---------------------------------------------------------
   * PLAYER
   * ---------------------------------------------------------
   */

  const { data: player } = await supabase
    .from("players")
    .select(`
      id,
      batting_hand,
      bowling_style,
      playing_role,
      preferred_format,
      experience_years,
      reliability_score,
      matches_completed,
      challenges_completed,
      no_shows,
      late_cancels,
      verification_status
    `)
    .eq("user_id", user.id)
    .maybeSingle();

  /*
   * ---------------------------------------------------------
   * TEAMS
   * ---------------------------------------------------------
   */

  const { data: captainTeams } = await supabase
    .from("teams")
    .select("id, name, city")
    .eq("captain_id", user.id)
    .order("created_at", { ascending: false });

  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id);

  const teamIds = [
    ...(captainTeams || []).map((team) => team.id),
    ...(memberships || []).map((membership) => membership.team_id),
  ];

  const uniqueTeamIds = [...new Set(teamIds)];

  /*
   * ---------------------------------------------------------
   * NEXT MATCH
   * ---------------------------------------------------------
   */

  let nextMatch: MatchRow | null = null;

  if (uniqueTeamIds.length > 0) {
    const teamFilter = uniqueTeamIds.join(",");

    const { data } = await supabase
      .from("matches")
      .select(`
        id,
        scheduled_at,
        status,
        team_a:team_a_id(name),
        team_b:team_b_id(name)
      `)
      .or(
        `team_a_id.in.(${teamFilter}),team_b_id.in.(${teamFilter})`
      )
      .not("scheduled_at", "is", null)
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    nextMatch = data as MatchRow | null;
  }

  /*
   * ---------------------------------------------------------
   * OPEN TOURNAMENTS
   * ---------------------------------------------------------
   */

  const { data: openTournaments } = await supabase
    .from("tournaments")
    .select(`
      id,
      name,
      city,
      format,
      status,
      start_date,
      registration_deadline
    `)
    .in("status", ["published", "registration_open"])
    .order("start_date", { ascending: true })
    .limit(5);

  /*
   * ---------------------------------------------------------
   * OPEN CHALLENGES
   * ---------------------------------------------------------
   */

  const { data: challenges } = await supabase
    .from("challenges")
    .select(`
      id,
      title,
      status,
      scheduled_at
    `)
    .or(
      `challenger_id.eq.${user.id},opponent_id.eq.${user.id}`
    )
    .in("status", [
      "sent",
      "accepted",
      "confirmed",
      "ground_pending",
      "official_pending",
      "ready",
    ])
    .order("scheduled_at", { ascending: true })
    .limit(3);

  /*
   * ---------------------------------------------------------
   * PLAYER NEEDED / REPLACEMENT
   *
   * This uses challenges as the first live signal.
   * Later we will add a dedicated replacement feed.
   * ---------------------------------------------------------
   */

  const playerNeeded =
    challenges && challenges.length > 0
      ? challenges.find(
          (challenge) =>
            challenge.status === "ground_pending" ||
            challenge.status === "official_pending"
        )
      : null;

  /*
   * ---------------------------------------------------------
   * COUNTS
   * ---------------------------------------------------------
   */

  const { count: tournamentCount } = await supabase
    .from("tournaments")
    .select("id", {
      count: "exact",
      head: true,
    })
    .in("status", ["published", "registration_open"]);

  const { count: challengeCount } = await supabase
    .from("challenges")
    .select("id", {
      count: "exact",
      head: true,
    })
    .or(
      `challenger_id.eq.${user.id},opponent_id.eq.${user.id}`
    )
    .in("status", [
      "sent",
      "accepted",
      "confirmed",
      "ground_pending",
      "official_pending",
      "ready",
    ]);

  const reliability = player?.reliability_score ?? null;

  const displayName =
    profile?.full_name?.split(" ")[0] || "Cricketer";

  const role =
    player?.playing_role || "Player";

  const batting =
    player?.batting_hand || "Not set";

  const bowling =
    player?.bowling_style || "Not set";

  /*
   * ---------------------------------------------------------
   * UI
   * ---------------------------------------------------------
   */

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        paddingBottom: 90,
      }}
    >
      {/* HERO */}

      <section
        style={{
          padding: "8px 0 22px",
        }}
      >
        <div style={eyebrowStyle}>MAIDAAN</div>

        <h1
          style={{
            fontSize: 30,
            lineHeight: 1.08,
            margin: "7px 0 7px",
            letterSpacing: "-0.03em",
          }}
        >
          Hey, {displayName}
        </h1>

        <p
          style={{
            margin: 0,
            color: "var(--chalk-300)",
            fontSize: 14,
          }}
        >
          Your cricket. Your people. Your Maidaan.
        </p>
      </section>

      {/* QUICK ACTIONS */}

      <section style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <Link
            href="/tournaments"
            style={{
              ...cardStyle,
              marginBottom: 0,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 24 }}>🏆</div>
            <strong
              style={{
                display: "block",
                marginTop: 7,
              }}
            >
              Tournaments
            </strong>
            <span
              style={{
                display: "block",
                marginTop: 3,
                color: "var(--chalk-300)",
                fontSize: 11,
              }}
            >
              {tournamentCount ?? 0} open
            </span>
          </Link>

          <Link
            href="/challenges"
            style={{
              ...cardStyle,
              marginBottom: 0,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 24 }}>⚔️</div>
            <strong
              style={{
                display: "block",
                marginTop: 7,
              }}
            >
              Challenges
            </strong>
            <span
              style={{
                display: "block",
                marginTop: 3,
                color: "var(--chalk-300)",
                fontSize: 11,
              }}
            >
              {challengeCount ?? 0} active
            </span>
          </Link>

          <Link
            href="/grounds"
            style={{
              ...cardStyle,
              marginBottom: 0,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 24 }}>🏟️</div>
            <strong
              style={{
                display: "block",
                marginTop: 7,
              }}
            >
              Grounds
            </strong>
            <span
              style={{
                display: "block",
                marginTop: 3,
                color: "var(--chalk-300)",
                fontSize: 11,
              }}
            >
              Find & book
            </span>
          </Link>

          <Link
            href="/officials"
            style={{
              ...cardStyle,
              marginBottom: 0,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 24 }}>🧑‍⚖️</div>
            <strong
              style={{
                display: "block",
                marginTop: 7,
              }}
            >
              Officials
            </strong>
            <span
              style={{
                display: "block",
                marginTop: 3,
                color: "var(--chalk-300)",
                fontSize: 11,
              }}
            >
              Umpires & scorers
            </span>
          </Link>
        </div>
      </section>

      {/* NEXT MATCH */}

      {nextMatch ? (
        <section style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 9,
            }}
          >
            <div style={eyebrowStyle}>NEXT UP</div>

            <Link
              href={`/matches/${nextMatch.id}`}
              style={{
                color: "var(--gold)",
                fontSize: 12,
                textDecoration: "none",
              }}
            >
              View match →
            </Link>
          </div>

          <Link
            href={`/matches/${nextMatch.id}`}
            style={{
              ...cardStyle,
              marginBottom: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--chalk-300)",
                    marginBottom: 5,
                  }}
                >
                  {formatDate(nextMatch.scheduled_at)}
                </div>

                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                  }}
                >
                  {getTeamName(nextMatch.team_a)}
                </div>

                <div
                  style={{
                    color: "var(--gold)",
                    fontSize: 11,
                    fontWeight: 800,
                    margin: "3px 0",
                  }}
                >
                  VS
                </div>

                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                  }}
                >
                  {getTeamName(nextMatch.team_b)}
                </div>
              </div>

              <span
                style={{
                  ...statusClass(nextMatch.status),
                  borderRadius: 999,
                  padding: "5px 9px",
                  fontSize: 9,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                  textTransform: "uppercase",
                }}
              >
                {nextMatch.status || "Scheduled"}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: 8,
                marginTop: 15,
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.035)",
                  borderRadius: 10,
                  padding: 10,
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontSize: 8,
                    color: "var(--chalk-400)",
                    textTransform: "uppercase",
                  }}
                >
                  Match
                </span>
                <strong style={{ fontSize: 12 }}>
                  View details
                </strong>
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.035)",
                  borderRadius: 10,
                  padding: 10,
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontSize: 8,
                    color: "var(--chalk-400)",
                    textTransform: "uppercase",
                  }}
                >
                  Operations
                </span>
                <strong style={{ fontSize: 12 }}>
                  Check readiness
                </strong>
              </div>
            </div>
          </Link>
        </section>
      ) : (
        <section style={{ marginBottom: 24 }}>
          <div style={eyebrowStyle}>NEXT UP</div>

          <div
            style={{
              ...cardStyle,
              marginTop: 9,
              textAlign: "center",
              padding: 24,
            }}
          >
            <div style={{ fontSize: 30 }}>🏏</div>

            <h2
              style={{
                fontSize: 17,
                margin: "9px 0 5px",
              }}
            >
              Your next match starts here.
            </h2>

            <p
              style={{
                margin: "0 auto 14px",
                color: "var(--chalk-300)",
                fontSize: 12,
                maxWidth: 300,
              }}
            >
              Join a tournament, create a team or find
              your next cricket challenge.
            </p>

            <Link
              href="/tournaments"
              style={{
                display: "inline-block",
                background: "var(--gold)",
                color: "#10150f",
                borderRadius: 10,
                padding: "10px 15px",
                fontSize: 12,
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              Find cricket
            </Link>
          </div>
        </section>
      )}

      {/* OPEN CHALLENGES */}

      <section style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 9,
          }}
        >
          <div style={eyebrowStyle}>OPEN CHALLENGES</div>

          <Link
            href="/challenges"
            style={{
              color: "var(--gold)",
              fontSize: 12,
              textDecoration: "none",
            }}
          >
            See all →
          </Link>
        </div>

        {challenges && challenges.length > 0 ? (
          challenges.map((challenge: ChallengeRow) => (
            <Link
              key={challenge.id}
              href={`/challenges/${challenge.id}`}
              style={cardStyle}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    ...statusClass(challenge.status),
                    borderRadius: 999,
                    padding: "5px 8px",
                    fontSize: 8,
                    fontWeight: 800,
                    textTransform: "uppercase",
                  }}
                >
                  {challenge.status || "Challenge"}
                </span>

                <span
                  style={{
                    color: "var(--chalk-400)",
                    fontSize: 10,
                  }}
                >
                  {formatDate(challenge.scheduled_at)}
                </span>
              </div>

              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  marginTop: 9,
                }}
              >
                {challenge.title || "Cricket Challenge"}
              </div>

              <div
                style={{
                  color: "var(--chalk-300)",
                  fontSize: 11,
                  marginTop: 4,
                }}
              >
                Open challenge · Commitment tracked by Maidaan Trust
              </div>
            </Link>
          ))
        ) : (
          <div
            style={{
              ...cardStyle,
              color: "var(--chalk-300)",
              fontSize: 12,
            }}
          >
            No active challenges yet.
          </div>
        )}
      </section>

      {/* PLAYER NEEDED */}

      {playerNeeded && (
        <section style={{ marginBottom: 24 }}>
          <div style={eyebrowStyle}>PLAYER NEEDED</div>

          <Link
            href={`/challenges/${playerNeeded.id}`}
            style={{
              ...cardStyle,
              marginTop: 9,
              borderColor: "rgba(214,168,64,0.35)",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 15,
                    margin: 0,
                  }}
                >
                  A cricket slot may need you
                </h2>

                <p
                  style={{
                    color: "var(--chalk-300)",
                    fontSize: 11,
                    margin: "6px 0 0",
                  }}
                >
                  Check the challenge and respond before
                  the slot is filled.
                </p>
              </div>

              <strong
                style={{
                  color: "var(--gold)",
                  fontSize: 12,
                  whiteSpace: "nowrap",
                }}
              >
                JOIN →
              </strong>
            </div>
          </Link>
        </section>
      )}

      {/* MY CRICKET */}

      <section style={{ marginBottom: 24 }}>
        <div style={eyebrowStyle}>MY CRICKET</div>

        <div
          style={{
            ...cardStyle,
            marginTop: 9,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                }}
              >
                {profile?.full_name || "Your profile"}
              </div>

              <div
                style={{
                  color: "var(--chalk-300)",
                  fontSize: 11,
                  marginTop: 3,
                }}
              >
                {role} · {batting}
              </div>
            </div>

            {reliability !== null && (
              <div
                style={{
                  textAlign: "right",
                }}
              >
                <div
                  style={{
                    color: "var(--gold)",
                    fontSize: 20,
                    fontWeight: 900,
                  }}
                >
                  {reliability}%
                </div>

                <div
                  style={{
                    color: "var(--chalk-400)",
                    fontSize: 8,
                    textTransform: "uppercase",
                  }}
                >
                  Reliable
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: 8,
              marginTop: 14,
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.035)",
                borderRadius: 10,
                padding: 10,
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: 8,
                  color: "var(--chalk-400)",
                }}
              >
                BOWLING
              </span>

              <strong style={{ fontSize: 11 }}>
                {bowling}
              </strong>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.035)",
                borderRadius: 10,
                padding: 10,
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: 8,
                  color: "var(--chalk-400)",
                }}
              >
                MATCHES
              </span>

              <strong style={{ fontSize: 11 }}>
                {player?.matches_completed ?? 0}
              </strong>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.035)",
                borderRadius: 10,
                padding: 10,
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: 8,
                  color: "var(--chalk-400)",
                }}
              >
                CHALLENGES
              </span>

              <strong style={{ fontSize: 11 }}>
                {player?.challenges_completed ?? 0}
              </strong>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.035)",
                borderRadius: 10,
                padding: 10,
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: 8,
                  color: "var(--chalk-400)",
                }}
              >
                NO-SHOWS
              </span>

              <strong style={{ fontSize: 11 }}>
                {player?.no_shows ?? 0}
              </strong>
            </div>
          </div>

          <Link
            href="/profile"
            style={{
              display: "block",
              textAlign: "center",
              marginTop: 12,
              padding: 10,
              borderRadius: 10,
              border: "1px solid var(--pitch-700)",
              color: "var(--chalk-100)",
              fontSize: 11,
              textDecoration: "none",
            }}
          >
            Open my profile →
          </Link>
        </div>
      </section>

      {/* MY TEAMS */}

      <section style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 9,
          }}
        >
          <div style={eyebrowStyle}>MY TEAMS</div>

          <Link
            href="/teams"
            style={{
              color: "var(--gold)",
              fontSize: 12,
              textDecoration: "none",
            }}
          >
            View all →
          </Link>
        </div>

        {captainTeams && captainTeams.length > 0 ? (
          captainTeams.slice(0, 3).map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              style={{
                ...cardStyle,
                padding: 13,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong style={{ fontSize: 13 }}>
                    {team.name}
                  </strong>

                  <div
                    style={{
                      color: "var(--chalk-300)",
                      fontSize: 10,
                      marginTop: 3,
                    }}
                  >
                    {team.city || "City not set"} · Captain
                  </div>
                </div>

                <span
                  style={{
                    color: "var(--gold)",
                    fontSize: 18,
                  }}
                >
                  →
                </span>
              </div>
            </Link>
          ))
        ) : (
          <Link
            href="/teams/new"
            style={{
              ...cardStyle,
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            <div style={{ fontSize: 24 }}>👥</div>

            <strong
              style={{
                display: "block",
                marginTop: 6,
              }}
            >
              Create your team
            </strong>

            <span
              style={{
                display: "block",
                marginTop: 4,
                color: "var(--chalk-300)",
                fontSize: 11,
              }}
            >
              Build your squad and invite players.
            </span>
          </Link>
        )}
      </section>

      {/* TOURNAMENT DISCOVERY */}

      <section style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 9,
          }}
        >
          <div style={eyebrowStyle}>FIND YOUR CRICKET</div>

          <Link
            href="/tournaments"
            style={{
              color: "var(--gold)",
              fontSize: 12,
              textDecoration: "none",
            }}
          >
            Explore →
          </Link>
        </div>

        {openTournaments && openTournaments.length > 0 ? (
          openTournaments.slice(0, 3).map((tournament) => (
            <Link
              key={tournament.id}
              href={`/tournaments/${tournament.id}`}
              style={{
                ...cardStyle,
                padding: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div>
                  <strong style={{ fontSize: 13 }}>
                    {tournament.name}
                  </strong>

                  <div
                    style={{
                      color: "var(--chalk-300)",
                      fontSize: 10,
                      marginTop: 4,
                    }}
                  >
                    {tournament.city || "Location TBC"} ·{" "}
                    {tournament.format || "Cricket"}
                  </div>
                </div>

                <span
                  style={{
                    ...statusClass(tournament.status),
                    borderRadius: 999,
                    padding: "5px 8px",
                    height: "fit-content",
                    fontSize: 8,
                    fontWeight: 800,
                  }}
                >
                  OPEN
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div
            style={{
              ...cardStyle,
              color: "var(--chalk-300)",
              fontSize: 12,
            }}
          >
            No tournaments are open right now.
          </div>
        )}
      </section>

      {/* MAIDAAN COMMERCE */}

      <section style={{ marginBottom: 24 }}>
        <div style={eyebrowStyle}>MAIDAAN COMMERCE</div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: 10,
            marginTop: 9,
          }}
        >
          <Link
            href="/store"
            style={{
              ...cardStyle,
              marginBottom: 0,
              textDecoration: "none",
            }}
          >
            <div style={{ fontSize: 22 }}>🛒</div>

            <strong
              style={{
                display: "block",
                marginTop: 7,
              }}
            >
              Maidaan Store
            </strong>

            <span
              style={{
                display: "block",
                color: "var(--chalk-300)",
                fontSize: 10,
                marginTop: 3,
              }}
            >
              Gear & team kits
            </span>
          </Link>

          <Link
            href="/marketplace"
            style={{
              ...cardStyle,
              marginBottom: 0,
              textDecoration: "none",
            }}
          >
            <div style={{ fontSize: 22 }}>🛍️</div>

            <strong
              style={{
                display: "block",
                marginTop: 7,
              }}
            >
              Marketplace
            </strong>

            <span
              style={{
                display: "block",
                color: "var(--chalk-300)",
                fontSize: 10,
                marginTop: 3,
              }}
            >
              Products & services
            </span>
          </Link>
        </div>

        <Link
          href="/ads"
          style={{
            ...cardStyle,
            marginTop: 10,
            marginBottom: 0,
            textDecoration: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong>📍 Local offers</strong>

              <span
                style={{
                  display: "block",
                  color: "var(--chalk-300)",
                  fontSize: 10,
                  marginTop: 3,
                }}
              >
                Cricket businesses around you
              </span>
            </div>

            <span
              style={{
                color: "var(--gold)",
                fontWeight: 800,
              }}
            >
              →
            </span>
          </div>
        </Link>
      </section>

      {/* ORGANIZE */}

      <section style={{ marginBottom: 24 }}>
        <div style={eyebrowStyle}>BUILD CRICKET</div>

        <div
          style={{
            display: "grid",
            gap: 10,
            marginTop: 9,
          }}
        >
          <Link
            href="/tournaments/new"
            style={{
              ...cardStyle,
              marginBottom: 0,
              textDecoration: "none",
            }}
          >
            <strong>🏆 Start a tournament</strong>

            <span
              style={{
                display: "block",
                color: "var(--chalk-300)",
                fontSize: 10,
                marginTop: 4,
              }}
            >
              Teams, rules, fixtures, grounds, officials
              and finance.
            </span>
          </Link>

          <Link
            href="/teams/new"
            style={{
              ...cardStyle,
              marginBottom: 0,
              textDecoration: "none",
            }}
          >
            <strong>👥 Create a team</strong>

            <span
              style={{
                display: "block",
                color: "var(--chalk-300)",
                fontSize: 10,
                marginTop: 4,
              }}
            >
              Build a roster and invite reliable players.
            </span>
          </Link>

          <Link
            href="/challenges"
            style={{
              ...cardStyle,
              marginBottom: 0,
              textDecoration: "none",
            }}
          >
            <strong>⚔️ Create a challenge</strong>

            <span
              style={{
                display: "block",
                color: "var(--chalk-300)",
                fontSize: 10,
                marginTop: 4,
              }}
            >
              Player or team challenge with commitment
              rules.
            </span>
          </Link>
        </div>
      </section>

      {/* SPONSOR / LOCAL BUSINESS SLOT */}

      <section
        style={{
          marginTop: 26,
          padding: 15,
          borderRadius: 16,
          border: "1px solid rgba(214,168,64,0.25)",
          background:
            "linear-gradient(135deg, rgba(214,168,64,0.09), rgba(255,255,255,0.025))",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 8,
                color: "var(--chalk-400)",
                letterSpacing: "0.12em",
                fontWeight: 800,
              }}
            >
              POWERED BY
            </div>

            <strong
              style={{
                display: "block",
                marginTop: 4,
                fontSize: 13,
              }}
            >
              Local cricket businesses
            </strong>

            <span
              style={{
                display: "block",
                marginTop: 3,
                fontSize: 10,
                color: "var(--chalk-300)",
              }}
            >
              Sponsorship and local offers will appear here.
            </span>
          </div>

          <span
            style={{
              color: "var(--gold)",
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            MAIDAAN
          </span>
        </div>
      </section>
    </div>
  );
}
