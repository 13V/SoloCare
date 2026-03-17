export interface Profile {
  id: string;
  business_name: string | null;
  abn: string | null;
  contact_name: string | null;
  phone: string | null;
  state: string | null;
  created_at: string;
  onboarding_complete: boolean;
}

export interface VaultDocument {
  id: string;
  user_id: string;
  document_type: "worker_screening" | "police_check" | "first_aid" | "insurance" | "custom";
  document_name: string;
  file_url: string | null;
  expiry_date: string | null;
  // status is computed client-side via getDocumentStatus(), not a DB column
  status?: "valid" | "expiring_soon" | "expired" | "missing";
  uploaded_at: string;
}

export interface Policy {
  id: string;
  user_id: string;
  policy_type: "incident_management" | "complaints" | "risk" | "code_of_conduct";
  content: string;
  generated_at: string;
  last_reviewed_at: string | null;
}

export interface Incident {
  id: string;
  user_id: string;
  participant_first_name: string;
  incident_date: string;
  incident_time: string;
  location: string;
  incident_type: "injury" | "near_miss" | "abuse" | "neglect" | "medication_error" | "other";
  description: string;
  immediate_action: string;
  reported_to_ndis: boolean;
  ndis_report_date: string | null;
  created_at: string;
}

export const POLICY_LABELS: Record<Policy["policy_type"], string> = {
  incident_management: "Incident Management Policy",
  complaints: "Complaints Handling Policy",
  risk: "Risk Management Policy",
  code_of_conduct: "Code of Conduct",
};

export const INCIDENT_TYPE_LABELS: Record<Incident["incident_type"], string> = {
  injury: "Injury",
  near_miss: "Near Miss",
  abuse: "Abuse / Neglect",
  neglect: "Neglect",
  medication_error: "Medication Error",
  other: "Other",
};

export const DOCUMENT_TYPE_LABELS: Record<VaultDocument["document_type"], string> = {
  worker_screening: "Worker Screening Check",
  police_check: "National Police Check",
  first_aid: "First Aid Certificate",
  insurance: "Public Liability Insurance",
  custom: "Custom Document",
};

export const AU_STATES = [
  { value: "NSW", label: "New South Wales" },
  { value: "VIC", label: "Victoria" },
  { value: "QLD", label: "Queensland" },
  { value: "SA", label: "South Australia" },
  { value: "WA", label: "Western Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "ACT", label: "Australian Capital Territory" },
  { value: "NT", label: "Northern Territory" },
];
