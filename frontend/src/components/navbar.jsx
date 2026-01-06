"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Navbar() {
  const router = useRouter();
  const [transition, setTransition] = useState(1);

  useEffect(() => {
    const heroEl = document.getElementById("hero");
    if (!heroEl) {
      // Non-home pages (no hero): keep navbar in the scrolled style.
      setTransition(1);
      return;
    }

    let rafId = 0;
    const RANGE_PX = 96;

    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        const bottom = heroEl.getBoundingClientRect().bottom;
        const t = Math.max(0, Math.min(1, (RANGE_PX - bottom) / RANGE_PX));
        setTransition(t);
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const heroOpacity = 1 - transition;
  const fixedOpacity = transition;
  const spacerHeight = Math.round(64 * fixedOpacity);

  const onHomeClick = (e) => {
    if (typeof window === "undefined") return;

    const scrollToHero = () => {
      const heroEl = document.getElementById("hero");
      if (heroEl) {
        heroEl.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    const isHome = router.asPath === "/";
    e.preventDefault();

    if (isHome) {
      scrollToHero();
      return;
    }

    router.push("/").then(() => {
      // wait for next paint so the hero exists in DOM
      window.requestAnimationFrame(scrollToHero);
    });
  };

  return (
    <>
      {/* Reserve space smoothly once navbar becomes fixed */}
      <div aria-hidden="true" style={{ height: spacerHeight }} />

      {/* Hero navbar: transparent, white text, scrolls with hero */}
      <header
        className="absolute inset-x-0 top-0 z-50 bg-transparent text-white transition-opacity duration-300 ease-in-out"
        style={{ opacity: heroOpacity, pointerEvents: heroOpacity > 0.02 ? "auto" : "none" }}
      >
        <div className="mx-auto max-w-6xl px-6 sm:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" onClick={onHomeClick}>
              <Image
                src="/geims-logo.webp"
              alt="GEIMS logo"
              width={120}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>

          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/" onClick={onHomeClick} className="hover:underline underline-offset-4">
              Home
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-lg px-4 py-2 bg-[rgb(var(--color-accent-green))] text-[rgb(var(--color-on-accent))] font-semibold hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              Write Complaint
            </Link>
          </nav>
        </div>
      </header>

      {/* Fixed navbar after hero: white background, dark text, smooth transitions */}
      <header
        className="fixed inset-x-0 top-0 z-50 bg-white text-slate-900 shadow-sm border-b border-black/10 transition-[opacity,background-color,color,box-shadow,border-color] duration-300 ease-in-out"
        style={{ opacity: fixedOpacity, pointerEvents: fixedOpacity > 0.02 ? "auto" : "none" }}
      >
        <div className="mx-auto max-w-6xl px-6 sm:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" onClick={onHomeClick}>
              <Image
                src="/geims-logo.webp"
              alt="GEIMS logo"
              width={120}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>

          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/" onClick={onHomeClick} className="hover:underline underline-offset-4">
              Home
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-lg px-4 py-2 bg-[rgb(var(--color-accent-green))] text-[rgb(var(--color-on-accent))] font-semibold hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent-green))]"
            >
              Write Complaint
            </Link>
          </nav>
        </div>
      </header>
    </>
  );

}
