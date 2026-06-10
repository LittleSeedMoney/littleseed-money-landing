import { SeedMark } from "@/components/seed-mark";

export function Footer() {
  return (
    <footer className="border-t border-seed-900/10 bg-earth-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 sm:flex-row sm:items-end sm:justify-between lg:px-8">
        <div>
          <div className="flex items-center gap-2 font-semibold text-seed-950">
            <SeedMark className="h-7 w-7 text-seed-600" />
            LittleSeed Money
          </div>
          <p className="mt-2 font-display text-seed-800">
            Small steps. Wise growth.
          </p>
        </div>
        <p className="max-w-xl text-sm leading-6 text-seed-800/65 sm:text-right">
          LittleSeed Money is for educational purposes only and does not
          provide individualized legal, tax, or investment advice.
        </p>
      </div>
    </footer>
  );
}
