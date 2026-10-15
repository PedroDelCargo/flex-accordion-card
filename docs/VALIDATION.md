# Validation sur une instance Home Assistant

Statut initial : à compléter par les testeurs. Les tests Node avec doubles ne remplacent pas cette recette. Ne cocher que ce qui a été observé sur la version du module testée.

## Environnement

- Version Flex Accordion :
- Version HA Core / Frontend :
- Version HACS (si utilisé) :
- Navigateur / système / appareil :
- Type de vue : masonry / Sections / autre :
- Thème, langue du profil et date :
- Installation : manuelle / HACS personnalisé :

## Parcours

- [ ] Installation neuve, ressource et cache correctement chargés ; une seule ressource du module.
- [ ] Mise à jour depuis la version précédente ; YAML conservé.
- [ ] Unified/separate, fond global activé/désactivé, en-tête sans badges et avec plusieurs badges.
- [ ] Marge supérieure de 5 px de l’en-tête, titre long et écran étroit.
- [ ] Taille numérique vide par défaut, valeur personnalisée puis effacée ; absence de `text_size` au retour au défaut.
- [ ] Migration small/medium/large vers pixels, sans perte de titre/icône/badges.
- [ ] Transition 750 ms si non définie ; durée personnalisée conservée, animation inversée rapidement.
- [ ] Fondu et hauteur fluides ; animations désactivées et préférence système de mouvement réduit respectées.
- [ ] Ouverture indépendante/exclusive et état conservé lors de la réorganisation.
- [ ] Badge cliqué : action native, sans ouverture involontaire de section.
- [ ] Nom de badge saisi lentement puis plusieurs options modifiées ; attendre dix secondes et des mises à jour d’entité.
- [ ] Conditions section/badge : plusieurs lignes dépliées restent ouvertes pendant les modifications et mises à jour.
- [ ] Conditions réellement évaluées hors mode édition en changeant les entités concernées.
- [ ] Format d’heure proposé uniquement pour un contenu temporel, valeur conservée lorsqu’il est masqué.
- [ ] Pages contextuelles, retour vers la bonne section/liste et navigation visible pendant le défilement.
- [ ] Glisser-déposer, flèches, déplacement inter-section ; copie dans la même section et dans une autre, indépendante de l’original.
- [ ] Répéter la copie avec une seule section.
- [ ] Friendly names/types localisés ; textes utilisateur conservés.
- [ ] Profils fr/en/es/de et variante régionale ; champs, menus, actions et libellés accessibles correctement traduits.
- [ ] Carte native et carte tierce, éditeurs visuel/code, graphiques et médias au premier dépliage.
- [ ] Clavier, focus visible, mobile/tactile, thèmes clair et sombre ; pas de débordement des contrôles.
- [ ] Installation/mise à jour via HACS personnalisé, lorsque le dépôt sera disponible.

## Résultats et anomalies

Pour chaque échec : résultat attendu, résultat observé, étapes, configuration minimale anonymisée, capture éventuelle et message console pertinent. Ajouter les limites confirmées au README. Distinguer compatibilité testée et compatibilité supposée.

## Décision de publication

- Version candidate et date :
- Points bloquants restants :
- Versions HA/navigateurs réellement validés :
- Décision du mainteneur : à tester / préversion GitHub / release / essai HACS.

## Complément sections toujours ouvertes

- [ ] En-tête et pied avec `always_open: true` dans les deux layouts ; aucune commande ni badge affiché, carte `heading` native utilisable dans le contenu.
- [ ] Mode exclusif : ouverture/fermeture des sections voisines sans replier les sections fixes.
- [ ] Activer puis désactiver : titre, icône et badges précédents retrouvés, édition des cartes conservée.
- [ ] Conditions HA masquent/réaffichent aussi une section toujours ouverte.

## Validation déclarée par le mainteneur — 15 octobre 2026

Le mainteneur a confirmé pour la 0.7.0 : « Tout fonctionne », puis « Tests sur mobile validés également ». Publication GitHub autorisée. Cette confirmation concerne les essais utilisateur ; elle ne constitue pas une exécution de la suite navigateur automatisée par l’agent. Les versions HA, OS, navigateurs et modèles d’appareils restent non renseignés. Les cases détaillées ci-dessus ne sont pas cochées automatiquement, afin de ne pas attribuer des scénarios précis non explicitement rapportés. Installation/mise à jour HACS encore à valider.
