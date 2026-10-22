# Flex Accordion Card

[English](../README.md) · [Français](README.fr.md) · [Español](README.es.md) · Deutsch

Ein Akkordeon-Container für Home-Assistant-Dashboards mit eingebetteten Lovelace-Karten, nativen Badges und einem kontextbezogenen visuellen Editor.

![Native Anzeige-Karten in einem geöffneten Akkordeon-Abschnitt](images/accordion-toner.png)

[Demonstration ansehen — MP4, 11 s](media/accordion-demo.mp4) · [Weitere Screenshots](SHOWCASE.md)

## Funktionen

- Gemeinsame Karte oder separate Abschnittskarten, mit optionalem Gesamthintergrund.
- Optionale globale Kopfzeile mit Titel, Symbol, Badges und einstellbarer Titelgröße.
- Anklickbare Abschnittsköpfe mit Symbolen und Badges vor dem Aufklapppfeil.
- Native und benutzerdefinierte Lovelace-Karten mit individuellen Breiten und Höhen im nativen Abschnittsraster.
- Exklusiver Modus, immer geöffnete Abschnitte, Höhen- und Überblendanimationen sowie Unterstützung für reduzierte Bewegung.
- Kontextbezogener Editor mit bleibender Navigation, Drag-and-drop, Sortier-, Verschiebe- und Kopierschaltflächen.
- Native Entitäts- und Verknüpfungs-Badges mit Vorschau, Aktionen und individuellen Darstellungsoptionen.
- Sichtbarkeitsbedingungen von Home Assistant für Abschnitte, Badges und eingebettete Karten.
- Oberfläche auf Englisch, Französisch, Spanisch und Deutsch entsprechend der Sprache im Home-Assistant-Profil.

## Installation

### HACS (benutzerdefiniertes Repository)

Die Karte ist als benutzerdefiniertes Repository verfügbar, solange die Aufnahme in den Standardkatalog aussteht. Öffne in HACS das Menü ⋮ → Benutzerdefinierte Repositories, füge `https://github.com/PedroDelCargo/flex-accordion-card` mit der Kategorie **Dashboard** hinzu und lade Flex Accordion Card herunter. Bei Ressourcenverwaltung über die Home-Assistant-Oberfläche registriert HACS das Modul normalerweise automatisch. Behalte nur die HACS-Ressource (`/hacsfiles/flex-accordion-card/flex-accordion-card.js` mit Versionssuffix) und entferne alte manuelle/Testressourcen dieser Karte. In YAML verwaltete Ressourcen müssen manuell eingetragen werden. Lade den Browser vollständig neu.

### Manuelle Installation

1. Lade **flex-accordion-card.js** aus dem [neuesten GitHub-Release](https://github.com/PedroDelCargo/flex-accordion-card/releases/latest) herunter.
2. Kopiere die Datei nach `<config>/www/flex-accordion-card.js` in Home Assistant. Erstelle `www` bei Bedarf und starte Home Assistant danach einmal neu.
3. Füge in den Dashboard-Ressourcen `/local/flex-accordion-card.js?v=0.13.0` als **JavaScript-Modul** hinzu. Aktiviere den erweiterten Modus im Profil, falls das Ressourcenmenü nicht sichtbar ist.
4. Lade den Browser vollständig neu und füge **Flex Accordion Card** zum Dashboard hinzu. Alternativ kannst du die native Karte **Manuell** auswählen und das folgende YAML-Beispiel einfügen.

Bei Ressourcenverwaltung über YAML ergänze die bestehende Konfiguration um die Ressource:

```yaml
lovelace:
  resources:
    - url: /local/flex-accordion-card.js?v=0.13.0
      type: module
```

Zum Aktualisieren ersetze die JavaScript-Datei, ändere den Suffix `?v=` und lade den Browser neu. Registriere die Ressource nur einmal. Zum Deinstallieren entferne die Karten, die Ressource und die JavaScript-Datei.

## Visuellen Editor verwenden

Beginne mit **Allgemeine Einstellungen**, um Darstellung, Hintergrund, exklusiven Modus und Animationen festzulegen. Konfiguriere die optionale globale Kopfzeile und füge Abschnitte hinzu.

Öffne einen Abschnitt, um Kopfzeile, Badges, Karten und Sichtbarkeit zu verwalten. Der Stift öffnet ein Element auf einer eigenen Seite; über die Navigation oben gelangst du zurück. Ziehgriffe oder Pfeiltasten ändern die Reihenfolge. Die Schaltflächen zum Verschieben und Kopieren bieten einen Zielabschnitt an; beim Kopieren steht auch **Aktueller Abschnitt** zur Auswahl.

Wähle beim Hinzufügen eines Badges **Entität** oder **Verknüpfung**. Entitäts-Badges benötigen eine Entität; Verknüpfungen verwenden Text, Symbol und Aktionen ohne Entität. Lege **Inhalt**, **Interaktionen** und **Sichtbarkeit** fest, prüfe die Vorschau und wähle **Badge hinzufügen**. Unter Inhalt lassen sich **Rahmen ausblenden** und **Transparenter Hintergrund** für jedes Badge unabhängig aktivieren, auch für Badges der globalen Kopfzeile.

Wechsle mit **Code-Editor** / **Visueller Editor** den Modus. Zum Hinzufügen einer Karte über ihre Konfiguration wähle **Manuell**, gib YAML ein und wähle **Karte hinzufügen**. Fehlt der native YAML-Editor, wird ein ausdrücklich gekennzeichneter JSON-Editor angeboten.

Aktiviere **Immer geöffnet**, damit ein Abschnitt ohne Kopfzeile, Badges oder Pfeil aufgeklappt bleibt. An erster oder letzter Position eignet er sich als dauerhafter Kopf- oder Fußbereich innerhalb der Karte. Bei Bedarf kannst du darin eine native Überschrift-Karte verwenden. Sichtbarkeitsbedingungen gelten weiterhin.

## YAML-Konfiguration

```yaml
type: custom:flex-accordion-card
layout: unified
exclusive: true
header:
  title: Home
  icon: mdi:home
sections:
  - id: living-room
    title: Living room
    icon: mdi:sofa
    default_open: true
    layout: sections
    cards:
      - type: button
        entity: light.living_room
      - type: markdown
        content: Welcome home
    badges:
      - type: entity
        entity: sensor.living_room_temperature
        show_name: true
        show_state: true
        hide_border: true
      - type: shortcut
        text: Home
        icon: mdi:home
        transparent_background: true
        tap_action:
          action: navigate
          navigation_path: /lovelace/home
  - id: footer
    layout: sections
    always_open: true
    cards:
      - type: markdown
        content: Home sweet home
```

Ersetze die Entitäts-IDs und den Navigationspfad durch deine eigenen. Weitere Beispiele: [Einstieg](../examples/starter.yaml), [immer geöffnete Abschnitte](../examples/always-open.yaml).

## Konfigurationsreferenz

### Globale Optionen

| Option | Standard | Beschreibung |
| --- | --- | --- |
| `type` | erforderlich | Erforderlich; `custom:flex-accordion-card` |
| `layout` | `unified` | `unified` oder `separate` |
| `background` | `false` | Hintergrund und Abstand um alle Abschnitte |
| `exclusive` | `false` | Höchstens ein Akkordeon-Abschnitt geöffnet; alle dürfen geschlossen sein |
| `animation` | `true` | Höhen- und Überblendanimationen |
| `animation_duration` | `750` | Dauer in Millisekunden, Ganzzahl von 0 bis 2000 |
| `header` | keine | Optionale globale Kopfzeile |
| `sections` | erforderlich | Abschnittsliste; darf leer sein |

### Globale Kopfzeile: `header`

| Option | Standard | Beschreibung |
| --- | --- | --- |
| `enabled` | `true` | Kopfzeile anzeigen; Deaktivieren behält die Einstellungen bei |
| `title` | leerer Text | Titel der Kopfzeile |
| `icon` | keine | Home-Assistant-Symbol |
| `text_size` | `16` | Positive Pixelzahl; ein leeres Feld verwendet 16 px |
| `badges` | `[]` | Konfigurationen nativer Ansichts-Badges |

### Jeder Eintrag in `sections`

| Option | Standard | Beschreibung |
| --- | --- | --- |
| `id` | `section-N` | Eindeutige Kennung; verwende stabile IDs in YAML |
| `title` | `Section N` | Abschnittstitel |
| `icon` | keine | Home-Assistant-Symbol |
| `always_open` | `false` | Immer aufgeklappt, ohne Kopfzeile oder Badges; unabhängig vom exklusiven Modus |
| `default_open` | `false` | Anfangszustand; bei immer geöffneten Abschnitten ignoriert |
| `layout` | `sections` | `sections` |
| `cards` | `[]` | Konfigurationen von Lovelace-Karten |
| `badges` | `[]` | Konfigurationen nativer Ansichts-Badges |
| `visibility` | keine | Home-Assistant-Bedingungen für den gesamten Abschnitt |

### Darstellung der Badges

| Option | Standard | Beschreibung |
| --- | --- | --- |
| `hide_border` | `false` | Rahmen und dekorativen Schatten des Badges entfernen |
| `transparent_background` | `false` | Transparenter Hintergrund ohne Hintergrundunschärfe oder dekorativen Schatten |

Die übrigen Karten- und Badge-Einstellungen entsprechen den üblichen Home-Assistant-Optionen. Entitäts-IDs können in `badges` auch als Zeichenketten angegeben werden. Verknüpfungs-Badges benötigen ein Home-Assistant-Frontend, das den nativen Badge-Typ unterstützt. Der Editor meldet, wenn er nicht verfügbar ist.

## Hinweise zur Verwendung

- Immer geöffnete Abschnitte bleiben im normalen Seitenfluss; sie werden nicht am Bildschirm fixiert. Kopfzeilen- und Badge-Einstellungen bleiben beim Wechsel zurück zum Akkordeon erhalten.
- Im exklusiven Modus hat der erste anfangs geöffnete Abschnitt Vorrang. Der Öffnungszustand bleibt während der Lebensdauer der Karte erhalten, wird aber nicht über ein Neuladen der Seite hinaus gespeichert.
- Badges klappen ihren Abschnitt nicht um. Explizite Aktionen haben Vorrang. Ohne explizite Aktion verwenden Entitäts-Badges und Schaltflächen-Karten passende Aktionen für übliche steuerbare Domänen, Tasten, Szenen und Skripte; Sensoren öffnen weitere Informationen.
- Die Sichtbarkeit verwendet native Home-Assistant-Bedingungen. Für die gesamte Karte stehen die Sichtbarkeitsregler des Dashboards zur Verfügung. Verwendet werden native Ansichts-Badges, nicht die speziellen Badges der Überschrift-Karte.
- Benutzerdefinierte Karten benötigen eigene Ressourcen. Karten in geschlossenen Abschnitten bleiben aktiv. Die Kartengrößen folgen dem nativen Abschnittsverhalten.
- Verfügbare native Editoren und Badges hängen von der Home-Assistant-Frontend-Version ab. Badges von Drittanbietern können die Darstellungsoptionen ignorieren. Eigene Namen und Texte werden nicht übersetzt; native Komponenten nutzen die Übersetzungen von Home Assistant.

[MIT License](../LICENSE)

## Abschnittslayout und Aktualisierung

Alle Abschnitte verwenden das native Home-Assistant-Raster mit 12 Spalten. Stelle Breite und Höhe jeder Karte im nativen Layout-Tab ein, falls verfügbar, oder mit `grid_options` im Code. Ziehgriffe der Liste, Pfeile und Verschiebe-/Kopierschaltflächen ändern die Reihenfolge. Direktes Drag-and-drop und Größenänderungsgriffe des nativen Dashboards sind im Akkordeon nicht aktiviert.

**Prüfe nach einer Aktualisierung von Vertikal oder Raster Breite, Höhe und Anordnung der Karten auf Computer und Mobilgeräten.** Die Umwandlung erfolgt automatisch. Vertikal wird zu Karten mit voller Breite und automatischer Höhe. Raster verteilt jede bisherige Reihe auf die 12 nativen Spalten; wenn die Spaltenzahl 12 nicht teilt, unterscheiden sich benachbarte Breiten um eine Einheit (fünf Karten: 3, 3, 2, 2, 2). Eine unvollständige letzte Reihe behält diese Breiten bei. Explizite `grid_options` haben Vorrang. Die bisherige Abschnittsoption `columns` entfällt.

Umgewandelte Karten und ihr Editor zeigen einen Hinweis. Wähle nach der Kontrolle **Layout geprüft** im Editor und speichere die Karte, um die Umwandlung zu speichern und den Hinweis auszublenden. Neue Abschnitte aus dem visuellen Editor zeigen diesen Hinweis nicht.

Die nativen Abschnittskomponenten müssen vom Frontend geladen sein. Falls sie fehlen, öffne eine native HA-Abschnittsansicht, kehre zurück und wähle Erneut versuchen. Die vollständige native Dashboard-Abschnittsansicht wird nicht eingebettet.
