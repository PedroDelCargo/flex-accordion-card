# Flex Accordion Card v0.7.0

First public release of an accordion container for Home Assistant Lovelace.

- Unified/separate layouts, optional global header and background.
- Native view badges, nested Lovelace cards and per-section vertical/grid layouts.
- Exclusive mode, height/fade transitions and reduced-motion support.
- Contextual visual editor, section/card/badge reordering, move/copy controls.
- Always-open sections without a header, badges or chevron, for permanent headers and footers.
- Native HA visibility conditions and UI translations in French, English, Spanish and German.

## Installation

Download **flex-accordion-card.js** from the release assets. Copy it to **<config>/www/flex-accordion-card.js**, add **/local/flex-accordion-card.js?v=0.7.0** as a JavaScript module resource, and reload the browser completely. The source archives are for development, not installation.

See the [README](https://github.com/PedroDelCargo/flex-accordion-card#readme) for examples and configuration.

## Validation and compatibility

53 local tests pass using component/DOM doubles. The maintainer confirms successful Home Assistant and mobile testing. Exact HA/browser/device versions have not yet been recorded; no minimum HA version or universal compatibility is claimed. The automated browser suite has not been rerun in the agent environment. Native frontend adapters rely on internal HA components.

HACS custom-repository installation remains to be tested; this project is not yet included in the default HACS catalog.

## Existing configurations

Use **always_open: true** on a section to keep its content open outside exclusive mode. HA visibility conditions still apply. Named title sizes small/medium/large migrate to 16/18/20 px. An omitted text size renders at 16 px. The default transition is 750 ms; explicitly configured durations are preserved.

Licence: MIT.
