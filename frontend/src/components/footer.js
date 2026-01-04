import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-[rgb(var(--color-footer-border))]">
      <div className="py-10 bg-[rgb(var(--color-footer-bg))] text-[rgb(var(--color-footer-text))]">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid gap-10 md:grid-cols-3">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Image
                  src="/geims-logo.png"
                  alt="GEIMS logo"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                />
              </div>
              <p className="text-sm leading-6 text-[rgb(var(--color-footer-muted))]">
                Fostering excellence in medical education, innovation, and
                community service, shaping compassionate and skilled healthcare
                professionals for tomorrow.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-lg font-semibold">Get in Touch</div>
              <p className="text-sm leading-6 text-[rgb(var(--color-footer-muted))]">
                16th Milestone, Chakrata Rd, Dehradun, Uttarakhand 248008
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-lg font-semibold">Contact</div>
              <div className="space-y-2 text-sm">
                <a
                  href="tel:18008897351"
                  className="underline-offset-4 hover:underline"
                >
                  18008897351
                </a>
                <div>
                  <a
                    href="mailto:info.geims@geu.ac.in"
                    className="underline-offset-4 hover:underline"
                  >
                    info.geims@geu.ac.in
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div
            className="mt-10 flex flex-col gap-3 border-t border-[rgb(var(--color-footer-border))] pt-6 text-sm md:flex-row md:items-center md:justify-between"
          >
            <div className="flex gap-4">
              <Link href="/terms" className="underline-offset-4 hover:underline">
                Terms &amp; Conditions
              </Link>
              <Link
                href="/privacy-policy"
                className="underline-offset-4 hover:underline"
              >
                Privacy Policy
              </Link>
            </div>
            <div className="text-[rgb(var(--color-footer-muted))]">
              © GEIMS ALL RIGHT RESERVER
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
