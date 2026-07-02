// ── The landlord's scene: mirrors TheScene, navy background, seven beats ────
// ending with an inbox prop styled like a familiar messaging app (never
// named, no branding). It is the other end of the tenant's chat from
// TheScene.

const INBOX_ROWS: {
  name: string;
  preview: string;
  unread: number;
}[] = [
  { name: "Sipho", preview: "Is this still available", unread: 3 },
  { name: "Megan", preview: "available?", unread: 1 },
  { name: "Unknown number", preview: "Can I view today at 6? Will bring papers", unread: 5 },
  { name: "Johan", preview: "Hi, is this pet friendly?", unread: 2 },
];

function Avatar({ name }: { name: string }) {
  const initial = name === "Unknown number" ? "?" : name.charAt(0).toUpperCase();
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2A3942] text-sm font-semibold text-[#8696A0]">
      {initial}
    </div>
  );
}

function InboxRow({ name, preview, unread }: (typeof INBOX_ROWS)[number]) {
  return (
    <div className="chat-item flex items-center gap-3 border-b border-[#182229] px-4 py-3 last:border-b-0">
      <Avatar name={name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{name}</p>
        <p className="truncate text-[13px] text-[#8696A0]">{preview}</p>
      </div>
      <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[#25D366] px-1.5 text-[11px] font-bold text-[#0B141A]">
        {unread}
      </span>
    </div>
  );
}

function InboxProp() {
  return (
    <div
      role="img"
      aria-label="A flooded inbox the landlord cannot keep up with"
      className="mx-auto w-full max-w-[400px] overflow-hidden rounded-[20px] border border-[#223047] bg-[#0B141A]"
    >
      <div>
        {INBOX_ROWS.map((row) => (
          <InboxRow key={row.name} {...row} />
        ))}
      </div>
      <p className="chat-item px-4 py-3 text-center text-[13px] text-[#8696A0]">
        + 43 more
      </p>
    </div>
  );
}

const SORA = "font-[family-name:var(--font-sora)]";

export function LandlordScene() {
  return (
    <section id="landlord-scene" className="bg-[#111B29] px-6 py-24 md:py-32">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-20 text-center md:gap-24">
        <p
          data-reveal
          className="text-xs font-bold uppercase tracking-widest text-[#3b82f6]"
        >
          The landlord&rsquo;s side
        </p>

        <p
          data-reveal
          className={`${SORA} text-2xl font-semibold leading-snug text-white md:text-3xl`}
        >
          You list your place on a Tuesday morning.
        </p>

        <p
          data-reveal
          className={`${SORA} text-xl font-medium leading-snug text-slate-400 md:text-2xl`}
        >
          By lunch there are 47 enquiries. Three have documents. None answer
          your questions.
        </p>

        <div data-reveal className="w-full">
          <InboxProp />
        </div>

        <p
          data-reveal
          className={`${SORA} text-xl font-medium leading-snug text-slate-400 md:text-2xl`}
        >
          You stop replying. You feel bad about it. Saturday brings four
          viewings that never happen.
        </p>

        <p
          data-reveal
          className={`${SORA} text-2xl font-semibold leading-snug text-white md:text-3xl`}
        >
          So you call an agent. They want a month&rsquo;s rent to make it go
          away.
        </p>
      </div>
    </section>
  );
}
