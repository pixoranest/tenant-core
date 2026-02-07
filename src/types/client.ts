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
  // Step 1: Basic Info
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  business_type: string;
  timezone: string;
  status: string;

  // Step 2: Agent & Features
  agent_id: string;
  agent_phone: string;
  max_concurrent_calls: number;
  feature_call_recordings: boolean;
  feature_call_transcripts: boolean;
  feature_realtime_monitoring: boolean;
  feature_analytics_dashboard: boolean;
  feature_data_export: boolean;
  feature_api_access: boolean;
  feature_calendar_integration: boolean;
  feature_custom_branding: boolean;

  // Step 3: Billing
  billing_plan: string;
  rate_per_minute: string;
  monthly_allowance: string;
  overage_rate: string;
  auto_recharge: boolean;
  low_balance_threshold: string;
  has_trial: boolean;
  trial_end_date: string;

  // Step 4: Integrations
  integration_google_sheets: boolean;
  google_sheets_url: string;
  integration_google_calendar: boolean;
  google_calendar_id: string;
  integration_cal_com: boolean;
  cal_com_api_key: string;
  integration_webhook: boolean;
  webhook_url: string;

  // Step 5: Notifications & Security
  notif_daily_summary: boolean;
  notif_weekly_report: boolean;
  notif_low_balance: boolean;
  notif_call_failure: boolean;
  notif_sms: boolean;
  notif_webhook: boolean;
  notif_webhook_url: string;
  password_mode: "auto" | "manual";
  manual_password: string;
  manual_password_confirm: string;
  two_factor_enabled: boolean;
  session_timeout: string;
}

export const EMPTY_CLIENT_FORM: ClientFormData = {
  name: "",
  contact_name: "",
  email: "",
  phone: "",
  business_type: "",
  timezone: "Asia/Kolkata",
  status: "active",

  agent_id: "",
  agent_phone: "",
  max_concurrent_calls: 5,
  feature_call_recordings: false,
  feature_call_transcripts: false,
  feature_realtime_monitoring: false,
  feature_analytics_dashboard: false,
  feature_data_export: false,
  feature_api_access: false,
  feature_calendar_integration: false,
  feature_custom_branding: false,

  billing_plan: "payg",
  rate_per_minute: "2.5",
  monthly_allowance: "0",
  overage_rate: "3.0",
  auto_recharge: false,
  low_balance_threshold: "100",
  has_trial: false,
  trial_end_date: "",

  integration_google_sheets: false,
  google_sheets_url: "",
  integration_google_calendar: false,
  google_calendar_id: "",
  integration_cal_com: false,
  cal_com_api_key: "",
  integration_webhook: false,
  webhook_url: "",

  notif_daily_summary: false,
  notif_weekly_report: false,
  notif_low_balance: false,
  notif_call_failure: false,
  notif_sms: false,
  notif_webhook: false,
  notif_webhook_url: "",
  password_mode: "auto",
  manual_password: "",
  manual_password_confirm: "",
  two_factor_enabled: false,
  session_timeout: "30",
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
