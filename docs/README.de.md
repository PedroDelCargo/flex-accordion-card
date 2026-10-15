# Flex Accordion Card — 0.7.0

[Français](../README.md) · [English](README.en.md) · [Español](README.es.md) · Deutsch

Ein Akkordeon-Container für Home-Assistant-Lovelace-Karten mit nativen Ansichts-Badges und einem kontextbezogenen visuellen Editor. Erste Veröffentlichung. Der Maintainer bestätigt erfolgreiche Tests mit Home Assistant und auf Mobilgeräten. Genaue HA-/Browser-/Geräteversionen sind noch nicht dokumentiert; eine Mindestversion oder allgemeine Kompatibilität wird nicht zugesichert. Die HACS-Verteilung ist noch unbestätigt.

## Funktionen

Gemeinsame oder getrennte Abschnitte, optionaler Kartenkopf und Hintergrund, vertikale Anordnung oder Raster, exklusiver Modus sowie Höhenanimation mit Ein-/Ausblenden. Kontextbezogener Editor mit Drag-and-drop, Verschieben und Kopieren zwischen Abschnitten sowie Duplizieren im aktuellen Abschnitt. Native Sichtbarkeitsbedingungen. Die Oberfläche folgt der HA-Profilsprache (fr/en/es/de einschließlich regionaler Varianten), sonst Englisch. Eigene Namen und Titel werden nicht übersetzt.

## Manuelle Installation

1. `dist/flex-accordion-card.js` nach `<config>/www/flex-accordion-card.js` kopieren.
2. `/local/flex-accordion-card.js?v=0.7.0` als Dashboard-Ressource vom Typ **JavaScript-Modul** hinzufügen. Bei YAML-Ressourcen die bestehende Lovelace-Konfiguration ergänzen.
3. Browser vollständig neu laden. HA einmal neu starten, falls `www` gerade erst erstellt wurde.
4. Flex Accordion Card hinzufügen oder eine manuelle Karte mit folgendem Beispiel verwenden. Auf HA werden keine Build-Werkzeuge oder externen Laufzeitabhängigkeiten benötigt.

```yaml
type: custom:flex-accordion-card
layout: unified
header:
  title: Mein Zuhause
  icon: mdi:home
sections:
  - id: wohnzimmer
    title: Wohnzimmer
    default_open: true
    cards:
      - type: markdown
        content: Willkommen zu Hause
```

Die Standardübergangsdauer beträgt 750 ms. Ein vorhandener Wert für `animation_duration` bleibt erhalten. Der Kartenkopf erhält 5 px oberen Abstand. `header.text_size` ist eine optionale Zahl in Pixeln, etwa `19.5`. Ohne diesen Eintrag gelten 16 px und das Eingabefeld bleibt leer. Leeren entfernt die Anpassung. Alte Werte small/medium/large werden in 16/18/20 px umgewandelt.

Globale Optionen: `layout` unified/separate, `background` false, `exclusive` false, `animation` true, `animation_duration` 750 (0–2000 ms), optionaler `header`, erforderliche Liste `sections`. Kartenkopf: `enabled`, `title`, `icon`, optionale positive Zahl `text_size`, `badges`. Abschnitt: stabile `id`, `title`, `icon`, `default_open`, `layout` vertical/grid, `columns` 1–12, `cards`, `badges`, native HA-`visibility`. Karten und Badges verwenden ihre üblichen HA-Schemata. Es handelt sich um Ansichts-Badges, nicht um die speziellen Badges der heading-Karte.

## Grenzen und Tests

Verwendete interne HA-Komponenten können sich ändern. Sichtbarkeit benötigt native Wrapper. Drittanbieterkarten benötigen ihre Ressourcen; geschlossene Karten bleiben eingebunden. Das interne Raster übernimmt keine `grid_options` der Kinder und reduziert Spalten auf Mobilgeräten nicht automatisch. Native Editoren behalten ihre Abstände. Technische Konfigurationsdiagnosen können weiterhin französisch sein.

53 lokale Tests mit DOM-/Komponentendoubles bestanden, ohne Layout-Engine. Der Maintainer bestätigt HA- und Mobiltests; automatisierte Browsertests stehen aus; eine minimale HA-Version wird noch nicht zugesichert. Entwicklung mit Node.js 20+: `node scripts/build.mjs`, dann `node --test test/core.test.mjs test/editor.test.mjs`.

[Vollständige Referenz auf Französisch](../README.md) · [HA-Prüfliste](VALIDATION.md) · [Veröffentlichung](PUBLISHING.md) · [Beiträge und Übersetzungen](../CONTRIBUTING.md) · [MIT-Lizenz](../LICENSE)

Für einen noch unbestätigten HACS-Installationstest https://github.com/PedroDelCargo/flex-accordion-card als benutzerdefiniertes Repository der Kategorie Dashboard hinzufügen. Die Ressource prüfen und doppelte manuelle Ressourcen entfernen. Noch nicht im HACS-Standardkatalog gelistet.

## Immer geöffnete Abschnitte

Aktiviere „Immer geöffnet (ohne Kopfzeile)“ oder setze `always_open: true`. Der Inhalt bleibt unabhängig vom exklusiven Modus geöffnet, ohne Kopfzeile, Badges oder Chevron. Vorhandene Einstellungen bleiben für die Rückkehr zum Akkordeon erhalten. Eine native `heading`-Karte kann als Inhalt dienen. Diese Abschnitte lassen sich an den Anfang oder das Ende als dauerhafter Kartenkopf/-fuß setzen. HA-Sichtbarkeitsbedingungen gelten weiterhin; `default_open` wird in diesem Modus ignoriert. Siehe [Beispiel](../examples/always-open.yaml).
