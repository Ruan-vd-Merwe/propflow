import type { JourneyId } from "./journeys";

export function SearchIcon() {
  return (
    <svg viewBox="0 0 34 34" fill="none" className="h-[34px] w-[34px]">
      <circle cx="14" cy="14" r="8.5" stroke="#2A5462" strokeWidth={1.6} />
      <line x1="20.5" y1="20.5" x2="27" y2="27" stroke="#B5613E" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}

export function RenterIcon() {
  return (
    <svg viewBox="0 0 34 34" fill="none" className="h-[34px] w-[34px]">
      <rect x="8" y="5" width="18" height="24" rx="2" stroke="#2A5462" strokeWidth={1.6} />
      <path d="M13 12h8" stroke="#2A5462" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M13 17h8" stroke="#2A5462" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M13 22h5" stroke="#B5613E" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

export function FlatmateIcon() {
  return (
    <svg viewBox="0 0 34 34" fill="none" className="h-[34px] w-[34px]">
      <circle cx="12" cy="12" r="4.2" stroke="#2A5462" strokeWidth={1.6} />
      <circle cx="22" cy="14" r="3.4" stroke="#2A5462" strokeWidth={1.6} />
      <path d="M5 27c0-4 3-6.8 7.5-6.8s7.5 2.8 7.5 6.8" stroke="#2A5462" strokeWidth={1.6} />
      <path d="M20.5 27c0-2.6 1.3-5.2 5.2-5.2" stroke="#B5613E" strokeWidth={1.6} />
    </svg>
  );
}

export function LandlordIcon() {
  return (
    <svg viewBox="0 0 34 34" fill="none" className="h-[34px] w-[34px]">
      <path d="M6 26V13L17 6L28 13V26" stroke="#2A5462" strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M12.5 26V18H21.5V26" stroke="#B5613E" strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  );
}

export const JOURNEY_ICONS: Record<JourneyId, () => JSX.Element> = {
  search: SearchIcon,
  renter: RenterIcon,
  flatmate: FlatmateIcon,
  landlord: LandlordIcon,
};
