# Contributing

This project is being prepared for its first public release. Check the [test recipe](docs/TESTING.md), [real HA validation sheet](docs/VALIDATION.md) and [frontend audit](docs/HA-FRONTEND-AUDIT.md) before reporting compatibility.

Use Node.js 20 or later. Run `node scripts/build.mjs`, `node --test test/core.test.mjs test/editor.test.mjs` and `node --check dist/flex-accordion-card.js`. Commit the rebuilt standalone bundle with source changes. Browser testing uses Playwright; real HA testing is still required for native components and layout.

## Translations

UI messages live in `src/i18n.js`. The French source phrases are stable lookup keys; each key must exist in fr/en/es/de. Preserve placeholder names such as `{name}` and `{action}` in every language. Use `t(hass, key, parameters)` at the UI creation point; never translate user configuration, titles or entity identifiers. Keep YAML keys language-independent.

Locale variants resolve to their base language; unsupported languages fall back to English. Without HA context the local harness defaults to French. Native and third-party components use their own translations. Technical configuration validation diagnostics may still be French.

Add tests for a new phrase or behavior where meaningful. Check accessible button labels, select options, contextual headings and user names. Do not translate a rendered DOM tree or replace an active editor during ordinary `hass` updates.

## Reporting issues

Include module/HA versions, browser, profile language, installation method, expected behavior, reproduction steps and a minimal anonymized configuration. Specify native or third-party cards. Do not include tokens, private URLs or personal entity data. Screenshots should illustrate the actual version under test.

Keep changes focused and explain behavior and validation. The native HA helpers used by this card include internal contracts: inspect current frontend code when changing those adapters. Passing local mock tests does not establish support for a HA release.
