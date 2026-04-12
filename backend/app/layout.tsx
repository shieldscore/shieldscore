import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "ShieldScore | Know Before Stripe Freezes You",
  description:
    "Real-time account health monitoring for Stripe merchants. Track your VAMP and ECM ratios, get instant alerts on hidden restrictions, and prevent sudden account freezes.",
  openGraph: {
    title: "ShieldScore | Know Before Stripe Freezes You",
    description:
      "Real-time account health monitoring for Stripe merchants. Track your VAMP and ECM ratios, get instant alerts on hidden restrictions, and prevent sudden account freezes.",
    type: "website",
    url: "https://shieldscore.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${jetBrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
