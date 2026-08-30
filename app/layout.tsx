import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Adham Mahmood — Build State",
  description: "A living engineering identity: software, systems and the road toward intelligent software.",
  metadataBase: new URL("https://portfolio-adham-mu.vercel.app"),
  openGraph: {
    title: "Adham Mahmood — Build State",
    description: "Portfolio, experiment, and living engineering identity.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#05070b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
