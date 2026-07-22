import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Sora, Fraunces, Newsreader, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-sora",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-fraunces",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: "PropTrust: Renting, without starting from zero",
  description:
    "PropTrust is South Africa's trust layer for renting: one verified profile, whether you're searching for a home, proving your rental history, replacing a flatmate, or screening tenants for your own property.",
  other: {
    "mobile-web-app-capable": "no",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${sora.variable} ${fraunces.variable} ${newsreader.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
