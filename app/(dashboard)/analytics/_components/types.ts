/** `GET /v1/admin/analytics/funnel` (incacook-server): Google Analytics 4, consenting users only. */
export interface AnalyticsStep {
  event: string;
  label: string;
  /** Every time the event fired: for trial_request and subscription_purchase that includes failures. */
  events: number;
  /** The successful part of `events`; null when it is not an event with an outcome or the result dimension is not available yet. */
  succeededEvents: number | null;
  users: number;
  conversionFromPrevious: number | null;
  conversionFromFirst: number | null;
}

export interface AnalyticsDaily {
  /** YYYY-MM-DD */
  date: string;
  signUp: number;
  trialRequest: number;
  subscriptionPurchase: number;
}

export interface AnalyticsBreakdown {
  event: string;
  parameter: string;
  label: string;
  values: Array<{ value: string; events: number }>;
}

export interface AnalyticsFunnel {
  configured: boolean;
  windowDays: number;
  generatedAt: string;
  consentedOnly: true;
  steps: AnalyticsStep[];
  daily: AnalyticsDaily[];
  /** Null while Google has not made the custom dimensions available yet. */
  breakdowns: AnalyticsBreakdown[] | null;
}

export const WINDOWS = [7, 30, 90] as const;
export type AnalyticsWindow = (typeof WINDOWS)[number];
