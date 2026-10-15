# Historique

## 0.7.0 — 15 octobre 2026

- Option de section always_open : contenu toujours ouvert, sans en-tête, badges ni chevron, indépendant du mode exclusif.
- Bascule visuelle réversible, réglages de l’en-tête/badges conservés, conditions HA toujours applicables.
- Configuration, quatre traductions et exemple d’en-tête/pied permanents documentés.
- 53 tests locaux réussis ; rendu sur HA réel restant à vérifier.


## 0.6.0 — 15 octobre 2026

- Marge supérieure de 5 px pour l’en-tête global.
- Taille numérique libre du titre en pixels : défaut 16 px sans valeur affichée ni option YAML ajoutée ; effacer rétablit le défaut. Migration des anciennes tailles prédéfinies.
- Durée de transition par défaut de 750 ms, sans écraser les durées explicites.
- Interface fr/en/es/de selon le profil HA, variantes régionales et repli anglais ; données utilisateur préservées.
- README réorganisé avec guides dans quatre langues, contribution, fiche de validation réelle, préparation GitHub/HACS et CI sans publication automatique.
- 47 tests locaux réussis ; validation réelle HA et HACS restant à effectuer.


## 0.5.0 — 15 octobre 2026

- En-tête global compact et taille du titre réglable (16/18/20 px).
- Espacement harmonisé des champs gérés par Flex Accordion, avec sélecteurs HA conservés.
- Type de l’élément ajouté avant son nom dans les titres d’édition.
- Fondu du contenu synchronisé avec l’animation des sections.
- Copie indépendante dans la section courante, y compris avec une seule section.
- 40 tests locaux réussis ; rendu réel dans HA restant à vérifier.


## 0.4.0 — 15 octobre 2026

- En-tête global facultatif : icône, titre et badges natifs, avec édition contextuelle.
- Visibilité placée après les badges et cartes dans les réglages de section.
- Trait des icônes légèrement allégé ; options d’affichage des badges compactées en lignes de 40 px.
- Correction du repli des conditions : conservation des objets utilisés par l’éditeur HA, dont les clés dépendent de leur identité, sans partager les objets de la configuration enregistrée.
- 36 tests locaux réussis ; validation visuelle sur une instance HA restant à effectuer.


## 0.3.0 — 15 octobre 2026

- Réglages généraux avant les sections, navigation de retour sticky, icônes SVG épaisses et homogènes.
- Actions par ligne pour déplacer ou copier dans une autre section, sans sélecteur ni zone de transfert redondants ; copie profonde indépendante.
- Suppression des numéros d’ordre et localisation des noms de types de cartes.
- Bouton « Éditeur de code » / « Éditeur visuel » avec icônes.
- Option `background` pour un fond global aux couleurs du thème, autour des sections.
- Conditions de visibilité de section et de badge, éditées avec les composants HA disponibles et évaluées par les wrappers HA. Repli de badge vers le wrapper de carte si nécessaire.
- Badge `entity` : contrôleur de formulaire propre au conteneur, sélecteurs et éditeur YAML natifs ; format d’heure visible seulement quand le contenu temporel affiché le nécessite. Aucun patch global du frontend HA.
- 30 tests locaux réussis. Pas de nouvelle validation visuelle ou d’exécution sur une instance HA par l’agent.

## 0.2.0 — 15 octobre 2026

- Correction du badge contrôlé : après `config-changed`, renvoi de la configuration complète à l’éditeur natif (`setConfig` direct ou `value` pour le wrapper), sans remplacer le formulaire. Les rafraîchissements `hass`, les allers-retours identiques de configuration et les imports tardifs ne réinitialisent plus l’éditeur actif.
- Les suppressions volontaires d’options restent possibles ; aucune fusion aveugle ne restaure un ancien nom. Les événements d’un ancien éditeur fermé sont ignorés.
- En-tête : titre/icône, badges, puis chevron SVG avec trait épais. Le chevron conserve la zone de clic de l’en-tête.
- Navigation contextuelle : vue d’ensemble des sections, réglages d’une section, page dédiée à un élément. Bouton de retour vers la section et la liste d’origine.
- Accordéons pour les réglages généraux, l’en-tête, les badges et les cartes ; bordures de groupes renforcées et état d’ouverture conservé pendant la navigation.
- Boutons crayon avec noms accessibles ; libellés issus des noms personnalisés et friendly names HA.
- Interactions par défaut adaptées aux badges `entity` et cartes bouton. Les actions explicites restent intactes, les autres cartes conservent leurs défauts natifs. Les capteurs restent sur plus d’informations.
- Transferts par menu et zones de dépôt vers d’autres sections conservés dans les pages contextuelles.
- 19 tests locaux passent, dont une régression du nom/réglages sous rafraîchissements répétés et un changement d’entité avec action implicite. Suite navigateur adaptée, non exécutée dans cet environnement ; voir `docs/TESTING.md`.

## 0.1.0

Première version expérimentale : deux présentations, conteneur Lovelace, badges de vue natifs, grille, exclusivité, animations et éditeur initial. 6 tests unitaires et 19 contrôles navigateur sur composants HA simulés avaient été exécutés. Ces résultats historiques ne valident pas l’interface de la version 0.2.0.

### Validation de la première publication

Le mainteneur confirme le fonctionnement sur son instance Home Assistant et sur mobile. Versions/appareils non encore renseignés. La publication GitHub de la 0.7.0 est autorisée ; HACS reste à valider.
