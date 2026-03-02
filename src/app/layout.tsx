import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "hackaboard — Real-time Hackathon Scoring",
  description: "Live leaderboards, QR judging, and ceremony reveals for hackathons.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://hackaboard.dev"),
  openGraph: {
    title: "hackaboard — Real-time Hackathon Scoring",
    description: "Live leaderboards, QR judging, and ceremony reveals for hackathons.",
    type: "website",
    siteName: "hackaboard",
  },
  twitter: {
    card: "summary_large_image",
    title: "hackaboard — Real-time Hackathon Scoring",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
