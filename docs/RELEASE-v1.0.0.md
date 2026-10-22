# Flex Accordion Card v1.0.0

The first major stable release, following successful desktop and mobile testing by the maintainer.

## Features

- Unified or separate accordion sections, with an optional global header and background.
- Nested native and custom Lovelace cards using Home Assistant’s native Sections grid and individual card sizes.
- Native Entity and Shortcut badges, configurable actions and appearance, and visibility conditions.
- Always-open sections, exclusive mode, animated height and fading, and reduced-motion support.
- Contextual visual editor with reorder, drag-and-drop and move/copy controls.
- English, French, Spanish and German interface and user guides.

This release retains the functionality of v0.13.0 and adds real screenshots, a demonstration video, HACS custom-repository installation instructions and the official HACS validation workflow. Admission to the default HACS catalog has not yet been requested.

## Upgrading

**When upgrading from the former Vertical or Grid layouts, check card widths, heights and positions on desktop and mobile after automatic conversion to Sections.** Confirm “Layout checked” in the editor and save after reviewing the result.

Update through HACS if installed as a custom repository. For manual installations, replace the JavaScript file, use `/local/flex-accordion-card.js?v=1.0.0` as the JavaScript module resource, and reload the browser completely. Keep only one resource for this card.

Download `flex-accordion-card.js` below. It contains the card, editor and translations; no additional runtime files are required.

## Validation

84 automated tests pass. All four translation dictionaries contain 148 entries with matching placeholders. The maintainer confirmed the real Home Assistant rendering, mobile behavior and layout conversions. GitHub CI and official HACS validation must pass on the release commit before publication.
