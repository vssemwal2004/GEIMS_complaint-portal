function CategoryCard({ title, description }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-full border border-[rgb(var(--color-card-border))] text-[rgb(var(--color-card-icon))]">
        +
      </div>

      <div className="w-full rounded-2xl border border-[rgb(var(--color-card-border))] bg-[rgb(var(--color-card-bg))] p-6">
        <div className="mb-4">
          <span className="inline-flex items-center justify-center rounded-full bg-[rgb(var(--color-accent-green))] px-4 py-2 text-sm font-semibold text-[rgb(var(--color-on-accent))]">
            {title}
          </span>
        </div>
        <p className="text-sm leading-6 text-[rgb(var(--color-text-muted))]">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function ComplaintsAtGEIMS() {
  return (
    <section id="complaints" className="bg-[rgb(var(--color-section-bg))]">
      <div className="mx-auto max-w-5xl px-4 py-16">
        <header className="mb-10 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[rgb(var(--color-text-strong))]">
            Complaints at GEIMS
          </h2>
        </header>

        <div className="grid gap-10 lg:grid-cols-3 lg:items-center">
          {/* Left side cards (desktop) */}
          <div className="hidden lg:flex flex-col gap-6">
            <CategoryCard
              title="Academic Complaint"
              description="Raise concerns related to lectures, examinations, faculty, curriculum, or academic support. Your feedback helps us maintain high educational standards."
            />
            <CategoryCard
              title="Hospital & Medical Services Complaint"
              description="Report issues related to patient care, hospital facilities, staff behavior, treatment delays, or medical services to ensure quality healthcare delivery."
            />
          </div>

          {/* Center image */}
          <div className="order-1 lg:order-none">
            <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-2xl border border-[rgb(var(--color-card-border))] bg-white">
              <img
                src="/geims-img3.jpg"
                alt="GEIMS hospital building with Indian flag"
                className="h-auto w-full object-cover"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>

          {/* Right side cards (desktop) */}
          <div className="hidden lg:flex flex-col gap-6">
            <CategoryCard
              title="Hostel & Infrastructure Complaint"
              description="Submit complaints regarding hostel facilities, cleanliness, maintenance, food services, electricity, water supply, or campus infrastructure."
            />
            <CategoryCard
              title="Administration & Management Complaint"
              description="Share concerns related to administration, documentation, fees, grievance handling, or institutional policies for prompt resolution."
            />
          </div>

          {/* Cards (mobile/tablet) */}
          <div className="grid gap-6 md:grid-cols-2 lg:hidden">
            <CategoryCard
              title="Academic Complaint"
              description="Raise concerns related to lectures, examinations, faculty, curriculum, or academic support. Your feedback helps us maintain high educational standards."
            />
            <CategoryCard
              title="Hospital & Medical Services Complaint"
              description="Report issues related to patient care, hospital facilities, staff behavior, treatment delays, or medical services to ensure quality healthcare delivery."
            />
            <CategoryCard
              title="Hostel & Infrastructure Complaint"
              description="Submit complaints regarding hostel facilities, cleanliness, maintenance, food services, electricity, water supply, or campus infrastructure."
            />
            <CategoryCard
              title="Administration & Management Complaint"
              description="Share concerns related to administration, documentation, fees, grievance handling, or institutional policies for prompt resolution."
            />
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <button
            onClick={() => {
              const el = document.getElementById('complaints');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="rounded-full bg-[rgb(var(--color-accent-green))] px-6 py-3 text-sm font-semibold text-[rgb(var(--color-on-accent))] cursor-pointer"
          >
            VIEW ALL COMPLAINT CATEGORIES
          </button>
        </div>
      </div>
    </section>
  );
}
