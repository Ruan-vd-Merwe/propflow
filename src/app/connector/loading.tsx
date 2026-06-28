export default function ConnectorLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="animate-pulse">
        <div className="h-7 w-40 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-64 rounded bg-slate-100" />
        <div className="mt-8 rounded-xl border border-slate-200 bg-white px-6 py-12">
          <div className="mx-auto h-4 w-48 rounded bg-slate-100" />
        </div>
      </div>
    </main>
  );
}
