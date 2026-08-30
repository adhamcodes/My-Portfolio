import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./enhancements.css";
import "./accessibility.css";
import "./initialization.css";
import "./release-candidate.css";
import "./resilience.css";
import "./final-polish.css";
import "./monster-pass.css";
import "./protocol-pass.css";
import "./qa-pass.css";
import "./ultimate-pass.css";
import "./release-cleanup.css";

export const metadata: Metadata = {
  title: {
    default: "Adham Mahmood — Interactive Portfolio",
    template: "%s — Adham Mahmood",
  },
  description: "Software projects, experiments, and an interactive portfolio that behaves like one of them.",
  metadataBase: new URL("https://portfolio-adham-mu.vercel.app"),
  alternates: { canonical: "/" },
  applicationName: "Adham Mahmood",
  authors: [{ name: "Adham Mahmood", url: "https://github.com/adhamcodes" }],
  creator: "Adham Mahmood",
  keywords: ["Adham Mahmood", "software engineering", "interactive portfolio", "WebGL", "Three.js", "Foundry180"],
  openGraph: {
    title: "Adham Mahmood — Interactive Portfolio",
    description: "Software projects, experiments, and a portfolio built as a browser experience in its own right.",
    type: "website",
    url: "/",
    siteName: "Adham Mahmood",
  },
  twitter: {
    card: "summary_large_image",
    title: "Adham Mahmood — Interactive Portfolio",
    description: "Software projects, experiments, and a portfolio built as a browser experience in its own right.",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#05070b",
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
      name: "Adham Mahmood — Interactive Portfolio",
      description: "Software projects, experiments, and an interactive portfolio that behaves like one of them.",
      author: { "@id": "https://portfolio-adham-mu.vercel.app/#person" },
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </body>
    </html>
  );
}
