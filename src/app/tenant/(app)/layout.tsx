import { NavBar } from "@/components/NavBar";

export default function TenantAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavBar />
      {children}
    </>
  );
}
