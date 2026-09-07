import { createClient } from "../../../../lib/supabase/server";
import { ChallengeForm } from "./challenge-form";

export default async function NewChallengePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: myTeams }, { data: allTeams }] = await Promise.all([
    supabase.from("teams").select("id, name").eq("captain_id", user!.id),
    supabase.from("teams").select("id, name").neq("captain_id", user!.id),
  ]);

  return (
    <div style={{ maxWidth: 480 }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Create a challenge</h1>
      <p style={{ color: "var(--chalk-300)", fontSize: 14, marginBottom: 24 }}>
        Compete and build your record — no money changes hands here.
      </p>
      <ChallengeForm myTeams={myTeams || []} otherTeams={allTeams || []} />
    </div>
  );
}
