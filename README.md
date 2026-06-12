# LittleSeed Money

LittleSeed Money is building evidence-based financial tools that help people
understand money, compare meaningful choices, and grow with wisdom and purpose.

```text
Small steps. Wise growth.
```

This repository contains public pages, brand assets, education content, and the
future web interface. Private financial models and internal product documents
live in separate private repositories.

The project combines transparent financial models, modern data engineering,
trusted sources, and clear explanations.

AI, automation, and digital assets are part of the changing financial
environment the product addresses. They are not the boundary of the brand or
its long-term mission. AI supports explanation where it adds real value; it
does not replace the underlying calculations.

## Development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Private report-review API integration:

```bash
LITTLESEED_PLATFORM_API_URL=http://127.0.0.1:8000 npm run dev
```

`LITTLESEED_PLATFORM_API_URL` is server-side only. When it is unset or the
platform request fails, `/private/report-review` falls back to sample data and
shows the connection state in the page.
