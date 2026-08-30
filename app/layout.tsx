import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./enhancements.css";

export const metadata: Metadata = {
  title: {
    default: "Adham Mahmood — Aura System",
    template: "%s — Adham Mahmood",
  },
  description: "A living engineering identity and interactive browser system: software, systems, experiments, WebGL, motion and the road toward intelligent software.",
  metadataBase: new URL("https://portfolio-adham-mu.vercel.app"),
  alternates: { canonical: "/" },
  applicationName: "Adham / Aura System",
  authors: [{ name: "Adham Mahmood", url: "https://github.com/adhamcodes" }],
  creator: "Adham Mahmood",
  keywords: ["Adham Mahmood", "software engineering", "interactive portfolio", "WebGL", "Three.js", "Foundry180"],
  openGraph: {
    title: "Adham Mahmood — Aura System",
    description: "Portfolio, flagship browser experiment, and living engineering identity.",
    type: "website",
    url: "/",
    siteName: "Adham / Aura System",
  },
  twitter: {
    card: "summary_large_image",
    title: "Adham Mahmood — Aura System",
    description: "Portfolio, flagship browser experiment, and living engineering identity.",
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
      name: "Adham / Aura System",
      description: "A living engineering identity and interactive browser system.",
      author: { "@id": "https://portfolio-adham-mu.vercel.app/#person" },
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
