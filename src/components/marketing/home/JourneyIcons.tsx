import type { JourneyId } from "./journeys";

export function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[19px] w-[19px]">
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth={1.8} />
      <line
        x1="15.3"
        y1="15.3"
        x2="21"
        y2="21"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function RenterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[19px] w-[19px]">
      <rect x="5" y="3" width="14" height="18" rx="1.5" stroke="currentColor" strokeWidth={1.8} />
      <line x1="8" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
      <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
      <line x1="8" y1="16" x2="12.5" y2="16" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

export function FlatmateIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[19px] w-[19px]">
      <circle cx="8" cy="8" r="3.2" stroke="currentColor" strokeWidth={1.8} />
      <circle cx="17" cy="8" r="3.2" stroke="currentColor" strokeWidth={1.8} />
      <path
        d="M3 20c0-3.3 2.5-5.5 5.5-5.5S14 16.7 14 20"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <path
        d="M13.5 14.6c1-.7 2-1.1 3.5-1.1 3 0 5.5 2.2 5.5 5.5"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LandlordIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[19px] w-[19px]">
      <path
        d="M4 11 L12 4 L20 11"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 10.5V20h12v-9.5"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="10" y="14" width="4" height="6" stroke="currentColor" strokeWidth={1.6} />
    </svg>
  );
}

export const JOURNEY_ICONS: Record<JourneyId, () => JSX.Element> = {
  search: SearchIcon,
  renter: RenterIcon,
  flatmate: FlatmateIcon,
  landlord: LandlordIcon,
};
