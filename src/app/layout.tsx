import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif, Anton } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "hackaboard",
    template: "%s · hackaboard",
  },
  description: "Live leaderboards, QR judging, and ceremony reveals for hackathons.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://hackaboard.app"),
  openGraph: {
    title: "hackaboard",
    description: "Live leaderboards, QR judging, and ceremony reveals for hackathons.",
    type: "website",
    siteName: "hackaboard",
  },
  twitter: {
    card: "summary_large_image",
    title: "hackaboard",
    description: "Live leaderboards, QR judging, and ceremony reveals for hackathons.",
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
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${anton.variable} antialiased`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
