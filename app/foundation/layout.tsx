import type { Metadata } from "next";
import CapabilityDirector from "@/components/master/CapabilityDirector";
import ExperienceDirector from "@/components/master/ExperienceDirector";
import "../../styles/master/tokens.css";
import "../../styles/master/shell.css";

export const metadata: Metadata = {
  title: "Foundation Preview — Adham Mahmood",
  robots: { index: false, follow: false },
};

export default function FoundationLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <CapabilityDirector />
      <ExperienceDirector />
      {children}
    </>
  );
}
