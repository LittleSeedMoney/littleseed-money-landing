import { SeedMark } from "@/components/seed-mark";

export function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <a
          href="#top"
          className="flex items-center gap-2.5 font-semibold tracking-tight text-seed-950"
          aria-label="LittleSeed Money home"
        >
          <SeedMark className="h-8 w-8 text-seed-600" />
          <span>LittleSeed Money</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm font-medium text-seed-800 md:flex">
          <a className="transition hover:text-seed-500" href="#mission">
            Mission
          </a>
          <a className="transition hover:text-seed-500" href="#tools">
            Tools
          </a>
          <a className="transition hover:text-seed-500" href="#build">
            Build
          </a>
        </nav>
        <a
          href="#waitlist"
          className="rounded-full bg-seed-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-seed-700 focus:outline-none focus:ring-2 focus:ring-seed-500 focus:ring-offset-2 focus:ring-offset-earth-50"
        >
          Join the waitlist
        </a>
      </div>
    </header>
  );
}
