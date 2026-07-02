// ── Convergence: the shared bridge between both scenes ──────────────────────
// Two adjacent solid blocks (navy, then off white) rather than a CSS
// gradient. The design skill bans gradients outright, so the "navy fading
// to off white" brief is read here as a hard cut between two flat sections,
// not a blended background.

const STEPS = ["Applied", "Screened", "Viewing", "Lease"];

function DealRoomCard() {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-[#E7E6E2] bg-white p-8 shadow-sm md:p-10">
      <p className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">
        The deal room
      </p>
      <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-[#111B29] md:text-3xl">
        Where Thandi and Ruan meet
      </h3>

      {/* Progress steps */}
      <div className="mt-8 flex items-center justify-center">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center">
            {i > 0 && <div className="mx-1.5 h-0.5 w-8 bg-slate-200 sm:w-12" />}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-[#2563EB]">
                {i + 1}
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                {step}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom row, split in two */}
      <div className="mt-9 grid gap-6 border-t border-slate-100 pt-6 sm:grid-cols-2 sm:divide-x sm:divide-slate-100">
        <div className="sm:pr-6">
          <p className="text-sm leading-relaxed text-slate-600">
            <span className="font-semibold text-[#111B29]">
              Thandi shares her side:
            </span>{" "}
            property history, lease terms
          </p>
        </div>
        <div className="sm:pl-6">
          <p className="text-sm leading-relaxed text-slate-600">
            <span className="font-semibold text-[#111B29]">
              Ruan shares his side:
            </span>{" "}
            readiness, references
          </p>
        </div>
      </div>
    </div>
  );
}

export function Convergence() {
  return (
    <section id="convergence">
      <div className="bg-[#111B29] px-6 py-16 text-center md:py-20">
        <p
          data-reveal
          className="text-2xl font-semibold leading-snug text-white md:text-3xl"
        >
          It is not you. Either of you.
        </p>
        <p
          data-reveal
          className="mx-auto mt-4 max-w-xl text-lg leading-snug text-[#9FBCF5] md:text-xl"
        >
          The process is broken. PropTrust is where the two of you finally
          meet.
        </p>
      </div>
      <div className="bg-[#F7F7F5] px-6 py-16 md:py-20">
        <DealRoomCard />
      </div>
    </section>
  );
}
