"use client";

import { useEffect, useRef, useState } from "react";
import Footer from "./footer";

const TRANSITION_MS = 600;

export default function FooterRevealShell({ children }) {
  const footerRef = useRef(null);
  const [footerHeight, setFooterHeight] = useState(0);
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;

    const update = () => setFooterHeight(el.offsetHeight || 0);
    update();

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => update());
      ro.observe(el);
      return () => ro.disconnect();
    }

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const sentinel = document.getElementById("footer-reveal-sentinel");
    if (!sentinel) return;

    // Reveal when the end of content reaches the viewport.
    const io = new IntersectionObserver(
      ([entry]) => {
        setReveal(entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0
      }
    );

    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  return (
    <div className="relative">
      <div className="relative z-10" style={{ paddingBottom: footerHeight }}>
        {children}
        <div id="footer-reveal-sentinel" className="h-px w-full" />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-0">
        <div
          className={[
            "will-change-transform",
            "transition-[transform,opacity] ease-in-out",
            reveal
              ? "translate-y-0 opacity-100 pointer-events-auto"
              : "translate-y-8 opacity-0 pointer-events-none"
          ].join(" ")}
          style={{ transitionDuration: `${TRANSITION_MS}ms` }}
          ref={footerRef}
        >
          <Footer />
        </div>
      </div>
    </div>
  );
}
