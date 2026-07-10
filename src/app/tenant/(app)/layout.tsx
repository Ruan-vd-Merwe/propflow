import { Space_Grotesk, Inter } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import tokens from "./dashboard/hub.module.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export default function TenantAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${spaceGrotesk.variable} ${inter.variable} ${tokens.tokens}`}>
      <NavBar />
      {children}
    </div>
  );
}
