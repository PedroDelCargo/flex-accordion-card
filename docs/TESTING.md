# Tests et recette — 0.7.0

## Résultats locaux du 15 octobre 2026

**53 tests réussis** : 15 tests de configuration et 38 tests des contrats d’éditeur/composants avec doubles DOM. Construction du module et contrôles de syntaxe du bundle et de la suite navigateur réussis.

Les tests couvrent notamment la normalisation, les déplacements/copies indépendantes, les actions implicites, les formulaires contrôlés, la saisie du nom pendant les ticks `hass`, les retours de configuration, les pages contextuelles, les wrappers de visibilité et la conservation de l’identité des conditions dépliées.

La 0.7.0 vérifie la durée par défaut de 750 ms, la taille numérique facultative et son effacement, la migration des tailles nommées, les catalogues fr/en/es/de (clés et paramètres), les variantes régionales, le repli anglais et les pages dans chaque langue. Les noms utilisateur et l’éditeur actif sont conservés pendant les rafraîchissements de même langue.

Ces doubles n’ont **aucun moteur de rendu** : ni validation d’apparence CSS, de caret/focus réel, de glisser-déposer navigateur ni des vrais composants Lit HA. Les styles de marge, fondu et mouvement réduit sont vérifiés structurellement.

## Navigateur et HA réel

La suite Playwright simulée a été maintenue mais n’a pas été exécutée pour cette version. Les tentatives précédentes étaient bloquées (lancement Edge dans le bac à sable et connexion du navigateur intégré au serveur local). Aucune nouvelle tentative identique n’a été faite. [browser-report.json](browser-report.json) indique cet état sans annoncer de réussite navigateur.

Aucune instance HA réelle n’a été utilisée par l’agent. Les 19 contrôles navigateur et captures de la 0.1.0 dans `history/` sont historiques et ne prouvent pas le rendu de cette version. La démo simulée ne remplace pas les essais des sélecteurs, badges et conditions HA ; les traductions restent à relire en situation réelle.

## Reproduire les tests

Node.js 20 ou supérieur, depuis la racine du projet :

```text
node scripts/build.mjs
node --test test/core.test.mjs test/editor.test.mjs
node --check dist/flex-accordion-card.js
node --check test/browser.mjs
```

Pour Playwright sur une machine autorisant son lancement :

```text
npm install
npx playwright install chromium
npm run test:browser
```

Edge installé peut être utilisé avec `PLAYWRIGHT_CHANNEL=msedge`. Les captures/résultats sont écrits dans `test/results/` après exécution réussie. `node scripts/serve.mjs` lance la démo simulée sur `http://127.0.0.1:8124` ; elle renvoie la configuration à l’éditeur après chaque modification.

## Recette prioritaire sur HA

Compléter la [fiche VALIDATION.md](VALIDATION.md), notamment :

1. Installer `/local/flex-accordion-card.js?v=0.7.0`, recharger complètement et vérifier une seule ressource.
2. Vérifier la marge supérieure de 5 px, unified/separate, avec/sans fond global et sur mobile.
3. Saisir une taille, par exemple 19.5, puis effacer : champ vide et absence de `text_size` dans le YAML. Vérifier la migration small/medium/large.
4. Sans durée explicite, vérifier 750 ms ; une durée déjà configurée reste conservée. Tester fondu, inversion rapide et mouvement réduit.
5. Vérifier fr/en/es/de et variantes régionales, libellés accessibles et types localisés, sans changement des textes utilisateur.
6. Refaire les régressions badges : saisie lente du nom, attente de dix secondes, modifications cumulées, ticks d’entité et conditions dépliées.
7. Copier dans la section courante, y compris lorsqu’elle est seule, puis modifier la copie indépendamment.
8. Tester les thèmes, le clavier, les cartes tierces et les conditions hors mode édition. Consigner les versions avant toute annonce de compatibilité.

La première CI GitHub a réussi le 15 octobre 2026 : construction, 53 tests, syntaxe et bundle reproductible. Voir https://github.com/PedroDelCargo/flex-accordion-card/actions/runs/38754608331. Elle ne publie aucune release.

## Sections fixes 0.7.0

Les nouveaux tests vérifient la normalisation, l’exclusion de l’état exclusif, les deux layouts sans header/badges montés, les attributs accessibles, l’instance enfant conservée lors des ouvertures voisines, la bascule réversible et la délégation des conditions au wrapper HA. Sur HA réel : activer deux sections toujours ouvertes autour d’une section accordéon en mode exclusif, modifier/recharger, tester les conditions puis revenir au mode normal.

## Retour du mainteneur avant publication GitHub

La 0.7.0 a été déclarée fonctionnelle sur l’instance HA du mainteneur ; les tests mobiles ont également été confirmés. Versions et appareils non encore renseignés. Ce résultat utilisateur complète les 53 tests locaux ; la suite navigateur automatisée n’a pas été relancée et la distribution HACS reste à tester.

## Candidat 0.8.0 — 16 octobre 2026

58 tests locaux réussis (16 de configuration, 42 de composants/éditeur). Nouveaux contrats : grille/vertical avec conservation des colonnes, section actuelle en premier sans erreur d’indice, copie indépendante, badge natif shortcut sans entité et échec propre lorsque non disponible. Les validations utilisateur et CI précédemment décrites concernent la 0.7.0 ; les changements 0.8.0 n’ont pas encore été testés sur HA réel ni publiés sur GitHub. Vérifier les trois parcours sur ordinateur/mobile, puis tester texte, icône, actions et conditions du vrai badge shortcut si disponible.

## Candidat 0.9.0 — parcours des badges

64 tests locaux réussis : 16 de configuration, 48 de composants/éditeur. Nouveaux contrôles : ajout unique, type en premier et entité conditionnelle, ordre identique des réglages, conservation des données communes lors du changement de type, refus propre du raccourci indisponible, stabilité des accordéons lors des mises à jour, contours neutres et suppression du message d’action par défaut. Le rendu CSS et les sélecteurs natifs réels restent à vérifier.

Recette : ajouter un badge Entité puis un Raccourci dans une section et dans l’en-tête global ; vérifier ordre des champs, contenu et trois actions. Changer le type en édition. Déplier plusieurs groupes puis saisir lentement et attendre les ticks HA : les groupes ne doivent pas se refermer. Vérifier les quatre langues, le clavier/mobile et les conditions de visibilité avant/après l’ajout.

## Correctif 0.9.1

67 tests locaux réussis (16 configuration, 51 composants). La régression reproduit la réutilisation des mêmes champs compacts avec d’abord des sélecteurs de texte/icône/couleur, puis les trois sélecteurs ui_action. Vérification du sélecteur, du nom, du schéma, de la valeur émise et du retour au sélecteur précédent. Les radios sont vérifiées pour la sélection, les traductions et la désactivation. Sur HA réel : changer plusieurs fois Entité/Raccourci avec Interactions ouvert ; vérifier Au toucher/Appui long/Double toucher et leurs actions, ainsi que le clavier et le mobile. Les captures utilisateur proviennent de la 0.9.0 ; aucune nouvelle capture n’est présentée comme validation de la correction.

## Candidat 0.10.0

72 tests locaux réussis : 16 de configuration et 56 de composants/éditeur. Nouveaux tests : texte d’aide exact et placement entre le booléen et les autres champs, signal Manuel natif avec type vide, validation YAML et repli JSON, aperçu de brouillon mis à jour sans ajout dans la configuration, transmission de hass et position finale des boutons code/visuel. Les composants de rendu sont des doubles : l’aperçu réel et le clavier/mobile restent à tester sur HA.

Recette : activer Toujours ouverte puis lire l’aide ; ajouter une carte via le choix Manuel du catalogue et tester une configuration invalide puis valide ; créer un badge sans valider immédiatement, modifier nom/icône/couleur et observer son aperçu dans la page d’ajout ; revenir sans ajouter et vérifier qu’aucun badge n’est enregistré. Comparer l’emplacement de la bascule code/visuel dans les éditeurs natifs, personnalisés et de badges.

## Candidat 0.11.0

76 tests locaux réussis (17 configuration, 59 composants). Contrôles : booléens, schéma des deux types, retrait des options avant passage à HA, styles indépendants, configuration/rendu des badges de section et de l’en-tête global, aperçu du brouillon, restauration des variables inline initiales. Sans moteur de rendu, ces tests ne prouvent pas l’absence visuelle de bordure/fond. Sur HA réel, tester les deux options séparément et ensemble, les désactiver, changer de thème et vérifier le focus clavier et l’absence d’effet sur les autres badges.
