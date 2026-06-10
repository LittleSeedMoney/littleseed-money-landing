"use client";

import { FormEvent, useState } from "react";

export function WaitlistForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: Connect this form to the waitlist service when a backend is selected.
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        className="rounded-2xl border border-white/20 bg-white/10 px-6 py-5 text-left"
        role="status"
      >
        <p className="font-semibold text-white">Thanks for your interest.</p>
        <p className="mt-1 text-sm leading-6 text-seed-100">
          The waitlist is not collecting emails yet. Please check back as
          LittleSeed Money takes root.
        </p>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row"
      onSubmit={handleSubmit}
    >
      <label className="sr-only" htmlFor="waitlist-email">
        Email address
      </label>
      <input
        id="waitlist-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="you@example.com"
        className="min-h-12 flex-1 rounded-full border border-white/25 bg-white px-5 text-seed-950 outline-none placeholder:text-seed-800/45 focus:ring-2 focus:ring-earth-300"
      />
      <button
        type="submit"
        className="min-h-12 rounded-full bg-earth-300 px-6 font-bold text-seed-950 transition hover:bg-earth-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-seed-900"
      >
        Join the waitlist
      </button>
    </form>
  );
}
