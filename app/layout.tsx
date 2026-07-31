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
  metadataBase: new URL("https://echoes.giovannimanara.dev"),
  title: "Echoes",
  description: "A public listening booth — what’s on air on Spotify, top artists, and recent tracks",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Echoes",
    description: "A public listening booth — what’s on air on Spotify, top artists, and recent tracks",
    url: "/",
    siteName: "Echoes",
    type: "website",
    // images: le mette Next da solo se esiste app/opengraph-image.png
  },
  twitter: {
    card: "summary_large_image",
  },
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
