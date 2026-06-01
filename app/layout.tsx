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
  title: "Radon en France — Carte des zones à risque",
  description:
    "Carte du potentiel radon par commune en France, d'après les données IRSN/ASNR (data.gouv.fr). Quels territoires sont touchés, à quel point, et pourquoi.",
  openGraph: {
    title: "Radon en France — Carte des zones à risque",
    description:
      "32 017 communes IRSN sur une carte interactive. Anciennes mines d'uranium, pôles volcaniques, recherche par nom.",
    type: "website",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Radon en France — Carte des zones à risque",
    description:
      "Carte interactive du potentiel radon par commune — données IRSN / ASNR.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground h-full overflow-hidden">{children}</body>
    </html>
  );
}
