import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Foundation Preview — Adham Mahmood",
  robots: { index: false, follow: false },
};

export default function FoundationLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
