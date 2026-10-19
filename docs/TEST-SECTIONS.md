# Tester la conversion automatique — 0.13.0

Version 0.13.0 : procédure de contrôle de la conversion. Sections est la seule présentation proposée. Unified/Separate au niveau global restent disponibles.

## Installer

Conserver une copie du YAML actuel avant les essais. Copier dist/flex-accordion-card.js sous /config/www/flex-accordion-card-test.js et remplacer temporairement l’unique ressource de la carte par /local/flex-accordion-card-test.js?v=0.13.0 (module JavaScript). Recharger complètement le navigateur.

## Vérifier

1. Ouvrir une carte provenant de la 0.11.0, sans modifier son YAML : la conversion doit être visible et un avertissement doit apparaître sur la carte et dans l’éditeur.
2. Vérifier Verticale : chaque carte occupe 12 colonnes avec hauteur automatique.
3. Vérifier Grille : 2 cartes par rangée donnent 6/6 ; 3 donnent 4/4/4 ; 5 donnent 3/3/2/2/2 ; 7 donnent 2/2/2/2/2/1/1 ; 12 donnent des largeurs de 1. Une rangée incomplète garde les mêmes largeurs.
4. Les dimensions explicites grid_options, contenus, actions, badges, conditions et mode toujours ouvert doivent être conservés.
5. Vérifier le résultat sur ordinateur et mobile. Adapter les dimensions dans l’onglet natif Disposition si nécessaire.
6. Cliquer sur Disposition vérifiée dans l’éditeur puis enregistrer la carte. Recharger : l’avertissement ne doit plus apparaître. Sans confirmation enregistrée, il doit rester visible.
7. Créer une nouvelle carte depuis le catalogue : aucune ancienne présentation ni avertissement de conversion ne doit être proposé.

La conversion est calculée dès le chargement ; la configuration convertie et la confirmation sont persistées lors de l’enregistrement habituel dans HA. Le rendu ne modifie pas le serveur de lui-même.

Si les composants Sections ne sont pas disponibles, ouvrir une vue native Sections puis revenir et cliquer sur Réessayer. Il n’existe plus de repli Verticale/Grille. Pour revenir à la 0.11.0, restaurer le YAML sauvegardé et sa ressource ; elle ne reconnaît pas layout: sections.

84 tests Node réussis avec doubles DOM/composants. Le rendu Sections a été validé par le mainteneur dans la 0.12.0, y compris sur mobile ; le mainteneur a également confirmé la réussite de la conversion sur ses cartes. La suite navigateur simulée n’a pas été exécutée.
