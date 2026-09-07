import { createClient } from "../../../../lib/supabase/server";
import { ChallengeActionButtons } from "./challenge-actions";
import { ReportNoShowForm, NoShowReportCard } from "./noshow-widgets";
import { RequestReplacementButton, CandidateList, ReplacementOfferResponse } from "./replacement-widgets";

const statusColor: Record<string, string> = {
  open: "var(--warn-500)",
  accepted: "var(--ok-500)",
  declined: "var(--danger-500)",
  confirmed: "var(--ok-500)",
  completed: "var(--chalk-300)",
  cancelled: "var(--danger-500)",
};

export default async function ChallengeDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: challenge } = await supabase
    .from("challenges")
    .select(
      "id, challenge_type, scheduled_at, status, notes, opponent_type, challenger_id, opponent_user_id, challenger_team:challenger_team_id(id, name, captain_id, vice_captain_id), opponent_team:opponent_team_id(id, name, captain_id, vice_captain_id)"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!challenge) {
    return <p style={{ color: "var(--chalk-300)" }}>Challenge not found.</p>;
  }

  const userIds = [challenge.challenger_id, challenge.opponent_user_id].filter(Boolean) as string[];
  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
      : { data: [] as any[] };
  const nameById = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));

  const isChallenger =
    challenge.challenger_id === user?.id ||
    (challenge as any).challenger_team?.captain_id === user?.id;
  const isOpponent =
    challenge.opponent_user_id === user?.id ||
    (challenge as any).opponent_team?.captain_id === user?.id;

  const canRespond = isOpponent && challenge.status === "open";
  const canConfirm = isChallenger && challenge.status === "accepted";
  const canCancel = (isChallenger || isOpponent) && ["open", "accepted", "confirmed"].includes(challenge.status);

  const { data: noShowReports } = await supabase
    .from("challenge_no_show_reports")
    .select("id, claim, status, accused_subject_type, accused_subject_id")
    .eq("challenge_id", params.id)
    .order("created_at", { ascending: false });

  const activeReport = (noShowReports || [])[0] || null;

  let isAccused = false;
  if (activeReport) {
    if (activeReport.accused_subject_type === "player") {
      isAccused = activeReport.accused_subject_id === user?.id;
    } else {
      const accusedTeam =
        (challenge as any).challenger_team?.id === activeReport.accused_subject_id
          ? (challenge as any).challenger_team
          : (challenge as any).opponent_team;
      isAccused =
        accusedTeam?.captain_id === user?.id || accusedTeam?.vice_captain_id === user?.id;
    }
  }

  const isPast = challenge.scheduled_at ? new Date(challenge.scheduled_at) < new Date() : false;
  const canReportNoShow =
    (isChallenger || isOpponent) &&
    isPast &&
    ["accepted", "confirmed"].includes(challenge.status) &&
    !activeReport;

  // Replacement flow only applies to individual player-vs-player challenges.
  const isPlayerChallenge = challenge.opponent_type === "player";
  const isFuture = challenge.scheduled_at ? new Date(challenge.scheduled_at) > new Date() : true;
  const canRequestReplacement =
    isPlayerChallenge &&
    isFuture &&
    ["accepted", "confirmed"].includes(challenge.status) &&
    (challenge.challenger_id === user?.id || challenge.opponent_user_id === user?.id);
  const myVacatedRole: "challenger" | "opponent" =
    challenge.challenger_id === user?.id ? "challenger" : "opponent";

  const { data: replacementRequests } = isPlayerChallenge
    ? await supabase
        .from("challenge_replacement_requests")
        .select("id, vacated_role, status, requested_by")
        .eq("challenge_id", params.id)
        .order("created_at", { ascending: false })
    : { data: [] as any[] };

  const openRequest = (replacementRequests || []).find((r: any) => r.status === "open");
  const isMyOpenRequest = openRequest && openRequest.requested_by === user?.id;

  const { data: candidates } =
    isMyOpenRequest
      ? await supabase.rpc("find_replacement_candidates", { p_request_id: openRequest.id })
      : { data: [] as any[] };

  const { data: myPendingOffer } = openRequest
    ? await supabase
        .from("challenge_replacement_offers")
        .select("id")
        .eq("request_id", openRequest.id)
        .eq("candidate_id", user?.id || "")
        .eq("status", "pending")
        .maybeSingle()
    : { data: null };

  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <h1 style={{ fontSize: 22, marginBottom: 2 }}>{challenge.challenge_type}</h1>
        <span style={{ fontSize: 12, color: statusColor[challenge.status], fontWeight: 700, textTransform: "capitalize" }}>
          {challenge.status}
        </span>
      </div>

      <div style={{ fontSize: 14, color: "var(--chalk-300)", marginTop: 8 }}>
        {(challenge as any).challenger_team?.name || nameById.get(challenge.challenger_id) || "Challenger"}
        {"  vs  "}
        {challenge.opponent_type === "team"
          ? (challenge as any).opponent_team?.name
          : nameById.get(challenge.opponent_user_id) || "Opponent"}
      </div>

      {challenge.scheduled_at && (
        <div style={{ fontSize: 13, color: "var(--chalk-300)", marginTop: 8 }}>
          {new Date(challenge.scheduled_at).toLocaleString()}
        </div>
      )}

      {challenge.notes && <p style={{ fontSize: 14, color: "var(--chalk-300)", marginTop: 12 }}>{challenge.notes}</p>}

      <ChallengeActionButtons
        challengeId={challenge.id}
        canRespond={canRespond}
        canConfirm={canConfirm}
        canCancel={canCancel}
      />

      {activeReport && (
        <NoShowReportCard
          challengeId={challenge.id}
          reportId={activeReport.id}
          claim={activeReport.claim}
          status={activeReport.status}
          isAccused={isAccused}
        />
      )}

      {canReportNoShow && <ReportNoShowForm challengeId={challenge.id} />}

      {myPendingOffer && (
        <ReplacementOfferResponse challengeId={challenge.id} offerId={myPendingOffer.id} />
      )}

      {canRequestReplacement && !openRequest && (
        <RequestReplacementButton challengeId={challenge.id} vacatedRole={myVacatedRole} />
      )}

      {isMyOpenRequest && (
        <div
          style={{
            background: "var(--pitch-900)",
            border: "1px solid var(--pitch-700)",
            borderRadius: 12,
            padding: 14,
            marginTop: 16,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700 }}>Finding a replacement</div>
          <CandidateList
            challengeId={challenge.id}
            requestId={openRequest.id}
            candidates={candidates || []}
          />
        </div>
      )}
    </div>
  );
}
