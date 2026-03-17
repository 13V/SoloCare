export interface Participant {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string | null;
  ndis_number: string | null;
  date_of_birth: string | null;
  plan_start_date: string | null;
  plan_end_date: string | null;
  funding_type: "self_managed" | "plan_managed" | "agency_managed" | null;
  support_categories: string[] | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
}

export interface ProgressNote {
  id: string;
  user_id: string;
  participant_id: string;
  session_date: string;
  session_start: string | null;
  session_end: string | null;
  support_category: string | null;
  goals_worked: string | null;
  what_happened: string;
  participant_response: string | null;
  follow_up: string | null;
  created_at: string;
  participants?: { first_name: string; last_name: string | null } | null;
}

export interface Shift {
  id: string;
  user_id: string;
  participant_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  support_category: string | null;
  hourly_rate: number | null;
  notes: string | null;
  invoiced: boolean;
  created_at: string;
  participants?: { first_name: string; last_name: string | null } | null;
}

export interface ServiceAgreement {
  id: string;
  user_id: string;
  participant_id: string;
  content: string | null;
  start_date: string | null;
  end_date: string | null;
  generated_at: string;
  last_updated_at: string;
}

export const FUNDING_TYPE_LABELS = {
  self_managed: "Self-Managed",
  plan_managed: "Plan-Managed",
  agency_managed: "Agency-Managed (NDIA)",
};

export const SUPPORT_CATEGORIES = [
  "Daily Activities",
  "Social & Community Participation",
  "Capacity Building",
  "Transport",
  "Improved Living Arrangements",
  "Finding & Keeping a Job",
  "Improved Health & Wellbeing",
  "Improved Learning",
  "Improved Life Choices",
  "Improved Daily Living",
  "Improved Relationships",
];
