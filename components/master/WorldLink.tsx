"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type MouseEvent, type ReactNode } from "react";

type WorldLinkProps = {
  href: string;
  world: string;
  className?: string;
  children: ReactNode;
};

export default function WorldLink({ href, world, className, children }: WorldLinkProps) {
  const router = useRouter();
  const traveling = useRef(false);

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) return;

    event.preventDefault();
    if (traveling.current) return;
    traveling.current = true;

    const root = document.documentElement;
    window.dispatchEvent(new CustomEvent("adham:travel", {
      detail: { phase: "depart", world },
    }));

    const reduced = root.dataset.motionMode === "reduced";
    window.setTimeout(() => router.push(href), reduced ? 0 : 220);
  };

  return (
    <Link href={href} prefetch className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
