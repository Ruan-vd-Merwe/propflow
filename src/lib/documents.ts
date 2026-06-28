export type PropertyDocumentType =
  | "lease_contract"
  | "bank_statement"
  | "inspection_report"
  | "levy_statement"
  | "bond_statement"
  | "rates_account"
  | "body_corporate_minutes"
  | "maintenance_invoice"
  | "insurance_policy"
  | "other";

export const DOCUMENT_TYPE_LABELS: Record<PropertyDocumentType, string> = {
  lease_contract: "Lease Contract",
  bank_statement: "Bank Statement",
  inspection_report: "Inspection Report",
  levy_statement: "Levy Statement",
  bond_statement: "Bond Statement",
  rates_account: "Rates Account",
  body_corporate_minutes: "Body Corporate Minutes",
  maintenance_invoice: "Maintenance Invoice",
  insurance_policy: "Insurance Policy",
  other: "Other",
};

// These types are stored in restricted buckets and never shared.
const SENSITIVE_TYPES: ReadonlySet<PropertyDocumentType> = new Set<PropertyDocumentType>([
  "bank_statement",
  "lease_contract",
  "bond_statement",
]);

export function isSensitiveDocumentType(type: PropertyDocumentType): boolean {
  return SENSITIVE_TYPES.has(type);
}

export function getDocumentBucket(type: PropertyDocumentType): string {
  switch (type) {
    case "bank_statement":
      return "bank-statements";
    case "lease_contract":
      return "lease-contracts";
    case "body_corporate_minutes":
      return "body-corporate-docs";
    default:
      return "property-documents";
  }
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 200);
}

// Uses Web Crypto — safe in browser and Node.js 18+.
export async function calculateSha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
