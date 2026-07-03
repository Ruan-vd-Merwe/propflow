import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Sora } from "next/font/google";
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

export const metadata: Metadata = {
  title: "PropTrust: Find a home that fits your life",
  description:
    "PropTrust helps South African tenants choose the right area, discover properties that match their lifestyle, and apply with one trusted rental profile.",
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
      <body className={`${geistSans.variable} ${sora.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
