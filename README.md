# Flex Accordion Card

Un conteneur accordéon pour les cartes Lovelace de Home Assistant, avec badges natifs et éditeur visuel contextuel.

Français · [English](docs/README.en.md) · [Español](docs/README.es.md) · [Deutsch](docs/README.de.md)

**Version 0.7.0 — première publication.** Fonctionnement sur Home Assistant et tests mobiles validés par le mainteneur. Les 53 tests locaux avec doubles DOM/composants passent également. Les versions HA, navigateurs et appareils testés ne sont pas encore renseignées : aucune compatibilité universelle ni version minimale n’est annoncée. La distribution HACS reste à valider.

## Fonctionnalités

- Dispositions `unified` et `separate`, fond global facultatif.
- En-têtes de section cliquables, badges avant les chevrons, navigation clavier.
- En-tête global facultatif avec icône, titre, badges et taille du texte personnalisable.
- Cartes Lovelace natives/personnalisées imbriquées ; disposition verticale ou grille par section.
- Mode exclusif, animation de hauteur et fondu, respect du mouvement réduit.
- Éditeur contextuel, accordéons, navigation persistante et champs compacts.
- Glisser-déposer et boutons de réorganisation ; déplacement/copie entre sections et duplication dans la section courante.
- Badges de vue et conditions de visibilité natives HA.
- Interface français/anglais/espagnol/allemand selon la langue du profil HA ; repli anglais pour les autres langues.

## Installation manuelle

1. Copier `dist/flex-accordion-card.js` dans `<config>/www/flex-accordion-card.js` sur HA. Le fichier est déjà construit.
2. Ajouter la ressource `/local/flex-accordion-card.js?v=0.7.0`, type **module JavaScript**. Le menu Ressources nécessite le mode avancé du profil.
3. Recharger complètement le navigateur. Si `www` vient d’être créé, redémarrer HA une fois.
4. Ajouter « Flex Accordion Card » ou une carte manuelle avec [cet exemple](examples/starter.yaml).

Si vos ressources sont gérées en YAML, fusionner ceci avec votre configuration existante, sans second bloc `lovelace` :

```yaml
lovelace:
  resources:
    - url: /local/flex-accordion-card.js?v=0.7.0
      type: module
```

À chaque mise à jour, remplacer le module et changer `?v=`. Pour désinstaller, retirer les cartes, la ressource puis le fichier. Le dépôt est [PedroDelCargo/flex-accordion-card](https://github.com/PedroDelCargo/flex-accordion-card). Pour un essai HACS, ajouter cette URL comme dépôt personnalisé, catégorie **Dashboard**, puis installer Flex Accordion Card. Vérifier la ressource créée et retirer l’ancienne ressource manuelle pour ne pas charger le module deux fois. Cette procédure HACS reste à valider ; le projet n’est pas encore référencé au catalogue par défaut.

## Exemple

```yaml
type: custom:flex-accordion-card
layout: unified
exclusive: true
header:
  title: Ma maison
  icon: mdi:home
sections:
  - id: salon
    title: Salon
    icon: mdi:sofa
    default_open: true
    layout: grid
    columns: 2
    cards:
      - type: markdown
        content: Bienvenue dans le salon
      - type: button
        entity: light.salon # Remplacer par votre entité
    badges:
      - type: entity
        entity: sensor.temperature_salon # Remplacer par votre entité
        show_name: true
        show_state: true
```

Sans `animation_duration`, la transition dure 750 ms. Sans `header.text_size`, le titre fait 16 px et le champ numérique reste vide. Exemple de personnalisation : `text_size: 19.5`. Effacer le champ rétablit le défaut et retire l’option du YAML.

## Configuration

| Option globale | Défaut | Description |
| --- | --- | --- |
| `type` | obligatoire | `custom:flex-accordion-card` |
| `layout` | `unified` | `unified` ou `separate` |
| `background` | `false` | Fond et marge autour de toutes les sections |
| `exclusive` | `false` | Une seule section ouverte ; toutes peuvent être fermées |
| `animation` | `true` | Animation de hauteur et fondu |
| `animation_duration` | `750` | Entier de 0 à 2000 ms |
| `header` | absent | En-tête global facultatif, indépendant des sections |
| `sections` | obligatoire | Liste des sections, éventuellement vide |

| Option de `header` | Défaut | Description |
| --- | --- | --- |
| `enabled` | `true` | Affichage ; désactiver conserve les réglages |
| `title` | chaîne vide | Titre |
| `icon` | aucune | Icône HA |
| `text_size` | absent, rendu 16 px | Nombre positif de pixels ; champ vide tant que non personnalisé |
| `badges` | `[]` | Badges de vue HA |

| Option de section | Défaut | Description |
| --- | --- | --- |
| `id` | `section-N` | Identifiant unique ; donner des ids stables en YAML |
| `title` | `Section N` | Nom affiché |
| `icon` | aucune | Icône HA |
| `always_open` | `false` | Section toujours ouverte, sans en-tête/badges/chevron, hors mode exclusif |
| `default_open` | `false` | État initial ; recharger pour tester un changement |
| `layout` | `vertical` | `vertical` ou `grid` |
| `columns` | `2` | Colonnes égales en grille, entier de 1 à 12 |
| `cards` | `[]` | Configurations Lovelace |
| `badges` | `[]` | Badges de vue HA ; une chaîne devient un badge `entity` |
| `visibility` | aucune | Conditions HA pour la section entière |

En mode exclusif, la première section initialement ouverte gagne. Les ids stables préservent l’état ouvert lors des réordonnancements. Cet état reste en mémoire pendant la vie de la carte, sans stockage persistant.

Les actions des badges ne déclenchent pas l’accordéon. Sans action explicite, les badges d’entité et cartes `button`/`entity-button` reçoivent une action adaptée : basculer pour les domaines commandables usuels, appuyer pour les boutons, activer pour scène/script, plus d’informations pour les capteurs. Une action explicite reste prioritaire ; les autres types gardent leur comportement natif.

## Éditeur et langues

La vue d’ensemble affiche réglages généraux, en-tête global puis sections. Chaque section regroupe En-tête, Badges, Cartes puis Visibilité. Le crayon ouvre une page dédiée à la carte ou au badge, avec retour vers sa liste. La navigation reste visible au défilement ; un thème peut ajuster `--flex-accordion-editor-sticky-top`.

Les listes affichent les noms personnalisés ou friendly names et les types localisés. Les poignées réordonnent ; les boutons permettent aussi de travailler au clavier/tactile. « Copier dans une section » inclut la section courante et crée une copie indépendante.

Les composants HA disponibles fournissent catalogues, sélecteurs, éditeurs de cartes, conditions et YAML. Les badges `entity` ont un formulaire contrôlé avec sélecteurs HA. Le format d’heure apparaît uniquement pour un contenu temporel affiché. Les réglages et les conditions dépliées sont conservés pendant la saisie et les rafraîchissements `hass`. « Éditeur de code » / « Éditeur visuel » change de mode ; un repli JSON explicite est proposé lorsque les composants nécessaires manquent.

La langue suit `hass.locale.language` ou `hass.language`, variantes régionales comprises. Les noms/textes saisis ne sont jamais traduits. Les composants natifs/tiers et leurs diagnostics gardent leurs traductions. Les messages techniques de validation de configuration peuvent rester en français.

## Migration

Les anciennes valeurs `header.text_size: small/medium/large` sont converties en 16/18/20 px pour conserver l’apparence choisie. Aucune taille n’est ajoutée si l’option est absente. Une durée déjà définie, y compris 220 ms, reste inchangée : retirer `animation_duration` ou choisir 750 pour adopter la nouvelle durée. Voir [CHANGELOG.md](CHANGELOG.md).

## Compatibilité et limites

- Les composants internes HA réutilisés ne sont pas une API stable : voir [l’audit](docs/HA-FRONTEND-AUDIT.md). Aucune version minimale HA n’est annoncée avant les tests réels.
- Les badges sont des **badges de vue**, pas ceux spécifiques à la carte native `heading`.
- Les wrappers HA évaluent les conditions. S’ils manquent, une erreur explicite remplace le contenu conditionnel.
- Les éditeurs des cartes intégrées et des conditions gardent leur présentation. Les champs Flex Accordion sont compactés sans modifier le DOM privé HA.
- Les cartes tierces requièrent leurs ressources et peuvent avoir des limitations de conteneur/éditeur. Tester les graphiques/médias au premier dépliage.
- Les cartes fermées restent montées et reçoivent `hass` ; cela ne réduit pas leur activité.
- La grille interne utilise des colonnes égales, sans `grid_options` enfants ni réduction automatique des colonnes sur mobile.
- La taille masonry est estimée. Tester aussi les vues Sections, thèmes et navigateurs mobiles.

## Développement et publication

Node.js 20 ou supérieur :

```text
node scripts/build.mjs
node --test test/core.test.mjs test/editor.test.mjs
node scripts/serve.mjs
```

La démo sur `http://127.0.0.1:8124` simule HA. Pour Playwright : `npm install`, `npx playwright install chromium`, puis `npm run test:browser`.

- [Résultats et recette](docs/TESTING.md)
- [Fiche de validation HA réel](docs/VALIDATION.md)
- [Contribution et traductions](CONTRIBUTING.md)
- [Préparation GitHub et HACS](docs/PUBLISHING.md)

Module autonome dans `dist/`, sources dans `src/`, aucune dépendance d’exécution externe. Licence [MIT](LICENSE).

## Sections toujours ouvertes

Dans les réglages de la section, activer « Toujours ouverte (sans en-tête) », ou définir `always_open: true` en YAML. Le contenu reste ouvert même lorsque le mode exclusif est activé. L’en-tête, les badges et le chevron ne sont pas créés ; leurs réglages sont conservés pour revenir au mode accordéon. Le titre reste un nom de repérage dans l’éditeur.

Placer ces sections au début ou à la fin de la liste pour composer un en-tête ou un pied de carte permanent. Leur contenu peut inclure une carte HA `heading`. Les dispositions verticale/grille, l’édition et la réorganisation des cartes restent disponibles. Les conditions de visibilité HA continuent de s’appliquer ; `default_open` est ignoré tant que la section est toujours ouverte. Les badges ne peuvent pas être déplacés/copiés vers une section sans en-tête.

Voir [l’exemple en-tête et pied permanents](examples/always-open.yaml).
