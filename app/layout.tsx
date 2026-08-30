import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Adham Mahmood — Build State",
  description:
    "Adham Mahmood's living engineering identity — software, systems, and the path toward intelligent software.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
