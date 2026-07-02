// ── The scene: a second-person pain narrative ──────────────────────────────
// Navy section, seven beats, ending with a chat prop styled like a familiar
// messaging app (never named, no branding) where the agent never replies.

const CHAT_GROUPS: {
  day: string;
  time: string;
  text: string;
}[] = [
  {
    day: "Tuesday",
    time: "09:14",
    text: "Hi! Is the 2 bed in Sea Point still available? I can view any day this week.",
  },
  {
    day: "Thursday",
    time: "17:40",
    text: "Hi, just following up on the Sea Point flat?",
  },
  {
    day: "Two weeks later",
    time: "08:02",
    text: "Hello?",
  },
];

function ChatBubble({ time, text }: { time: string; text: string }) {
  return (
    <div
      className="relative ml-auto max-w-[78%] rounded-lg bg-[#005C4B] px-3 py-2 text-[14px] leading-relaxed text-white"
      style={{ borderBottomRightRadius: 2 }}
    >
      {text}
      <span className="mt-1 flex items-center justify-end gap-1 text-[11px] text-[#AEBAC1]">
        {time}
        <span className="text-[#53BDEB]">✓✓</span>
      </span>
    </div>
  );
}

function ChatProp() {
  return (
    <div
      role="img"
      aria-label="A chat where the agent never replies"
      className="mx-auto w-full max-w-[400px] rounded-[20px] border border-[#223047] bg-[#0B141A] p-4"
    >
      <div className="space-y-4">
        {CHAT_GROUPS.map((group) => (
          <div key={group.day} className="chat-item space-y-2">
            <div className="mx-auto w-fit rounded-full bg-[#182229] px-3 py-1 text-[11px] text-[#8696A0]">
              {group.day}
            </div>
            <ChatBubble time={group.time} text={group.text} />
          </div>
        ))}
        <p className="chat-item text-left text-[13px] italic text-[#8696A0]">
          No reply.
        </p>
      </div>
    </div>
  );
}

const SORA = "font-[family-name:var(--font-sora)]";

export function TheScene() {
  return (
    <section id="the-old-way" className="bg-[#111B29] px-6 py-24 md:py-32">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-20 text-center md:gap-24">
        <p
          data-reveal
          className="text-xs font-bold uppercase tracking-widest text-[#3b82f6]"
        >
          The old way
        </p>

        <p
          data-reveal
          className={`${SORA} text-2xl font-semibold leading-snug text-white md:text-3xl`}
        >
          You have been refreshing the listings for three weeks.
        </p>

        <p
          data-reveal
          className={`${SORA} text-xl font-medium leading-snug text-slate-400 md:text-2xl`}
        >
          A place finally pops up. You message the agent within minutes.
        </p>

        <div data-reveal className="w-full">
          <ChatProp />
        </div>

        <p
          data-reveal
          className={`${SORA} text-xl font-medium leading-snug text-slate-400 md:text-2xl`}
        >
          You send your payslips again. Fourth time this month. Fourth
          stranger&rsquo;s inbox.
        </p>

        <p
          data-reveal
          className={`${SORA} text-xl font-medium leading-snug text-slate-400 md:text-2xl`}
        >
          Saturday, you drive out to a viewing. It looks nothing like the
          photos.
        </p>

        <p
          data-reveal
          className={`${SORA} text-2xl font-semibold leading-snug text-white md:text-3xl`}
        >
          It starts to feel personal. Like the whole process is against you.
        </p>

        <p
          data-reveal
          className={`${SORA} text-2xl font-semibold leading-snug text-[#9FBCF5] md:text-3xl`}
        >
          It is not you. The process is broken.
        </p>
      </div>
    </section>
  );
}
