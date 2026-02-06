export interface ClientRecord {
  id: string;
  name: string;
  contact_name: string | null;
  email: string;
  phone: string | null;
  status: string;
  business_type: string | null;
  timezone: string | null;
  billing_plan: string | null;
  rate_per_minute: number | null;
  monthly_allowance: number | null;
  overage_rate: number | null;
  trial_end_date: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ClientFormData {
  // Step 1
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  business_type: string;
  timezone: string;
  status: string;
  // Step 2
  billing_plan: string;
  rate_per_minute: string;
  monthly_allowance: string;
  overage_rate: string;
  has_trial: boolean;
  trial_end_date: string;
}

export const EMPTY_CLIENT_FORM: ClientFormData = {
  name: "",
  contact_name: "",
  email: "",
  phone: "",
  business_type: "",
  timezone: "Asia/Kolkata",
  status: "active",
  billing_plan: "payg",
  rate_per_minute: "2.5",
  monthly_allowance: "0",
  overage_rate: "3.0",
  has_trial: false,
  trial_end_date: "",
};

export const BUSINESS_TYPES = [
  "Dental",
  "Real Estate",
  "Sales",
  "Support",
  "Healthcare",
  "Education",
  "Custom",
];

export const TIMEZONES = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export const STATUS_COLOR: Record<string, string> = {
  active:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  inactive: "bg-muted text-muted-foreground border-border",
  trial:
    "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20",
  suspended: "bg-destructive/15 text-destructive border-destructive/20",
};

export const PLAN_LABEL: Record<string, string> = {
  payg: "Pay As You Go",
  monthly_500: "Monthly 500",
  monthly_1000: "Monthly 1000",
  enterprise: "Enterprise",
};
