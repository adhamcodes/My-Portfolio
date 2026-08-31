import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Newsreader, Space_Mono } from "next/font/google";
import CapabilityDirector from "@/components/master/CapabilityDirector";
import ExperienceDirector from "@/components/master/ExperienceDirector";
import "@/styles/master/tokens.css";
import "@/styles/master/base.css";
import "@/styles/master/shell.css";
import "@/styles/master/trace.css";
import "@/styles/master/hero.css";
import "@/styles/master/story.css";
import "@/styles/master/work.css";
import "@/styles/master/growth.css";
import "@/styles/master/worlds.css";
import "@/styles/master/index.css";
import "@/styles/master/system.css";

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

export const metadata: Metadata = {
  title: {
    default: "Adham Mahmood — Evolving Portfolio",
    template: "%s — Adham Mahmood",
  },
  description: "An evolving record of software work, learning, and history.",
  metadataBase: new URL("https://portfolio-adham-mu.vercel.app"),
  alternates: { canonical: "/" },
  applicationName: "Adham Mahmood",
  authors: [{ name: "Adham Mahmood", url: "https://github.com/adhamcodes" }],
  creator: "Adham Mahmood",
  openGraph: {
    title: "Adham Mahmood — Evolving Portfolio",
    description: "An evolving record of software work, learning, and history.",
    type: "website",
    url: "/",
    siteName: "Adham Mahmood",
  },
  twitter: {
    card: "summary_large_image",
    title: "Adham Mahmood — Evolving Portfolio",
    description: "An evolving record of software work, learning, and history.",
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
      "@id": "https://portfolio-adham-mu.vercel.app/#person",
      name: "Adham Mahmood",
      url: "https://portfolio-adham-mu.vercel.app/",
      sameAs: ["https://github.com/adhamcodes"],
    },
    {
      "@type": "WebSite",
      "@id": "https://portfolio-adham-mu.vercel.app/#website",
      url: "https://portfolio-adham-mu.vercel.app/",
      name: "Adham Mahmood — Evolving Portfolio",
      description: "An evolving record of software work, learning, and history.",
      author: { "@id": "https://portfolio-adham-mu.vercel.app/#person" },
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${newsreader.variable} ${spaceMono.variable}`}>
      <body>
        <CapabilityDirector />
        <ExperienceDirector />
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </body>
    </html>
  );
}
