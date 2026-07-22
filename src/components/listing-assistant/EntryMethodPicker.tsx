"use client";

export type EntryMethod = "quick" | "guided" | "paste" | "manual";

function IconMic({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  );
}
function IconChat({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  );
}
function IconPaste({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
  );
}
function IconPencil({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
    </svg>
  );
}

const METHODS: {
  id: EntryMethod;
  title: string;
  subtitle: string;
  Icon: (props: { className?: string }) => React.JSX.Element;
}[] = [
  {
    id: "quick",
    title: "Tell us about the property",
    subtitle: "Speak naturally for about a minute, we'll fill in the details.",
    Icon: IconMic,
  },
  {
    id: "guided",
    title: "Guide me through it",
    subtitle: "We'll ask short questions one at a time.",
    Icon: IconChat,
  },
  {
    id: "paste",
    title: "Paste an existing listing",
    subtitle: "Already have an ad written? Paste it in and we'll extract it.",
    Icon: IconPaste,
  },
  {
    id: "manual",
    title: "Fill it in manually",
    subtitle: "Skip the assistant and use the form directly.",
    Icon: IconPencil,
  },
];

export function EntryMethodPicker({
  onSelect,
}: {
  onSelect: (method: EntryMethod) => void;
}) {
  return (
    <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">
        Listing assistant
      </h3>
      <p className="mt-0.5 text-xs text-slate-500">
        Choose how you&apos;d like to get started, you can always switch to the
        manual form.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {METHODS.map(({ id, title, subtitle, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className="flex min-h-[44px] items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50"
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
            <span>
              <span className="block text-sm font-semibold text-slate-900">
                {title}
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {subtitle}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
