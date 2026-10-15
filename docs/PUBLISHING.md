# Préparer GitHub et HACS

État au 15 octobre 2026 : publication GitHub de la 0.7.0 autorisée après validation HA et mobile par le mainteneur. Dépôt : https://github.com/PedroDelCargo/flex-accordion-card. Le présent guide décrit aussi les étapes des prochaines publications et la future validation HACS. Les captures et versions précises testées restent à renseigner.

## Avant publication

1. Compléter [VALIDATION.md](VALIDATION.md) et traiter les anomalies bloquantes. Ajouter des captures réelles sans données personnelles ; les anciennes captures simulées de `history/` ne sont pas des preuves de la version actuelle.
2. Relire les quatre langues, l’installation, les limites et la licence. Renseigner une version minimale HA uniquement si les essais permettent de la justifier.
3. Choisir le nom de dépôt **flex-accordion-card** (ou **lovelace-flex-accordion-card**), pour correspondre au nom du fichier distribué.
4. Placer le contenu de ce projet à la racine du dépôt, en conservant `dist/flex-accordion-card.js`, `hacs.json`, README, documentation, sources et licence. Ne pas imbriquer un second dossier `flex-accordion-card` à la racine.
5. Exclure `node_modules`, résultats temporaires et données privées. Le ZIP livré est une archive de travail ; le fichier distribué aux utilisateurs HA est le JavaScript construit.

## GitHub

Après validation, créer un dépôt public avec une description, par exemple « Accordion container for Home Assistant Lovelace cards with native badges and a contextual visual editor ». Topics suggérés : `home-assistant`, `lovelace`, `custom-card`, `hacs`, `accordion`.

Les modèles de signalement et la CI locale sont préparés dans `.github/`. La CI construit et exécute les tests Node, vérifie la syntaxe et l’absence de différence du bundle reconstruit. Elle ne publie rien et ne valide pas une instance HA. Aucun workflow n’a encore été exécuté sur GitHub.

Pour chaque version :

1. Mettre à jour `package.json`, `src/core.js`, CHANGELOG et URLs de ressource de la documentation.
2. Construire le module, exécuter les tests appropriés et compléter la recette réelle.
3. Actualiser `SHA256SUMS.txt` pour le module final.
4. Créer une release GitHub avec les changements, migrations, limites et versions HA réellement testées.
5. Joindre **flex-accordion-card.js** comme fichier brut de release. L’archive ZIP du projet n’est pas le module à installer.
6. Vérifier le téléchargement et une installation neuve depuis cette release.

## HACS : dépôt personnalisé en premier

Après publication GitHub, ajouter l’URL réelle dans les dépôts personnalisés HACS, catégorie **Dashboard**, puis tester une installation et une mise à jour. Compléter ensuite README avec cette URL et la ressource réellement enregistrée. Vérifier qu’il n’existe pas deux ressources du même module (ancienne installation manuelle et HACS).

Le manifeste préparé utilise `filename: flex-accordion-card.js`, `content_in_root: false` et `render_readme: true`. Le bundle et ses traductions sont réunis dans `dist/`, sans fichiers de langue à charger séparément. Ne pas activer `zip_release` pour cette carte.

Selon la documentation HACS, un plugin doit fournir un JavaScript correspondant au nom du dépôt, dans `dist/` ou à la racine. Une description, des topics et un README utilisable sont également nécessaires. Le dépôt doit être public. L’utilisation comme dépôt personnalisé est distincte de l’inclusion au catalogue par défaut.

L’admission au catalogue par défaut sera une étape ultérieure, après stabilisation, validation HACS et vérification des critères en vigueur. Aucun badge « HACS validé » ou promesse d’admission ne doit être ajouté avant ces vérifications.

Sources officielles consultées le 15 octobre 2026 : [Plugin / Dashboard](https://www.hacs.dev/docs/publish/plugin/), [exigences générales et hacs.json](https://www.hacs.dev/docs/publish/start/), [inclusion au catalogue](https://www.hacs.dev/docs/publish/include/). Revérifier ces pages au moment de publier.
