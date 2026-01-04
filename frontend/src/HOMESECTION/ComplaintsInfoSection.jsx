import { Merriweather, Plus_Jakarta_Sans } from "next/font/google";

const headingFont = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"]
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"]
});

function Bullet({ children }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[rgb(var(--color-accent-green))]" />
      <span className="text-[rgb(var(--color-text-muted))]">{children}</span>
    </li>
  );
}

export default function ComplaintsInfoSection() {
  return (
    <section className="bg-[rgb(var(--color-section-bg))]">
      <div className="mx-auto max-w-6xl px-6 sm:px-10 py-16">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-0">
          {/* Left column */}
          <div className="bg-white p-8 sm:p-10 lg:pr-14">
            <h2
              className={[
                headingFont.className,
                "text-3xl sm:text-4xl font-bold tracking-tight text-[rgb(var(--color-text-strong))]"
              ].join(" ")}
            >
              Complaints at GEIMS
            </h2>

            <p
              className={[
                bodyFont.className,
                "mt-5 text-base sm:text-lg leading-7 text-[rgb(var(--color-text-muted))]"
              ].join(" ")}
            >
              A transparent and structured platform to raise concerns related to
              academics, hospital services, infrastructure, or administration.
              Your feedback helps us maintain quality, accountability, and
              excellence.
            </p>

            <div className="mt-7 flex items-center gap-4">
              <span className="h-[2px] w-10 bg-[rgb(var(--color-accent-green))]" />
              <p
                className={[
                  bodyFont.className,
                  "text-sm sm:text-base font-semibold text-[rgb(var(--color-accent-green))]"
                ].join(" ")}
              >
                Ensuring Fair, Timely, and Responsible Grievance Redressal
              </p>
            </div>

            <ul className={[bodyFont.className, "mt-7 space-y-3 text-base"].join(" ")}>
              <Bullet>Academic &amp; Examination Complaints</Bullet>
              <Bullet>Hospital &amp; Patient Care Issues</Bullet>
              <Bullet>Hostel &amp; Infrastructure Concerns</Bullet>
              <Bullet>Administrative &amp; Management Grievances</Bullet>
            </ul>

            <div className="mt-10">
              <a
                href="#complaints"
                className={[
                  bodyFont.className,
                  "inline-flex items-center justify-center rounded-full",
                  "bg-[rgb(var(--color-accent-green))] px-6 py-3",
                  "text-sm font-semibold text-[rgb(var(--color-on-accent))]"
                ].join(" ")}
              >
                Submit a Complaint
              </a>
            </div>
          </div>

          {/* Right column */}
          <div className="bg-[rgb(var(--color-panel-dark))] p-8 sm:p-10 lg:pl-14">
            <div className="h-[2px] w-14 bg-[rgb(var(--color-accent-green))]" />

            <p
              className={[
                bodyFont.className,
                "mt-6 text-base sm:text-lg leading-7 text-white"
              ].join(" ")}
            >
              At GEIMS, we are committed to listening and responding to every
              concern. Our complaint redressal system ensures transparency,
              confidentiality, and timely resolution for students, staff, and
              patients.
            </p>

            <div className="mt-10">
              <div
                className={[
                  bodyFont.className,
                  "text-sm font-semibold text-white"
                ].join(" ")}
              >
                GEIMS Grievance Redressal Committee
              </div>
              <div
                className={[
                  bodyFont.className,
                  "mt-1 text-sm text-[rgb(var(--color-panel-dark-muted))]"
                ].join(" ")}
              >
                Graphic Era Institute of Medical Sciences
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
