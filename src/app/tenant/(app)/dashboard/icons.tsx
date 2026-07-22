type IconProps = { className?: string };

const BASE = {
  width: 17,
  height: 17,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
} as const;

export function SearchDotIcon({ className }: IconProps) {
  return (
    <svg className={className} {...BASE} aria-hidden="true">
      <circle cx="10" cy="10" r="6" />
      <path d="m18 18-3.5-3.5" />
      <circle cx="10" cy="10" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ApplicationsIcon({ className }: IconProps) {
  return (
    <svg className={className} {...BASE} aria-hidden="true">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  );
}

export function LeaseVaultIcon({ className }: IconProps) {
  return (
    <svg className={className} {...BASE} aria-hidden="true">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z" />
      <path d="M14 2v6h6" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  );
}

export function ReceiptIcon({ className }: IconProps) {
  return (
    <svg className={className} {...BASE} aria-hidden="true">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="12" y2="16" />
    </svg>
  );
}

export function ShieldCheckIcon({ className }: IconProps) {
  return (
    <svg className={className} {...BASE} stroke="#fff" aria-hidden="true">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function RentalHistoryIcon({ className }: IconProps) {
  return (
    <svg className={className} {...BASE} aria-hidden="true">
      <rect x="4" y="4" width="16" height="4" rx="1" />
      <rect x="4" y="10" width="16" height="4" rx="1" />
      <rect x="4" y="16" width="10" height="4" rx="1" />
    </svg>
  );
}

export function LeaseReviewIcon({ className }: IconProps) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h7" />
      <path d="M13 2v5h5" />
      <line x1="7" y1="12" x2="12" y2="12" />
      <line x1="7" y1="16" x2="10" y2="16" />
      <circle cx="17" cy="17" r="3.2" />
      <path d="m19.5 19.5 1.8 1.8" />
    </svg>
  );
}

export function GoodNeighbourIcon({ className }: IconProps) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <path d="M3 20V11l4-3 4 3v9" />
      <path d="M13 20V11l4-3 4 3v9" />
      <line x1="1" y1="20" x2="23" y2="20" />
    </svg>
  );
}

export function MatchCardsIcon({ className }: IconProps) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <rect x="2.5" y="5.5" width="12" height="9" rx="2" />
      <rect x="9.5" y="9.5" width="12" height="9" rx="2" fill="var(--card)" />
    </svg>
  );
}

export function ServicesIcon({ className }: IconProps) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <rect x="2" y="7" width="20" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="2" y1="13" x2="22" y2="13" />
    </svg>
  );
}

export function LandlordIcon({ className }: IconProps) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <path d="m3 10 7-6 7 6v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M10 12v5" />
      <path d="m7.5 14.5 2.5-2.5 2.5 2.5" />
    </svg>
  );
}

export function ChevronIcon({ className }: IconProps) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BackArrowIcon({ className }: IconProps) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
