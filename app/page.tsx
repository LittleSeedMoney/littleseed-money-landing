import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { SectionHeading } from "@/components/section-heading";
import { SeedMark } from "@/components/seed-mark";
import { WaitlistForm } from "@/components/waitlist-form";

const productAreas = [
  {
    title: "Financial Health Report",
    description:
      "Understand income, expenses, debt, assets, resilience, and missing context with transparent calculations.",
  },
  {
    title: "Decision tools",
    description:
      "Compare meaningful choices such as emergency savings, debt payoff, renting, buying, and long-term planning.",
  },
  {
    title: "Spend review",
    description:
      "Inspect spending patterns and charges without shame, automation, or hidden financial-product incentives.",
  },
  {
    title: "Clear explanations",
    description:
      "Use plain-language education and AI-supported explanations grounded in calculated results.",
  },
];

const currentBuild = [
  "Private report-review surface",
  "Emergency Fund Target and saving-goal arithmetic checks",
  "Small charge-inspection slices, including recurring-charge review",
];

export default function Home() {
  return (
    <main id="top" className="overflow-hidden">
      <Header />

      <section className="bg-earth-50 pb-20 pt-36 sm:pt-44 lg:pb-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-6 flex items-center gap-2 text-sm font-semibold text-seed-700">
              <span className="h-px w-8 bg-earth-500" />
              Financial clarity for everyone
            </p>
            <h1 className="font-display text-balance text-5xl font-medium leading-[1.05] tracking-[-0.03em] text-seed-950 sm:text-6xl lg:text-7xl">
              Small steps.{" "}
              <br />
              <span className="text-seed-600">Wise growth.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-seed-800/80 sm:text-xl">
              LittleSeed Money helps people understand money, make clearer
              financial decisions, and grow what they have been given with
              wisdom and purpose.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#waitlist"
                className="rounded-full bg-seed-800 px-6 py-3.5 text-center font-semibold text-white transition hover:bg-seed-700 focus:outline-none focus:ring-2 focus:ring-seed-500 focus:ring-offset-2"
              >
                Join the waitlist
              </a>
              <a
                href="#tools"
                className="rounded-full border border-seed-800/20 bg-white/60 px-6 py-3.5 text-center font-semibold text-seed-900 transition hover:border-seed-800/40 hover:bg-white focus:outline-none focus:ring-2 focus:ring-seed-400 focus:ring-offset-2"
              >
                See what we are building
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-seed-900/10 bg-white p-6 shadow-soft sm:p-8">
            <div className="flex items-center gap-3 border-b border-seed-900/10 pb-6">
              <SeedMark className="h-10 w-10 text-seed-600" />
              <div>
                <p className="font-semibold text-seed-950">
                  LittleSeed Money
                </p>
                <p className="mt-1 text-sm text-seed-800/60">
                  Evidence-based financial tools
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              {[
                "Understand your position",
                "Compare meaningful choices",
                "Build resilience patiently",
                "Learn with clear explanations",
              ].map((item) => (
                <div
                  className="rounded-2xl border border-seed-900/10 bg-earth-50 px-4 py-3 text-sm font-semibold text-seed-900"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-seed-950 py-20 text-white sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[.85fr_1.15fr] lg:gap-20 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-earth-300">
            The problem
          </p>
          <div>
            <h2 className="font-display text-balance text-3xl font-medium leading-tight sm:text-4xl lg:text-5xl">
              The financial world is changing quickly. Understanding it should
              not feel out of reach.
            </h2>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-seed-100/75">
              AI, automation, digital assets, and financial markets are changing
              how people work, invest, and build wealth. LittleSeed explains
              emerging systems without promoting hype, speculation, or
              guaranteed outcomes.
            </p>
          </div>
        </div>
      </section>

      <section id="mission" className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading
            eyebrow="Our mission"
            title="Make financial understanding accessible to everyone."
            description="LittleSeed Money is being built education-first and evidence-based. Calculations, visible assumptions, and reliable sources should come before confident-sounding advice."
          />
          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-seed-900/10 bg-seed-900/10 md:grid-cols-3">
            {[
              ["Understand", "See your situation clearly, without shame."],
              ["Compare", "Explore choices, trade-offs, and uncertainty."],
              ["Grow", "Take patient action with wisdom and purpose."],
            ].map(([title, description]) => (
              <div className="bg-earth-50 p-7 sm:p-9" key={title}>
                <p className="font-display text-2xl text-seed-950">{title}</p>
                <p className="mt-3 leading-7 text-seed-800/70">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="tools" className="bg-earth-50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading
            eyebrow="What we are building"
            title="Practical tools for clearer financial decisions."
            description="The product direction is broader than any one feature: financial reports, decision tools, spending review, education, and grounded explanations."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {productAreas.map((area) => (
              <article
                className="rounded-2xl border border-seed-900/10 bg-white p-6"
                key={area.title}
              >
                <h3 className="font-display text-xl text-seed-950">
                  {area.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-seed-800/65">
                  {area.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="build" className="bg-white py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[.9fr_1.1fr] lg:items-start lg:gap-20 lg:px-8">
          <SectionHeading
            eyebrow="Current build"
            title="Foundation first. Small slices next."
            description="LittleSeed is growing through small, verifiable pieces that stay inside clear scope, privacy, and advice boundaries."
          />
          <div className="grid gap-3">
            {currentBuild.map((item) => (
              <div
                className="rounded-2xl border border-seed-900/10 bg-seed-50 px-5 py-4 text-sm font-semibold leading-6 text-seed-900"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="waitlist" className="bg-earth-50 px-6 py-16 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[2rem] bg-seed-900 px-6 py-14 text-white shadow-soft sm:px-12 lg:px-16">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-earth-300">
                Grow with us
              </p>
              <h2 className="mt-4 font-display text-balance text-3xl font-medium leading-tight sm:text-4xl lg:text-5xl">
                Start with one small step.
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-seed-100/75">
                Join the waitlist and follow LittleSeed Money as we build
                clearer, wiser financial tools for real life.
              </p>
            </div>
            <WaitlistForm />
          </div>
        </div>
      </section>

      <section className="bg-earth-50 px-6 pb-20 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-earth-700">
            From the founder
          </p>
          <div className="mt-5 rounded-3xl border border-seed-900/10 bg-white p-7 shadow-soft sm:p-10">
            <p className="text-lg leading-8 text-seed-900/75">
              LittleSeed Money is being built by Junsu Jeong, a data engineer
              with a software engineering background.
            </p>
            <p className="mt-5 text-lg leading-8 text-seed-900/75">
              In his twenties, Junsu once took his host family to White Duck,
              his favorite taco place in Johnson City, Tennessee. That day, he
              heard a simple piece of advice: "Save money."
            </p>
            <p className="mt-5 font-display text-2xl leading-9 text-seed-950">
              That small sentence stayed with him.
            </p>
            <p className="mt-4 text-lg leading-8 text-seed-900/75">
              LittleSeed Money is built around the belief that small financial
              steps, taken wisely, can grow into something meaningful.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
