import { reportReviewNavItems } from "./shared";

export function ReportReviewNav() {
  return (
    <>
      <div className="lg:hidden">
        <nav
          aria-label="Report review sections"
          className="flex gap-2 overflow-x-auto pb-1 text-sm"
        >
          {reportReviewNavItems.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="whitespace-nowrap rounded-lg border border-stone-200 bg-white px-3 py-2 font-medium text-earth-700 shadow-sm hover:text-seed-950 focus:outline-none focus:ring-2 focus:ring-seed-500"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>

      <aside className="hidden lg:block">
        <nav
          aria-label="Report review sections"
          className="sticky top-6 space-y-1 text-sm"
        >
          {reportReviewNavItems.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="block rounded-lg px-3 py-2 font-medium text-earth-700 hover:bg-white hover:text-seed-950 focus:outline-none focus:ring-2 focus:ring-seed-500"
            >
              {label}
            </a>
          ))}
        </nav>
      </aside>
    </>
  );
}
