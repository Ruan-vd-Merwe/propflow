"use client";

import { chooseFlow, type Flow } from "./flow";

export function SwitchFlowLink({
  to,
  dark = false,
}: {
  to: Flow;
  dark?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => chooseFlow(to)}
      className={`mx-auto mt-10 block text-sm font-semibold underline-offset-4 hover:underline ${
        dark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"
      }`}
    >
      I am on the other side
    </button>
  );
}
