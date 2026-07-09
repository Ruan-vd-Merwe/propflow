import type { ReactNode } from "react";

export function PrimaryCard({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow?: string;
  title: string;
  body: string;
  action: ReactNode;
}) {
  return (
    <div className="mb-6 overflow-hidden rounded-2xl bg-[#0f172a] p-6">
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-300">
          {eyebrow}
        </p>
      )}
      <p className="mt-1 text-lg font-bold text-white">{title}</p>
      <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-400">{body}</p>
      {action}
    </div>
  );
}
