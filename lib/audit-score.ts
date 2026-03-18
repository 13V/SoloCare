import { createClient } from "@/lib/supabase/server";

export interface AuditCategory {
  label: string;
  earned: number;
  possible: number;
  actions: string[];
}

export interface AuditScoreResult {
  score: number;
  band: "Audit Ready" | "On Track" | "Needs Attention" | "At Risk";
  bandColour: "green" | "blue" | "amber" | "red";
  categories: AuditCategory[];
}

export async function calculateAuditScore(userId: string): Promise<AuditScoreResult> {
  const supabase = await createClient();

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    { data: policies },
    { data: vaultDocs },
    { data: incidents },
    { data: recentNotes },
    { data: activeParticipants },
    { data: notesByParticipant },
    { data: agreements },
    { data: workerDocs },
  ] = await Promise.all([
    supabase
      .from("policies")
      .select("id")
      .eq("user_id", userId)
      .limit(100),
    supabase
      .from("vault_documents")
      .select("id, expiry_date")
      .eq("user_id", userId)
      .limit(100),
    supabase
      .from("incidents")
      .select("id, follow_up_actions")
      .eq("user_id", userId)
      .limit(500),
    supabase
      .from("progress_notes")
      .select("id, participant_id, session_date")
      .eq("user_id", userId)
      .gte("session_date", thirtyDaysAgo.toISOString().slice(0, 10))
      .limit(500),
    supabase
      .from("participants")
      .select("id")
      .eq("user_id", userId)
      .eq("active", true)
      .limit(200),
    supabase
      .from("progress_notes")
      .select("participant_id, session_date")
      .eq("user_id", userId)
      .gte("session_date", fourteenDaysAgo.toISOString().slice(0, 10))
      .limit(500),
    supabase
      .from("service_agreements")
      .select("id")
      .eq("user_id", userId)
      .limit(10),
    supabase
      .from("worker_documents")
      .select("id, expiry_date, status, document_type")
      .eq("user_id", userId)
      .limit(100),
  ]);

  const policyCount = policies?.length ?? 0;
  const docCount = vaultDocs?.length ?? 0;
  const incidentCount = incidents?.length ?? 0;

  // ─── Policies (25 pts) ───────────────────────────────────────
  let policiesEarned = 0;
  const policiesActions: string[] = [];
  if (policyCount >= 10) {
    policiesEarned = 25;
  } else if (policyCount >= 5) {
    policiesEarned = 10;
    policiesActions.push(`Generate ${10 - policyCount} more ${10 - policyCount === 1 ? "policy" : "policies"} to earn full points`);
  } else if (policyCount >= 1) {
    policiesEarned = 5;
    policiesActions.push(`Generate ${5 - policyCount} more ${5 - policyCount === 1 ? "policy" : "policies"} to earn more points`);
  } else {
    policiesActions.push("Generate at least 1 policy to start earning points");
  }

  // ─── Documents / Vault (20 pts) ──────────────────────────────
  let docsEarned = 0;
  const docsActions: string[] = [];

  if (docCount >= 1) {
    docsEarned = 5;

    const expiredDocs = vaultDocs?.filter((d) => d.expiry_date && new Date(d.expiry_date) < now) ?? [];
    const expiringSoonDocs = vaultDocs?.filter(
      (d) =>
        d.expiry_date &&
        new Date(d.expiry_date) >= now &&
        new Date(d.expiry_date) <= thirtyDaysFromNow
    ) ?? [];

    if (expiredDocs.length === 0 && expiringSoonDocs.length === 0) {
      docsEarned = 20;
    } else if (expiredDocs.length === 0) {
      docsEarned = 10;
      docsActions.push(`${expiringSoonDocs.length} document${expiringSoonDocs.length > 1 ? "s" : ""} expiring soon — update ${expiringSoonDocs.length > 1 ? "them" : "it"} in the Vault`);
    } else {
      docsActions.push(`${expiredDocs.length} expired document${expiredDocs.length > 1 ? "s" : ""} — renew ${expiredDocs.length > 1 ? "them" : "it"} in the Vault`);
      if (expiringSoonDocs.length > 0) {
        docsActions.push(`${expiringSoonDocs.length} document${expiringSoonDocs.length > 1 ? "s" : ""} expiring within 30 days`);
      }
    }
  } else {
    docsActions.push("Upload at least 1 document to your Compliance Vault");
  }

  // ─── Incidents (20 pts) ──────────────────────────────────────
  let incidentsEarned = 0;
  const incidentsActions: string[] = [];

  if (incidentCount >= 1) {
    incidentsEarned = 10;
    const withoutFollowUp = incidents?.filter(
      (i) => !i.follow_up_actions || (i.follow_up_actions as string).trim() === ""
    ) ?? [];
    if (withoutFollowUp.length === 0) {
      incidentsEarned = 20;
    } else {
      incidentsActions.push(`${withoutFollowUp.length} incident${withoutFollowUp.length > 1 ? "s" : ""} missing follow-up actions — complete them in Incidents`);
    }
  } else {
    incidentsActions.push("Log at least 1 incident to demonstrate you know the reporting process");
  }

  // ─── Progress Notes (20 pts) ─────────────────────────────────
  let notesEarned = 0;
  const notesActions: string[] = [];

  const hasRecentNote = (recentNotes?.length ?? 0) > 0;
  if (hasRecentNote) {
    notesEarned = 10;

    const activeIds = new Set((activeParticipants ?? []).map((p) => p.id));
    const recentNoteParticipantIds = new Set((notesByParticipant ?? []).map((n) => n.participant_id));
    const missingParticipants = [...activeIds].filter((id) => !recentNoteParticipantIds.has(id));

    if (activeIds.size > 0 && missingParticipants.length === 0) {
      notesEarned = 20;
    } else if (activeIds.size > 0) {
      notesActions.push(
        `${missingParticipants.length} active participant${missingParticipants.length > 1 ? "s" : ""} have no notes in the last 14 days`
      );
    } else {
      notesEarned = 20;
    }
  } else {
    notesActions.push("Add at least 1 progress note in the last 30 days");
  }

  // ─── Service Agreements (15 pts) ─────────────────────────────
  let agreementsEarned = 0;
  const agreementsActions: string[] = [];

  if ((agreements?.length ?? 0) >= 1) {
    agreementsEarned = 15;
  } else {
    agreementsActions.push("Generate a service agreement for at least 1 participant");
  }

  // ─── Worker Credentials (20 pts) ─────────────────────────────
  let credentialsEarned = 0;
  const credentialsActions: string[] = [];

  const workerDocCount = workerDocs?.length ?? 0;
  if (workerDocCount >= 1) {
    const expiredCreds = workerDocs?.filter(
      (d) => d.expiry_date && new Date(d.expiry_date) < now
    ) ?? [];
    const expiringSoonCreds = workerDocs?.filter(
      (d) =>
        d.expiry_date &&
        new Date(d.expiry_date) >= now &&
        new Date(d.expiry_date) <= thirtyDaysFromNow
    ) ?? [];

    if (expiredCreds.length === 0 && expiringSoonCreds.length === 0) {
      credentialsEarned = 20;
    } else if (expiredCreds.length === 0) {
      credentialsEarned = 10;
      credentialsActions.push(
        `${expiringSoonCreds.length} credential${expiringSoonCreds.length > 1 ? "s" : ""} expiring within 30 days — renew ${expiringSoonCreds.length > 1 ? "them" : "it"} in My Compliance`
      );
    } else {
      credentialsEarned = 5;
      credentialsActions.push(
        `${expiredCreds.length} credential${expiredCreds.length > 1 ? "s" : ""} expired — renew ${expiredCreds.length > 1 ? "them" : "it"} in My Compliance`
      );
      if (expiringSoonCreds.length > 0) {
        credentialsActions.push(
          `${expiringSoonCreds.length} credential${expiringSoonCreds.length > 1 ? "s" : ""} expiring within 30 days`
        );
      }
    }
  } else {
    credentialsActions.push(
      "Add your credentials to My Compliance — police check, WWCC, first aid, and insurance are required for NDIS work"
    );
  }

  // ─── Total ───────────────────────────────────────────────────
  const total = policiesEarned + docsEarned + incidentsEarned + notesEarned + agreementsEarned + credentialsEarned;
  const possible = 25 + 20 + 20 + 20 + 15 + 20;
  const score = Math.round((total / possible) * 100);

  let band: AuditScoreResult["band"];
  let bandColour: AuditScoreResult["bandColour"];
  if (score >= 90) {
    band = "Audit Ready";
    bandColour = "green";
  } else if (score >= 70) {
    band = "On Track";
    bandColour = "blue";
  } else if (score >= 50) {
    band = "Needs Attention";
    bandColour = "amber";
  } else {
    band = "At Risk";
    bandColour = "red";
  }

  return {
    score,
    band,
    bandColour,
    categories: [
      { label: "Policies", earned: policiesEarned, possible: 25, actions: policiesActions },
      { label: "Compliance Vault", earned: docsEarned, possible: 20, actions: docsActions },
      { label: "Worker Credentials", earned: credentialsEarned, possible: 20, actions: credentialsActions },
      { label: "Incidents", earned: incidentsEarned, possible: 20, actions: incidentsActions },
      { label: "Progress Notes", earned: notesEarned, possible: 20, actions: notesActions },
      { label: "Service Agreements", earned: agreementsEarned, possible: 15, actions: agreementsActions },
    ],
  };
}
