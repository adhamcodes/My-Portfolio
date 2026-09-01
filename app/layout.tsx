import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Newsreader, Space_Mono } from "next/font/google";
import CapabilityDirector from "@/components/master/CapabilityDirector";
import ExperienceDirector from "@/components/master/ExperienceDirector";
import LivingTrace from "@/components/master/LivingTrace";
import SoundDirector from "@/components/master/SoundDirector";
import TravelDirector from "@/components/master/TravelDirector";
import { masterIdentity } from "@/content/master";
import "@/styles/master/tokens.css";
import "@/styles/master/base.css";
import "@/styles/master/shell.css";
import "@/styles/master/navigation.css";
import "@/styles/master/trace.css";
import "@/styles/master/hero.css";
import "@/styles/master/story.css";
import "@/styles/master/work.css";
import "@/styles/master/quiet.css";
import "@/styles/master/growth.css";
import "@/styles/master/pulse.css";
import "@/styles/master/history.css";
import "@/styles/master/ending.css";
import "@/styles/master/worlds.css";
import "@/styles/master/index.css";
import "@/styles/master/travel.css";
import "@/styles/master/sound.css";
import "@/styles/master/mobile.css";
import "@/styles/master/v3.css";
import "@/styles/master/v3-hero-lock.css";
import "@/styles/master/v3-zeroupload.css";
import "@/styles/master/accessibility.css";
import "@/styles/master/system.css";

const siteUrl = "https://portfolio-adham-mu.vercel.app";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

const description = "Software work, learning, and history — a living record that changes as the person does.";

export const metadata: Metadata = {
  title: {
    default: "Adham Mahmood — Current Frame",
    template: "%s — Adham Mahmood",
  },
  description,
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  applicationName: "Adham Mahmood",
  authors: [{ name: "Adham Mahmood", url: masterIdentity.github }],
  creator: "Adham Mahmood",
  openGraph: {
    title: "Adham Mahmood — Current Frame",
    description,
    type: "website",
    url: "/",
    siteName: "Adham Mahmood",
  },
  twitter: {
    card: "summary_large_image",
    title: "Adham Mahmood — Current Frame",
    description,
  },
  robots: { index: true, follow: true },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#050506",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${siteUrl}/#person`,
      name: masterIdentity.name,
      url: `${siteUrl}/`,
      email: `mailto:${masterIdentity.workEmail}`,
      sameAs: [masterIdentity.github],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: `${siteUrl}/`,
      name: "Adham Mahmood — Current Frame",
      description,
      author: { "@id": `${siteUrl}/#person` },
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-chapter="origin" className={`${instrumentSans.variable} ${newsreader.variable} ${spaceMono.variable}`}>
      <body>
        <CapabilityDirector />
        <ExperienceDirector />
        <TravelDirector />
        <SoundDirector />
        <LivingTrace />
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </body>
    </html>
  );
}
