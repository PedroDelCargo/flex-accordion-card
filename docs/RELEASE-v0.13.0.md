# Flex Accordion Card v0.13.0

## Check your layout after upgrading

**Vertical and Grid layouts are automatically converted to native Sections. Please check card widths, heights and placement on desktop and mobile after installing this update.**

Vertical cards become full width with automatic height. Grid rows are distributed across 12 native columns. Counts that do not divide 12 use neighbouring widths differing by one unit (five cards: 3, 3, 2, 2, 2); incomplete rows retain the same widths. Existing explicit `grid_options` take priority.

A notice remains on converted cards and in their editor. Once you have checked the layout, select **Layout checked** in the editor and save the card. This stores the converted configuration and removes the notice.

Sections is now the only layout within an accordion section. Set card dimensions in the native Layout tab, when available, or with `grid_options` in code. The top-level unified/separate card layouts remain available.

Download `flex-accordion-card.js`, replace your existing module and reload your browser completely. For manual installations, use `/local/flex-accordion-card.js?v=0.13.0` as the JavaScript module resource. Keep only one resource active.

Native section components must be loaded by the Home Assistant frontend. If they are unavailable, open a native Sections view, return and select Retry. The built-in list controls continue to handle card reordering.

The maintainer has validated native Sections on desktop and mobile and confirmed successful automatic layout conversion. All 84 local automated tests pass. No submission to the default HACS catalog has been made.
