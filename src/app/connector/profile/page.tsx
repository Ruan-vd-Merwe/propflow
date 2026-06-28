import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ConnectorProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const m = user.user_metadata ?? {};

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Connector Profile</h1>
      <p className="mt-2 text-sm text-slate-500">
        Your connector profile and verification status.
      </p>
      <div className="mt-8 space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">Details</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium text-slate-900">{m.full_name ?? user.email}</dd>
            </div>
            {m.connector_area && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Area</dt>
                <dd className="font-medium text-slate-900">{m.connector_area}</dd>
              </div>
            )}
            {m.connector_province && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Province</dt>
                <dd className="font-medium text-slate-900">{m.connector_province}</dd>
              </div>
            )}
          </dl>
        </div>
        {m.connector_tasks && (m.connector_tasks as string[]).length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-700">Tasks I can help with</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(m.connector_tasks as string[]).map((task: string) => (
                <span
                  key={task}
                  className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800"
                >
                  {task}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
