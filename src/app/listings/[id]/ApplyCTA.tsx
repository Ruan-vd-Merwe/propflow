"use client";

import { useRouter } from "next/navigation";
import { setAuthReturnPath } from "@/lib/listings/return-path";

export function ApplyCTA({
  listingId,
  alreadyApplied,
}: {
  listingId: string;
  alreadyApplied: boolean;
}) {
  const router = useRouter();

  if (alreadyApplied) {
    return (
      <div className="rounded-xl bg-[#F1ECE1] px-4 py-3.5 text-center text-sm font-semibold text-[#2A5462]">
        You have applied for this property
      </div>
    );
  }

  function handleApply() {
    setAuthReturnPath(`/listings/${listingId}/apply`);
    router.push(`/listings/${listingId}/apply`);
  }

  return (
    <button
      type="button"
      onClick={handleApply}
      className="block w-full rounded-xl bg-[#B5613E] py-3.5 text-center text-sm font-bold text-white transition hover:bg-[#9c5033]"
    >
      Apply with your TrustScore
    </button>
  );
}
