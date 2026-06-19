# Landing Coding Standards

## Purpose

These standards define frontend code-structure expectations for the LittleSeed
Money landing and private report-review surfaces. Product meaning and scope
remain governed by product-docs. This file covers implementation boundaries,
component size, and maintainability.

## Component Boundaries

Prefer feature-responsibility boundaries over micro-component splitting. Split
code when a file or component has multiple reasons to change, not merely because
a helper could be reused someday.

Signals that a component or file should be split:

- It keeps growing beyond roughly 400 to 500 lines.
- Form state, layout, API submission, row editing, and display sections are
  mixed in the same file.
- A focused change requires reading unrelated screen areas.
- Frequent PRs are likely to conflict in the same file.
- Testable parsing, mapping, validation, or calculation logic is buried inside
  a UI component.

Code that may stay local:

- Small helper components used only inside one screen.
- Label, input, helper-text, and status display pieces that belong to the same
  form context.
- Small experiments whose product structure is not yet approved.
- Tiny components whose extraction would make the call path harder to follow.

For `/private/report-review`, keep the top-level workspace focused on state
ownership and screen composition. Move cohesive feature chunks, such as manual
input sections, asset row editors, liability row editors, and report result
sections, into focused components when they start changing independently.

## UI Logic

Keep deterministic logic out of React components when it needs direct tests or
shared use:

- Request builders, response parsers, mappers, validation, calculations, and
  fixture helpers belong in `lib/report-review`.
- Components should render state, collect input, call helpers, and surface
  errors without reimplementing business rules inline.
- Tests should cover meaningful behavior with realistic inputs, not only that a
  component renders.

## Product Boundary

Do not hide product decisions inside refactors. If a code-structure change also
changes user flow, screen structure, copy meaning, defaults, sample/live data
distinctions, persistence expectations, or recommendation language, treat it as
a product-facing decision and ask before finalizing it.
