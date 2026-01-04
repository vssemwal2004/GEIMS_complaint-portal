"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled
          ? "bg-white text-black shadow-sm border-b border-black/10"
          : "bg-[rgb(var(--color-hero-bg))] text-white"
      ].join(" ")}
    >
      <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
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
          <Link
            href="/"
            className={
              scrolled
                ? "hover:underline underline-offset-4"
                : "hover:underline underline-offset-4 text-white"
            }
          >
            Home
          </Link>
        </nav>
      </div>
    </header>
  );
}
