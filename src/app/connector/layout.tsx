import { NavBar } from "@/components/NavBar";

export default function ConnectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      {children}
    </div>
  );
}
