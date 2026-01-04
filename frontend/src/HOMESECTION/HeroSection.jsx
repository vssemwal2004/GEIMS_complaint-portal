"use client";

import { useEffect, useState } from "react";
import { Merriweather, Plus_Jakarta_Sans } from "next/font/google";

const headingFont = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"]
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"]
});

const SLIDES = [
  {
    headingLines: [
      "Embark on a Journey of Medical Excellence",
      "at Graphic Era Institute of Medical Sciences"
    ],
    subheading: "Where Innovation Meets Compassion"
  },
  {
    headingLines: [
      "Welcome to Graphic Era Institute of Medical Sciences",
      "Complaint Portal"
    ],
    subheading: "Login to submit your complaint and help us improve our services."
  },
  {
    headingLines: [
      "Your voice matters — report issues",
      "easily and securely."
    ],
    subheading: "A simple platform for transparent grievance redressal."
  }
];

const INTERVAL_MS = 5000;
const EXIT_MS = 650;
const ENTER_MS = 850;

export default function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState("entering"); // entering | idle | exiting
  const [fadeKey, setFadeKey] = useState(0);
  const [nextIndex, setNextIndex] = useState(null);

  useEffect(() => {
    const enterTimeout = setTimeout(() => setPhase("idle"), ENTER_MS + 260);
    return () => clearTimeout(enterTimeout);
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const upcoming = (activeIndex + 1) % SLIDES.length;

      // Start background-only fade (under text) + text exit animations.
      setFadeKey((k) => k + 1);
      setNextIndex(upcoming);
      setPhase("exiting");

      const switchTimeout = setTimeout(() => {
        setActiveIndex(upcoming);
        setPhase("entering");
      }, EXIT_MS);

      const endTimeout = setTimeout(() => {
        setPhase("idle");
        setNextIndex(null);
      }, EXIT_MS + ENTER_MS + 160);

      return () => {
        clearTimeout(switchTimeout);
        clearTimeout(endTimeout);
      };
    }, INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [activeIndex]);

  const slide = SLIDES[activeIndex];
  const blockAnimation =
    phase === "entering"
      ? "animate-heroBlockInDown"
      : phase === "exiting"
        ? "animate-heroBlockOutUp"
        : "";

  return (
    <section
      id="hero"
      className="relative h-screen overflow-hidden text-[rgb(var(--color-hero-text))] bg-gradient-to-br from-[rgb(var(--color-hero-bg))] to-[rgb(var(--color-hero-bg-deep))]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.14] animate-heroTexture"
        style={{
          backgroundImage:
            `radial-gradient(circle at 20% 20%, rgb(var(--color-hero-texture) / 0.14) 0%, transparent 45%),` +
            `radial-gradient(circle at 70% 40%, rgb(var(--color-hero-texture) / 0.10) 0%, transparent 55%),` +
            `repeating-linear-gradient(135deg, rgb(var(--color-hero-texture) / 0.06) 0px, rgb(var(--color-hero-texture) / 0.06) 1px, transparent 1px, transparent 8px)`,
          backgroundSize: "120% 120%"
        }}
      />

      <div className="relative z-20 flex h-full items-center">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10 pt-20">
          <div key={activeIndex} className={"max-w-4xl will-change-transform " + blockAnimation}>
            <div
              className={[
                headingFont.className,
                "text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08]"
              ].join(" ")}
            >
              <div>{slide.headingLines[0]}</div>
              <div>{slide.headingLines[1]}</div>
            </div>

            <p
              className={[
                bodyFont.className,
                "mt-6 text-base sm:text-lg md:text-xl font-medium text-white"
              ].join(" ")}
            >
              {slide.subheading}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
