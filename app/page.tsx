import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { SectionHeading } from "@/components/section-heading";
import { SeedMark } from "@/components/seed-mark";
import { WaitlistForm } from "@/components/waitlist-form";

const productAreas = [
  {
    number: "01",
    title: "Financial Health Report",
    description:
      "A clear picture of where you are today, supported by transparent calculations and assumptions.",
  },
  {
    number: "02",
    title: "Rent vs Buy",
    description:
      "Compare the real costs, trade-offs, and long-term effects of either path.",
  },
  {
    number: "03",
    title: "Debt Payoff",
    description:
      "Understand payoff strategies, timelines, and how much interest each path may save.",
  },
  {
    number: "04",
    title: "Budget Builder",
    description:
      "Build a practical monthly plan connected to the things that matter most to you.",
  },
  {
    number: "05",
    title: "Asset Dashboard",
    description:
      "See what you own, what you owe, and how your financial foundation is changing.",
  },
  {
    number: "06",
    title: "Spend Analyzer",
    description:
      "Turn everyday spending into useful patterns without shame or judgment.",
  },
  {
    number: "07",
    title: "Tax Snapshot",
    description:
      "Explore how tax assumptions may shape income and planning scenarios.",
  },
  {
    number: "08",
    title: "AI-powered explanations",
    description:
      "Make complex results easier to understand, grounded in structured calculations.",
  },
];

const roadmap = [
  {
    phase: "Phase 1",
    title: "Manual Financial Health Report",
    description: "A transparent, education-first view of your financial life.",
  },
  {
    phase: "Phase 2",
    title: "Reference Data + Historical Simulations",
    description: "Official data and historical context behind the numbers.",
  },
  {
    phase: "Phase 3",
    title: "Decision Engines",
    description: "Tools for comparing meaningful financial choices.",
  },
  {
    phase: "Phase 4",
    title: "AI Explanation Layer",
    description: "Plain-language explanations grounded in calculated results.",
  },
];

export default function Home() {
  return (
    <main id="top" className="overflow-hidden">
      <Header />

      <section className="relative min-h-[760px] bg-earth-50 pb-24 pt-40 sm:pt-48 lg:flex lg:min-h-screen lg:items-center lg:py-40">
        <div className="pointer-events-none absolute -right-28 top-24 h-96 w-96 rounded-full bg-seed-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-earth-200/60 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-[1.08fr_.92fr] lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-6 flex items-center gap-2 text-sm font-semibold text-seed-700">
              <span className="h-px w-8 bg-earth-500" />
              Financial clarity for everyone
            </p>
            <h1 className="font-display text-balance text-5xl font-medium leading-[1.05] tracking-[-0.03em] text-seed-950 sm:text-6xl lg:text-7xl">
              Small steps.
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
                href="#mission"
                className="rounded-full border border-seed-800/20 bg-white/60 px-6 py-3.5 text-center font-semibold text-seed-900 transition hover:border-seed-800/40 hover:bg-white focus:outline-none focus:ring-2 focus:ring-seed-400 focus:ring-offset-2"
              >
                Learn the mission
              </a>
            </div>
          </div>

          <div className="relative mx-auto hidden aspect-square w-full max-w-lg lg:block">
            <div className="absolute inset-[10%] rounded-full border border-seed-800/10" />
            <div className="absolute inset-[22%] rounded-full border border-seed-800/10" />
            <div className="absolute inset-[34%] rounded-full bg-white/70 shadow-soft backdrop-blur">
              <SeedMark className="h-full w-full p-14 text-seed-600" />
            </div>
            <div className="absolute left-[12%] top-[19%] rounded-full bg-earth-200 px-4 py-2 text-xs font-bold uppercase tracking-widest text-earth-800">
              Wisdom
            </div>
            <div className="absolute bottom-[18%] right-[8%] rounded-full bg-seed-200 px-4 py-2 text-xs font-bold uppercase tracking-widest text-seed-800">
              Purpose
            </div>
          </div>
        </div>
      </section>

      <section className="bg-seed-950 py-24 text-white sm:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[.75fr_1.25fr] lg:gap-24 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-earth-300">
            The problem
          </p>
          <div>
            <h2 className="font-display text-balance text-3xl font-medium leading-tight sm:text-4xl lg:text-5xl">
              Financial life keeps changing. Understanding it should not feel
              out of reach.
            </h2>
            <div className="mt-8 grid gap-6 text-lg leading-8 text-seed-100/75 sm:grid-cols-2">
              <p>
                The ways people earn, spend, save, invest, and build security
                continue to evolve across generations and economic cycles.
              </p>
              <p>
                New technologies, including AI, automation, and digital assets,
                add new possibilities and risks to financial choices that were
                already complex.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="mission" className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading
            eyebrow="Our mission"
            title="Make financial understanding accessible to everyone."
            description="LittleSeed Money is being built education-first and evidence-based. Calculations, visible assumptions, and reliable sources should come before confident-sounding advice."
          />
          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-seed-900/10 bg-seed-900/10 md:grid-cols-3">
            {[
              ["Understand", "See your situation clearly, without shame."],
              ["Compare", "Explore choices, trade-offs, and uncertainty."],
              ["Grow", "Take patient action with wisdom and purpose."],
            ].map(([title, description]) => (
              <div className="bg-earth-50 p-8 sm:p-10" key={title}>
                <p className="font-display text-2xl text-seed-950">{title}</p>
                <p className="mt-3 leading-7 text-seed-800/70">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="why" className="relative bg-seed-100 py-24 sm:py-32">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.8)_0,transparent_65%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:gap-24 lg:px-8">
          <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-full border border-seed-700/15 bg-earth-50 shadow-soft sm:h-80 sm:w-80">
            <SeedMark className="h-36 w-36 text-seed-600 sm:h-44 sm:w-44" />
          </div>
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-earth-700">
              Why LittleSeed?
            </p>
            <h2 className="font-display text-balance text-3xl font-medium leading-tight text-seed-950 sm:text-4xl lg:text-5xl">
              Small beginnings can grow into something meaningful.
            </h2>
            <p className="mt-7 text-lg leading-8 text-seed-900/75">
              LittleSeed comes from the belief that small beginnings can grow
              when planted with wisdom, patience, and care. A seed may look
              small, but over time it can provide shade, fruit, and something
              meaningful for others.
            </p>
            <p className="mt-5 border-l-2 border-earth-400 pl-6 font-display text-xl leading-9 text-seed-900 sm:text-2xl">
              Money is not the master. It is a seed, something entrusted to us,
              to be understood, planted wisely, grown patiently, and used for
              good.
            </p>
            <p className="mt-6 text-base leading-7 text-seed-800/65">
              These values shape LittleSeed Money, and everyone is welcome to
              learn and grow here.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-earth-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading
            eyebrow="What we are building"
            title="Practical tools for clearer financial decisions."
            description="LittleSeed Money will connect financial education with useful calculations, thoughtful comparisons, and explanations people can actually understand."
          />
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {productAreas.map((area) => (
              <article
                className="group rounded-2xl border border-seed-900/10 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-seed-600/30 hover:shadow-soft"
                key={area.title}
              >
                <span className="text-xs font-bold tracking-widest text-earth-600">
                  {area.number}
                </span>
                <h3 className="mt-8 font-display text-xl text-seed-950">
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

      <section id="roadmap" className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading
            eyebrow="Product roadmap"
            title="Build the facts first. Explain them clearly."
            description="The product will grow in deliberate phases so every insight can be traced, tested, and understood."
            centered
          />
          <div className="relative mt-16 grid gap-8 md:grid-cols-4 md:gap-4">
            <div className="absolute left-[12.5%] right-[12.5%] top-5 hidden h-px bg-seed-200 md:block" />
            {roadmap.map((item, index) => (
              <article className="relative text-center" key={item.phase}>
                <div className="relative z-10 mx-auto flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-seed-700 text-sm font-bold text-white">
                  {index + 1}
                </div>
                <p className="mt-5 text-xs font-bold uppercase tracking-widest text-earth-700">
                  {item.phase}
                </p>
                <h3 className="mt-3 font-display text-xl leading-7 text-seed-950">
                  {item.title}
                </h3>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-seed-800/65">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="waitlist" className="bg-earth-50 px-6 py-16 sm:py-24 lg:px-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-seed-900 px-6 py-16 text-white shadow-soft sm:px-12 lg:px-20 lg:py-20">
          <div className="pointer-events-none absolute -right-20 -top-32 h-96 w-96 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-8 -top-20 h-72 w-72 rounded-full border border-white/10" />
          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
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

      <Footer />
    </main>
  );
}
