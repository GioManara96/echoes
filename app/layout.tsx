import type { Metadata } from "next";
import { Syne, Source_Sans_3, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const sourceSans3 = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Echoes",
  description: "What's playing now?",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${syne.variable} ${sourceSans3.variable} ${ibmPlexMono.variable}`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
