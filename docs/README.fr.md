# Flex Accordion Card

[English](../README.md) · Français · [Español](README.es.md) · [Deutsch](README.de.md)

Un conteneur accordéon pour les tableaux de bord Home Assistant, avec cartes Lovelace imbriquées, badges natifs et éditeur visuel contextuel.

![Cartes jauges natives dans une section accordéon ouverte](images/accordion-toner.png)

Voir la démonstration — MP4, 11 s

https://github.com/user-attachments/assets/cee9c77f-e56f-4211-a526-4a8265ccddc8

[Autres captures](SHOWCASE.md)

## Fonctionnalités

- Carte unique ou cartes séparées par section, avec fond global facultatif.
- En-tête global facultatif avec titre, icône, badges et taille du titre réglable.
- En-têtes de section cliquables avec icônes et badges placés avant le chevron.
- Cartes Lovelace natives et personnalisées avec largeur et hauteur individuelles dans la grille native Sections.
- Mode exclusif, sections toujours ouvertes, animations de hauteur et fondu, respect du mouvement réduit.
- Éditeur contextuel avec navigation persistante, glisser-déposer, boutons de réorganisation, déplacement et copie.
- Badges natifs Entité et Raccourci avec aperçu, actions et options d’apparence individuelles.
- Conditions de visibilité Home Assistant pour les sections, badges et cartes intégrées.
- Interface en anglais, français, espagnol et allemand selon la langue de votre profil Home Assistant.

## Installation

### HACS (dépôt personnalisé)

La carte est disponible comme dépôt personnalisé en attendant son admission au catalogue par défaut. Dans HACS, ouvrir le menu ⋮ → Dépôts personnalisés, ajouter `https://github.com/PedroDelCargo/flex-accordion-card`, catégorie **Dashboard / Tableau de bord**, puis télécharger Flex Accordion Card. Lorsque les ressources sont gérées dans l’interface Home Assistant, HACS enregistre normalement le module automatiquement. Conserver uniquement la ressource HACS (`/hacsfiles/flex-accordion-card/flex-accordion-card.js` avec son suffixe de version) et retirer toute ancienne ressource manuelle/de test de cette carte. Les ressources gérées en YAML doivent être déclarées manuellement. Recharger complètement le navigateur.

### Installation manuelle

1. Télécharger **flex-accordion-card.js** depuis la [dernière version GitHub](https://github.com/PedroDelCargo/flex-accordion-card/releases/latest).
2. Le copier dans `<config>/www/flex-accordion-card.js` sur votre installation Home Assistant. Créer `www` si nécessaire ; redémarrer Home Assistant une fois après sa création.
3. Dans les ressources du tableau de bord, ajouter `/local/flex-accordion-card.js?v=1.0.0`, type **module JavaScript**. Activer le mode avancé du profil si le menu Ressources est masqué.
4. Recharger complètement le navigateur, puis ajouter **Flex Accordion Card** au tableau de bord. Vous pouvez aussi choisir la carte native **Manuel** et coller l’exemple YAML ci-dessous.

Pour les tableaux de bord dont les ressources sont gérées en YAML, ajouter la ressource à la configuration existante :

```yaml
lovelace:
  resources:
    - url: /local/flex-accordion-card.js?v=1.0.0
      type: module
```

Pour mettre à jour, remplacer le fichier JavaScript, changer le suffixe `?v=` puis recharger le navigateur. Enregistrer la ressource une seule fois. Pour désinstaller, retirer les cartes, la ressource et le fichier JavaScript.

## Utiliser l’éditeur visuel

Commencer par les **Réglages généraux** pour choisir la présentation, le fond, le mode exclusif et les animations. Configurer l’en-tête global facultatif, puis ajouter les sections.

Ouvrir une section pour gérer son en-tête, ses badges, ses cartes et sa visibilité. Le crayon ouvre chaque élément sur une page dédiée ; la navigation en haut permet de revenir au parent. Les poignées ou flèches réorganisent les éléments. Les boutons de déplacement et de copie proposent une section de destination ; la copie inclut la **Section actuelle**.

À l’ajout d’un badge, choisir **Entité** ou **Raccourci**. Un badge Entité nécessite une entité ; un Raccourci utilise texte, icône et actions sans entité. Régler **Contenu**, **Interactions** et **Visibilité**, vérifier l’aperçu puis cliquer sur **Ajouter le badge**. Dans Contenu, **Masquer la bordure** et **Fond transparent** sont indépendants pour chaque badge, y compris ceux de l’en-tête global.

Utiliser **Éditeur de code** / **Éditeur visuel** pour changer de mode. Pour ajouter une carte à partir de sa configuration, choisir **Manuel**, saisir son YAML puis cliquer sur **Ajouter la carte**. Si l’éditeur YAML natif est indisponible, un éditeur JSON explicitement indiqué est proposé.

Activer **Toujours ouverte** pour une section dépliée sans en-tête, badge ni chevron. La placer au début ou à la fin pour créer un en-tête ou pied permanent dans la carte. Ajouter une carte native En-tête à l’intérieur si besoin. Les conditions de visibilité restent applicables.

## Configuration YAML

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

Remplacer les identifiants d’entité et le chemin de navigation par les vôtres. Autres exemples : [démarrage](../examples/starter.yaml), [sections toujours ouvertes](../examples/always-open.yaml).

## Référence de configuration

### Options globales

| Option | Défaut | Description |
| --- | --- | --- |
| `type` | obligatoire | Obligatoire ; `custom:flex-accordion-card` |
| `layout` | `unified` | `unified` ou `separate` |
| `background` | `false` | Fond et espacement autour de toutes les sections |
| `exclusive` | `false` | Une seule section accordéon ouverte au maximum ; toutes peuvent être fermées |
| `animation` | `true` | Animations de hauteur et fondu |
| `animation_duration` | `750` | Durée en millisecondes, entier de 0 à 2000 |
| `header` | aucun | En-tête global facultatif |
| `sections` | obligatoire | Liste des sections ; peut être vide |

### En-tête global : `header`

| Option | Défaut | Description |
| --- | --- | --- |
| `enabled` | `true` | Afficher l’en-tête ; le désactiver conserve ses réglages |
| `title` | texte vide | Titre de l’en-tête |
| `icon` | aucun | Icône Home Assistant |
| `text_size` | `16` | Nombre positif de pixels ; un champ vide utilise 16 px |
| `badges` | `[]` | Configurations de badges de vue natifs |

### Chaque entrée de `sections`

| Option | Défaut | Description |
| --- | --- | --- |
| `id` | `section-N` | Identifiant unique ; utiliser des ids stables en YAML |
| `title` | `Section N` | Titre de section |
| `icon` | aucun | Icône Home Assistant |
| `always_open` | `false` | Toujours dépliée, sans en-tête ni badges ; indépendante du mode exclusif |
| `default_open` | `false` | État initial ; ignoré pour les sections toujours ouvertes |
| `layout` | `sections` | `sections` |
| `cards` | `[]` | Configurations de cartes Lovelace |
| `badges` | `[]` | Configurations de badges de vue natifs |
| `visibility` | aucun | Conditions Home Assistant pour la section entière |

### Apparence des badges

| Option | Défaut | Description |
| --- | --- | --- |
| `hide_border` | `false` | Retirer la bordure du badge et son ombre décorative |
| `transparent_background` | `false` | Fond transparent sans flou ni ombre décorative |

Les autres réglages des cartes et badges suivent leurs options habituelles Home Assistant. Les identifiants d’entité peuvent aussi être fournis sous forme de chaînes dans `badges`. Les badges Raccourci nécessitent une version du frontend Home Assistant prenant en charge ce badge natif. L’éditeur signale son indisponibilité.

## Conseils d’utilisation

- Les sections toujours ouvertes restent dans le flux normal de la page ; elles ne sont pas épinglées à l’écran. Leurs réglages d’en-tête et badges sont conservés pour revenir au mode accordéon.
- En mode exclusif, la première section ouverte au chargement a priorité. L’état ouvert/fermé est conservé pendant la présence de la carte, sans persistance après rechargement de la page.
- Les badges ne replient pas leur section. Les actions explicites sont prioritaires. Sans action explicite, les badges Entité et cartes Bouton utilisent une action adaptée aux domaines commandables usuels, boutons, scènes et scripts ; les capteurs ouvrent les informations.
- La visibilité utilise les conditions natives Home Assistant. La carte globale dispose des contrôles de visibilité du tableau de bord. Les badges sont des badges de vue natifs, distincts de ceux spécifiques à la carte En-tête.
- Les cartes personnalisées nécessitent leurs propres ressources. Les sections fermées gardent leurs cartes actives. Les dimensions des cartes suivent le comportement natif Sections.
- Les éditeurs natifs et les badges disponibles dépendent de la version du frontend Home Assistant. Les badges tiers peuvent ignorer les options d’apparence. Les noms et textes saisis ne sont jamais traduits ; les composants natifs utilisent les traductions Home Assistant.

[MIT License](../LICENSE)

## Présentation Sections et mise à jour

Toutes les sections utilisent la grille native Home Assistant de 12 colonnes. Régler la largeur et la hauteur de chaque carte dans son onglet natif Disposition, si disponible, ou avec `grid_options` en code. Les poignées de liste, flèches et boutons de déplacement/copie réorganisent les cartes. Le glisser-déposer et les poignées de redimensionnement du tableau de bord natif ne sont pas activés dans l’accordéon.

**Après une mise à jour depuis Verticale ou Grille, vérifier les largeurs, hauteurs et positions des cartes sur ordinateur et mobile.** La conversion est automatique. Verticale devient une succession de cartes pleine largeur à hauteur automatique. Grille répartit chaque ancienne rangée sur les 12 colonnes natives ; si le nombre de colonnes ne divise pas 12, les largeurs voisines diffèrent d’une unité (cinq cartes : 3, 3, 2, 2, 2). La dernière rangée incomplète garde les mêmes largeurs. Les `grid_options` explicites sont prioritaires. L’ancienne option `columns` de section est supprimée.

Un avertissement apparaît sur les cartes converties et dans leur éditeur. Après contrôle, cliquer sur **Disposition vérifiée** dans l’éditeur puis enregistrer la carte pour mémoriser la conversion et retirer l’avertissement. Les nouvelles sections créées dans l’éditeur visuel ne présentent pas cet avertissement.

Les composants natifs de section doivent être chargés par le frontend. S’ils sont indisponibles, ouvrir une vue Sections HA native, revenir à la carte puis cliquer sur Réessayer. La vue de tableau de bord Sections complète n’est pas intégrée.
