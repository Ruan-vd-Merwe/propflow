/**
 * Maps PropTrust's semantic notification names to WhatsApp message templates.
 * Templates are registered and approved in Meta's Business Manager dashboard,
 * not in code — this file only references them by name and documents the
 * exact body text so the dashboard registration and the params[] this code
 * sends stay in sync. Register all of these under category UTILITY (they're
 * transactional, not marketing) for faster approval and lower cost.
 *
 * When registering in Meta: paste bodyText verbatim into the template body
 * field. {{1}}, {{2}}, ... become the positional params sendTemplate expects,
 * in the same order they appear here.
 */
export type NotificationKey =
  | "RENT_REMINDER"
  | "RENT_DUE_TODAY"
  | "RENT_OVERDUE"
  | "LEASE_UPDATE"
  | "MAINTENANCE_UPDATE"
  | "INTRODUCTION"
  | "TENANT_PAID_NOTIFICATION"
  | "SERVICE_BOOKING"
  | "CUSTOM_MESSAGE";

export type TemplateDefinition = {
  /** Exact template name as registered in Meta Business Manager. */
  metaTemplateName: string;
  /** Number of positional {{n}} params the approved template body expects. */
  paramCount: number;
  /** Exact body text to register in Meta's template editor. */
  bodyText: string;
};

export const TEMPLATES: Record<NotificationKey, TemplateDefinition> = {
  RENT_REMINDER: {
    metaTemplateName: "rent_reminder",
    paramCount: 4,
    bodyText:
      "Hi {{1}}, just a reminder that your rent of {{2}} for {{3}} is due on {{4}}. Reply PAID if you've already paid. - PropTrust",
  },
  RENT_DUE_TODAY: {
    metaTemplateName: "rent_due_today",
    paramCount: 4,
    bodyText:
      "Hi {{1}}, your rent of {{2}} for {{3}} is due today ({{4}}). Please pay as soon as possible. Reply PAID once done. - PropTrust",
  },
  RENT_OVERDUE: {
    metaTemplateName: "rent_overdue",
    paramCount: 4,
    bodyText:
      "Hi {{1}}, your rent of {{2}} for {{3}} is now {{4}} overdue. Please pay urgently to avoid further action. - PropTrust",
  },
  LEASE_UPDATE: {
    metaTemplateName: "lease_update",
    paramCount: 3,
    bodyText:
      "Hi {{1}}, there's an update to your lease for {{2}}: {{3}}. - PropTrust",
  },
  MAINTENANCE_UPDATE: {
    metaTemplateName: "maintenance_update",
    paramCount: 3,
    bodyText:
      'Hi {{1}}, your maintenance request "{{2}}" has been updated to: {{3}}. - PropTrust',
  },
  INTRODUCTION: {
    metaTemplateName: "tenant_introduction",
    paramCount: 2,
    bodyText:
      "Hi {{1}}, a landlord is interested in your PropTrust profile for a property in {{2}}. Log in at proptrust.co.za to respond. - PropTrust",
  },
  TENANT_PAID_NOTIFICATION: {
    metaTemplateName: "tenant_paid_notification",
    paramCount: 3,
    bodyText:
      "{{1}} says they have paid rent of {{2}} for {{3}}. Please verify and mark as paid in PropTrust.",
  },
  SERVICE_BOOKING: {
    metaTemplateName: "service_booking_request",
    paramCount: 6,
    bodyText:
      "Hi {{1}}, you have a new booking request via PropTrust. Service: {{2}}. Tenant: {{3}}. Property: {{4}}. Date: {{5}}. Notes: {{6}}. Reply to confirm.",
  },
  // Meta forbids arbitrary free text outside a 24h session window, so the
  // landlord's typed message becomes a single template parameter rather than
  // the message body itself — a common, Meta-legal pattern for "message from
  // business" use cases where the business needs to say something new every
  // time but the surrounding template shape stays fixed.
  CUSTOM_MESSAGE: {
    metaTemplateName: "custom_message",
    paramCount: 1,
    bodyText: "Message from your landlord via PropTrust: {{1}}",
  },
};
