# Flex Accordion Card — 0.7.0

[Français](../README.md) · English · [Español](README.es.md) · [Deutsch](README.de.md)

An accordion container for Home Assistant Lovelace cards, with native view badges and a contextual visual editor. First public release. The maintainer reports successful Home Assistant and mobile testing. Specific HA/browser/device versions have not yet been recorded; no minimum or universal compatibility is claimed. HACS distribution remains unverified.

## Features

Unified or separate sections, optional global header/background, vertical/grid layouts, exclusive mode, height/fade animations, native badges and visibility conditions. Contextual editor with drag-and-drop, move/copy controls and duplication within the same section. The UI follows your HA profile language (fr/en/es/de, regional variants supported); unsupported languages fall back to English. User titles/names are never translated.

## Manual installation

1. Copy `dist/flex-accordion-card.js` to `<config>/www/flex-accordion-card.js`.
2. Add `/local/flex-accordion-card.js?v=0.7.0` as a **JavaScript module** dashboard resource. If you manage resources in YAML, use the existing Lovelace resource configuration.
3. Reload the browser completely. Restart HA once if `www` was newly created.
4. Add Flex Accordion Card, or use a manual card with the example below. No build tools or external runtime dependencies are needed on HA.

```yaml
type: custom:flex-accordion-card
layout: unified
header:
  title: My home
  icon: mdi:home
sections:
  - id: living
    title: Living room
    default_open: true
    cards:
      - type: markdown
        content: Welcome home
```

The default transition duration is 750 ms. Explicit `animation_duration` values are preserved. The header has a 5 px top margin. Its optional numeric `header.text_size` is in pixels: omit it for 16 px and a blank editor field, or use e.g. `19.5`. Clear the field to remove the override. Old small/medium/large values migrate to 16/18/20 px.

Global options: `layout` unified/separate, `background` false, `exclusive` false, `animation` true, `animation_duration` 750 (0–2000 ms), optional `header`, required `sections` list. Header options: `enabled`, `title`, `icon`, optional positive numeric `text_size`, `badges`. Sections: stable `id`, `title`, `icon`, `default_open`, `layout` vertical/grid, `columns` 1–12, `cards`, `badges`, native HA `visibility`. Card and badge configurations use their usual HA schemas. Badges are view badges, not heading-card badges.

## Limits and testing

Native HA components reused here include internal, version-sensitive contracts. Conditional content requires native wrappers. Nested third-party cards need their resources; closed cards stay mounted. Equal-width internal grids do not use child `grid_options` or automatically reduce columns on mobile. Native card/condition editors keep their own spacing. Technical configuration diagnostics may remain in French.

47 local tests pass using DOM/component doubles, without layout rendering. The maintainer reports successful real HA and mobile testing; the automated browser suite has not been rerun. No minimum HA version is claimed yet. For development use Node.js 20+: `node scripts/build.mjs`, then `node --test test/core.test.mjs test/editor.test.mjs`.

[Full configuration reference (French)](../README.md) · [Real HA checklist](VALIDATION.md) · [Publication guide](PUBLISHING.md) · [Contributing / translations](../CONTRIBUTING.md) · [MIT license](../LICENSE)

For an unverified HACS installation trial, add https://github.com/PedroDelCargo/flex-accordion-card as a custom repository, category Dashboard. Check its resource and remove any duplicate manual resource. The project is not yet in the HACS default catalog.

## Always-open sections

Enable “Always open (no header)” in section settings or set `always_open: true`. The content stays open outside exclusive mode, without a header, badges or chevron. Existing header/badge settings are retained for switching back. Add a native `heading` card inside if needed. Place these sections first/last for a permanent card header/footer. HA visibility conditions still apply; `default_open` is ignored while this mode is active. See [the example](../examples/always-open.yaml).
