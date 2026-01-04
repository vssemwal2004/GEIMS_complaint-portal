"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    const heroEl = document.getElementById("hero");
    if (!heroEl) {
      // Non-home pages (no hero): keep navbar in the scrolled style.
      setPastHero(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Switch exactly when the hero has fully scrolled past the top.
        setPastHero(entry.boundingClientRect.bottom <= 0);
      },
      {
        root: null,
        threshold: 0,
        rootMargin: "0px"
      }
    );

    observer.observe(heroEl);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* While hero is visible: navbar scrolls with hero (not sticky) */}
      <header
        className={[
          "absolute inset-x-0 top-0 z-50",
          "bg-transparent text-white",
          "transition-opacity duration-300 ease-in-out",
          pastHero ? "opacity-0 pointer-events-none" : "opacity-100"
        ].join(" ")}
      >
        <div className="mx-auto max-w-6xl px-6 sm:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/geims-logo.png"
              alt="GEIMS logo"
              width={120}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>

          <nav className="text-sm font-medium">
            <Link href="/" className="hover:underline underline-offset-4 text-white">
              Home
            </Link>
          </nav>
        </div>
      </header>

      {/* After hero ends: reserve space so fixed navbar doesn't overlap the next section */}
      <div aria-hidden="true" className={pastHero ? "h-16" : "h-0"} />

      {/* Fixed navbar shown only after hero */}
      <header
        className={[
          "fixed inset-x-0 top-0 z-50",
          "transition-[background-color,color,box-shadow,border-color,opacity,transform] duration-300 ease-in-out",
          pastHero
            ? "bg-white text-black shadow-sm border-b border-black/10 opacity-100 translate-y-0"
            : "bg-white text-black shadow-none border-b border-transparent opacity-0 -translate-y-2 pointer-events-none"
        ].join(" ")}
      >
        <div className="mx-auto max-w-6xl px-6 sm:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/geims-logo.png"
              alt="GEIMS logo"
              width={120}
              height={40}
              className="h-8 w-auto"
            />
          </Link>

          <nav className="text-sm font-medium">
            <Link href="/" className="hover:underline underline-offset-4">
              Home
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
