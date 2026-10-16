# Audit des possibilités réelles du frontend Home Assistant

## Périmètre de vérification

Lecture du dépôt officiel `home-assistant/frontend`, branche `dev` figée au commit **`a2ad5c4b14665be671b18ed496df3e22b8e23aeb`**, récupéré le 14 octobre 2026. Les liens ci-dessous sont immuables. Cette lecture établit des signatures et des chemins de chargement ; elle ne remplace pas une exécution sur une version publiée de HA.

Aucune plage de versions HA « compatible » n’est annoncée sans recette réelle. Le projet utilise la détection des capacités plutôt qu’une comparaison supposée de numéros de version.

## Fabriques et contrat de carte

[ha-panel-lovelace.ts](https://github.com/home-assistant/frontend/blob/a2ad5c4b14665be671b18ed496df3e22b8e23aeb/src/panels/lovelace/ha-panel-lovelace.ts) assigne `window.loadCardHelpers` à un import dynamique du module `custom-card-helpers`.

[custom-card-helpers.ts](https://github.com/home-assistant/frontend/blob/a2ad5c4b14665be671b18ed496df3e22b8e23aeb/src/panels/lovelace/custom-card-helpers.ts) exporte notamment `createCardElement` **et** `createBadgeElement`. La disponibilité des badges n’est donc pas déduite de celle des cartes : l’export a été vérifié directement.

[Documentation officielle des custom cards](https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/) : configuration par `setConfig`, enregistrement d’un custom element, ressource module, éditeur via `getConfigElement`, événement `config-changed`, inscription dans `window.customCards`. Le projet suit ces contrats. `hass` est transmis aux enfants comme le fait HA dans son conteneur de pile ; voir [hui-stack-card.ts](https://github.com/home-assistant/frontend/blob/a2ad5c4b14665be671b18ed496df3e22b8e23aeb/src/panels/lovelace/cards/hui-stack-card.ts).

## Badges de vue : réutilisation confirmée

[create-badge-element.ts](https://github.com/home-assistant/frontend/blob/a2ad5c4b14665be671b18ed496df3e22b8e23aeb/src/panels/lovelace/create-element/create-badge-element.ts) utilise la fabrique commune Lovelace, avec `entity` comme type par défaut. Des types sont chargés immédiatement et d’autres paresseusement. Le projet ne reproduit ni le rendu ni les actions de ces badges.

[hui-entity-badge.ts](https://github.com/home-assistant/frontend/blob/a2ad5c4b14665be671b18ed496df3e22b8e23aeb/src/panels/lovelace/badges/hui-entity-badge.ts) expose un `getConfigElement()` statique qui importe et retourne l’éditeur natif du badge `entity`. Son rendu gère les états, icônes et actions avec les mécanismes HA.

[hui-badge.ts](https://github.com/home-assistant/frontend/blob/a2ad5c4b14665be671b18ed496df3e22b8e23aeb/src/panels/lovelace/badges/hui-badge.ts) est le wrapper natif qui gère les conditions, les changements de visibilité, les éléments chargés paresseusement et leurs mises à jour. Ses propriétés utiles sont **`config`**, **`hass`**, **`preview`** ; ce wrapper ne se configure pas par `setConfig`.

Décision : utiliser ce wrapper lorsqu’il est enregistré. Sinon, utiliser le helper exporté pour les badges sans conditions. Si la configuration contient `visibility` ou active `disabled` sans wrapper, afficher une erreur explicite. Créer seulement l’élément du badge ne suffit pas à garantir les conditions de visibilité.

Les badges vivent dans une zone distincte du bouton d’accordéon. Leurs événements de clic/clavier/action ne déclenchent pas ce bouton ; les événements HA comme l’ouverture de la boîte « plus d’informations » peuvent remonter normalement.

## Badges de titre `heading` : autre système

[hui-heading-card.ts](https://github.com/home-assistant/frontend/blob/a2ad5c4b14665be671b18ed496df3e22b8e23aeb/src/panels/lovelace/cards/hui-heading-card.ts) s’appuie sur `hui-heading-badge` et non sur les badges de vue.

[hui-heading-badge.ts](https://github.com/home-assistant/frontend/blob/a2ad5c4b14665be671b18ed496df3e22b8e23aeb/src/panels/lovelace/heading-badges/hui-heading-badge.ts) utilise `createHeadingBadgeElement`. Cette fabrique n’est pas exportée par `custom-card-helpers.ts` à la révision inspectée. Son existence dans le code ne constitue donc pas une API publique d’insertion.

Décision de v0.1 : **badges natifs de vue placés dans l’en-tête**, sans prise en charge du schéma `heading`. Cela répond au besoin de badges natifs dans les sections sans prétendre que les deux familles sont interchangeables.

## Édition des cartes : réutilisation confirmée, composants internes

[hui-stack-card.ts](https://github.com/home-assistant/frontend/blob/a2ad5c4b14665be671b18ed496df3e22b8e23aeb/src/panels/lovelace/cards/hui-stack-card.ts) expose un `getConfigElement()` qui charge `hui-stack-card-editor`. La carte de pile verticale hérite de cette classe : [hui-vertical-stack-card.ts](https://github.com/home-assistant/frontend/blob/a2ad5c4b14665be671b18ed496df3e22b8e23aeb/src/panels/lovelace/cards/hui-vertical-stack-card.ts).

[hui-stack-card-editor.ts](https://github.com/home-assistant/frontend/blob/a2ad5c4b14665be671b18ed496df3e22b8e23aeb/src/panels/lovelace/editor/config-elements/hui-stack-card-editor.ts) importe le catalogue `hui-card-picker` et le wrapper `hui-card-element-editor`. Il configure ce dernier par les propriétés `hass`, `lovelace` et **`value`**, puis écoute `config-changed`. Le catalogue émet aussi `config-changed`, avec la configuration sélectionnée dans `detail.config`.

[hui-element-editor.ts](https://github.com/home-assistant/frontend/blob/a2ad5c4b14665be671b18ed496df3e22b8e23aeb/src/panels/lovelace/editor/hui-element-editor.ts) expose le mode **`GUImode`** et les événements `GUImode-changed` et `config-changed`. Le wrapper prend en charge l’éditeur YAML quand le GUI n’existe pas. Le projet écoute les événements des enfants, arrête leur propagation, puis réémet uniquement la configuration englobante de l’accordéon.

Décision : charger l’éditeur de pile au moyen de sa méthode statique, vérifier les éléments enregistrés puis les réutiliser. Aucune URL de chunk HA n’est codée en dur. Si ce chargement échoue, les champs du conteneur restent utilisables ; le repli des enfants passe par leur éditeur statique ou une saisie JSON.

## Édition des badges : possibilités et limite de chargement

[hui-badge-element-editor.ts](https://github.com/home-assistant/frontend/blob/a2ad5c4b14665be671b18ed496df3e22b8e23aeb/src/panels/lovelace/editor/badge-editor/hui-badge-element-editor.ts) est un wrapper d’édition avec GUI, YAML et visibilité, configuré par `value`, `hass` et `lovelace` hérités. [hui-dialog-edit-badge.ts](https://github.com/home-assistant/frontend/blob/a2ad5c4b14665be671b18ed496df3e22b8e23aeb/src/panels/lovelace/editor/badge-editor/hui-dialog-edit-badge.ts) confirme cette utilisation.

[hui-badge-picker.ts](https://github.com/home-assistant/frontend/blob/a2ad5c4b14665be671b18ed496df3e22b8e23aeb/src/panels/lovelace/editor/badge-editor/hui-badge-picker.ts) attend `hass` et une configuration Lovelace ; il émet `config-changed`.

Ces deux éléments ne figurent pas dans les exports des helpers. Le chargement de l’éditeur d’une pile de cartes ne garantit pas leur enregistrement. Appeler `document.createElement` avec leur nom ne charge pas leur définition.

Décision : les utiliser seulement après `customElements.get`. À défaut, ajout visuel d’un badge `entity` via `ha-form` et son sélecteur d’entité, puis éditeur obtenu par `getConfigElement` du badge. Le wrapper global de badge et son onglet visibilité ne sont donc pas promis dans tous les contextes. Les autres types restent configurables dans la saisie manuelle et dans le YAML de la carte principale.

## Formulaires et visibilité des cartes

`ha-form` reçoit `hass`, `schema`, `data`, `computeLabel`, et émet `value-changed` avec `detail.value` ; cet usage est visible dans l’éditeur de pile cité plus haut. Le projet l’utilise quand enregistré, avec les sélecteurs texte, icône, booléen, nombre, liste et entité.

[hui-card.ts](https://github.com/home-assistant/frontend/blob/a2ad5c4b14665be671b18ed496df3e22b8e23aeb/src/panels/lovelace/cards/hui-card.ts) gère les cartes et leurs conditions comme le wrapper de badge. Propriétés utilisées : `config`, `hass`, `preview`, `layout`. Repli par `createCardElement` pour les cartes sans conditions si le wrapper manque. Aucun moteur de conditions n’est réimplémenté.

## Drag and drop

Le réordonnancement des vues et sections de HA appartient aux éditeurs de tableau de bord et à leurs modèles de configuration. Aucun contrat exporté de glisser-déposer générique pour une liste arbitraire de cartes n’a été établi par cet audit.

Décision : implémentation HTML5 limitée aux listes du conteneur. Les configurations restent des objets Lovelace ordinaires, clonés puis réémis avec `config-changed`. Boutons et menu de destination pour clavier/tactile. Cela ne prétend pas activer le drag and drop global de HA à l’intérieur d’une carte personnalisée.

## Ce que cet audit ne prouve pas

Il confirme la présence des fabriques et les signatures utilisées au commit ci-dessus. Il ne prouve pas leur stabilité future, leur disponibilité dans toutes les pages, la compatibilité de toutes les cartes tierces, ni le fonctionnement réel des badges/éditeurs sur votre installation. Les doubles de test vérifient les interactions et les contrats de propriétés de ce projet ; une recette HA reste indispensable.

## Complément 0.2.0 — badge contrôlé et interactions

Vérification complémentaire du code officiel le 15 octobre 2026, sur les fichiers `dev` suivants (liens mobiles, distincts de l’audit épinglé ci-dessus) :

- [hui-entity-badge-editor.ts](https://github.com/home-assistant/frontend/blob/dev/src/panels/lovelace/editor/config-elements/hui-entity-badge-editor.ts) : `setConfig` initialise la configuration interne ; `_valueChanged` émet la nouvelle configuration sans l’affecter à cette configuration interne. Le parent doit donc la lui renvoyer, comme le fait le wrapper HA. L’ancienne version du conteneur ne le faisait pas pour les éditeurs directs. Au rafraîchissement de `hass`, le formulaire pouvait alors repartir des anciennes valeurs. La correction renvoie immédiatement la configuration par `setConfig` en conservant l’instance du formulaire. Les wrappers reçoivent quant à eux `value`, comme précédemment vérifié.
- [hui-button-card.ts](https://github.com/home-assistant/frontend/blob/dev/src/panels/lovelace/cards/hui-button-card.ts) et [const.ts](https://github.com/home-assistant/frontend/blob/dev/src/common/const.ts) : la carte bouton choisit son action native selon le domaine d’entité et la liste de domaines habituellement basculables. Le projet reprend cette distinction pour ses défauts de cartes bouton et badges `entity`, sans l’imposer aux autres types de cartes.
- [handle-action.ts](https://github.com/home-assistant/frontend/blob/dev/src/panels/lovelace/common/handle-action.ts) : l’action `perform-action` utilise `perform_action` et `target`. Les défauts pour button/input_button et scene/script sont construits avec ce schéma. Le projet ne déclenche pas lui-même les services : l’exécution reste déléguée aux composants HA.

Les actions explicitement configurées sont prioritaires. Les défauts présentés à l’éditeur sont renvoyés sans les enregistrer comme choix explicites lors d’un simple réglage de nom/couleur, pour permettre un changement d’entité cohérent. Une suppression volontaire de champ n’est pas compensée par une fusion de l’ancien objet.

## Complément 0.3.0 — visibilité et formulaire de badge

Vérifications supplémentaires le 15 octobre 2026, sur les sources officielles `dev` :

- [hui-card-visibility-editor.ts](https://github.com/home-assistant/frontend/blob/dev/src/panels/lovelace/editor/card-editor/hui-card-visibility-editor.ts) reçoit `hass`, `config`, `entityId`, utilise `config.visibility` et émet `value-changed` avec un objet complet dans `detail.value`. Il charge `ha-card-conditions-editor`. Ces composants sont réutilisés pour les sections et les badges ; aucun moteur de conditions n’a été réécrit.
- Le `hui-card` inspecté plus haut prend en charge `visibility`, le contexte d’entité, `preview`, les changements de visibilité et la propriété `connectedWhileHidden` d’un enfant. La 0.3.0 lui confie une section entière via un hôte interne en DOM léger. Les références sont locales à l’instance et retirées au démontage ; l’élément interne n’est pas proposé dans le catalogue de cartes. L’état d’accordéon demeure géré par le conteneur, même quand la section est cachée.
- Les badges utilisent `hui-badge` quand chargé. À défaut, un badge conditionnel peut être hébergé dans le même wrapper `hui-card`, avec son contexte `entity` et ses conditions. Les instances des vrais badges continuent de recevoir `hass` ; leur rendu et leurs actions restent natifs. Sans wrapper adapté, le message d’erreur reste explicite.
- [state-display.ts](https://github.com/home-assistant/frontend/blob/dev/src/state-display/state-display.ts), fonction `stateContentHasTimestamp`, et [sensor.ts](https://github.com/home-assistant/frontend/blob/dev/src/data/sensor.ts) distinguent les contenus temporels des autres états. Le contrôleur de formulaire de badge `entity` applique cette distinction et tient compte de `show_state`. Il conserve le champ `time_format` dans la configuration lorsqu’il est masqué.
- Le formulaire `entity` appartient au conteneur mais utilise `ha-form` et les sélecteurs natifs `entity`, `entity_name`, `icon`, `ui_color`, `ui_state_content`, `ui_action`, `ui_time_format`. Il ne modifie ni les prototypes ni le DOM privé des éditeurs HA. Le contrat d’actions et son contexte sont confirmés dans [hui-action-editor.ts](https://github.com/home-assistant/frontend/blob/dev/src/panels/lovelace/components/hui-action-editor.ts).
- Le composant YAML est configuré par `defaultValue` et émet `value-changed` avec `detail.isValid` et `detail.value`, comme dans `hui-element-editor.ts` déjà inspecté. La bascule vers le code conserve le même contrôleur de badge ; le retour de configuration ne réécrit pas le brouillon valide qui vient d’être émis.

La visibilité de section et le repli de badge ont été testés avec un wrapper dont le résultat de visibilité est piloté par le test. Cette vérification valide la délégation, pas l’évaluation réelle des conditions HA. Le formulaire temporel, les copies et la conservation des réglages ont aussi des régressions locales. Le défilement sticky, le rendu des sélecteurs et les conditions réelles restent à vérifier sur l’instance cible.

## Complément 0.4.0 — identité des conditions et affichage compact

Le [code de ha-card-conditions-editor](https://github.com/home-assistant/frontend/blob/dev/src/panels/lovelace/editor/conditions/ha-card-conditions-editor.ts) associe les clés des lignes aux objets conditions via WeakMap. À chaque édition, il reporte la clé sur le nouvel objet émis. Une copie profonde renvoyée immédiatement perd cette identité et recrée les lignes. L’adaptateur conserve désormais les objets de présentation émis par HA ; la configuration enregistrée reste copiée indépendamment.

Le [formulaire HA](https://github.com/home-assistant/frontend/blob/dev/src/components/ha-form/ha-form.ts) accepte des champs personnalisés ha-form-* avec schéma flatten. Le champ local ha-form-flex-badge-display regroupe quatre options avec des [ha-switch](https://github.com/home-assistant/frontend/blob/dev/src/components/ha-switch.ts) natifs en lignes de 40 px et renvoie les données complètes. Il n’inspecte pas le DOM privé des sélecteurs. Ces contrats restent internes à HA et devront être revérifiés lors de ses évolutions.

L’en-tête global réutilise le même chemin de création et les mêmes wrappers de badges de vue HA que les en-têtes de section. Aucun nouveau type de badge HA n’est supposé disponible. Vérifications de source et tests avec doubles effectués ; aucune validation sur une instance HA réelle pour cette version.

## Complément 0.5.0

Le [style de hui-heading-card](https://github.com/home-assistant/frontend/blob/dev/src/panels/lovelace/cards/hui-heading-card.ts) confirme une icône de 18 px et un titre de poids normal. L’en-tête global s’en inspire avec des tailles explicites ajustables. Le champ compact local reprend les propriétés de sélecteur transmises par [ha-form](https://github.com/home-assistant/frontend/blob/dev/src/components/ha-form/ha-form.ts) : selector, value, label, hass, context, required et événements value-changed. Ses marges sont définies sur son propre hôte ; aucun DOM privé HA n’est modifié. Les éditeurs tiers et conditions restent natifs.

## Complément 0.6.0 — valeur numérique facultative et langues

Le [sélecteur numérique HA](https://github.com/home-assistant/frontend/blob/dev/src/components/ha-selector/ha-selector-number.ts) conserve une chaîne vide pour une valeur undefined/null et émet undefined lorsque l’utilisateur efface le champ. Le mode box et step: any acceptent une valeur numérique libre sans proposer de taille par défaut dans le champ. Le conteneur supprime text_size absent/effacé et applique 16 px uniquement au rendu. Les anciennes tailles nommées sont migrées en valeurs numériques explicites.

La localisation propre à Flex Accordion est embarquée dans le module et utilise la langue du profil HA. Aucun nom utilisateur ni clé YAML n’est modifié. Les composants HA gardent leur propre localisation ; les diagnostics techniques de configuration restent partiellement français. Les tests utilisent des doubles et ne confirment pas encore le rendu du sélecteur réel.

## Vérification du 16 octobre 2026 — badge sans entité

Le badge [hui-entity-badge](https://github.com/home-assistant/frontend/blob/dev/src/panels/lovelace/badges/hui-entity-badge.ts) renvoie un badge d’erreur sans état d’entité existant. Retirer entity ne fournit donc pas le comportement demandé.

Le composant natif [hui-shortcut-badge](https://github.com/home-assistant/frontend/blob/dev/src/panels/lovelace/badges/hui-shortcut-badge.ts), type shortcut, utilise text/icon/color et les actions tap/hold/double-tap, sans lecture d’une entité. Sa méthode getConfigElement charge l’éditeur natif. La [fabrique de badges](https://github.com/home-assistant/frontend/blob/dev/src/panels/lovelace/create-element/create-badge-element.ts) contient bien shortcut dans ses types chargés à la demande. Sources consultées sur dev ; aucune disponibilité dans toutes les versions publiées n’est déduite de cette observation.

L’ajout proposé provoque le chargement via la fabrique, attend l’enregistrement de hui-shortcut-badge (au maximum cinq secondes) puis seulement ajoute la configuration. Échec/absence : message explicite, aucune création. Le rendu et les actions restent délégués à HA. Contrats testés localement avec doubles ; essai natif sur l’instance utilisateur restant à effectuer.

## Formulaire unifié 0.9.0

L’adaptateur de formulaire contrôlé couvre entity et shortcut avec ha-form, sélecteurs natifs et conditions HA. Pour imposer le même ordre et les mêmes contours, les groupes Contenu/Interactions utilisent un champ local ha-form-flex-expandable suivant le contrat de champ ha-form : schema, data aplaties, hass, computeLabel et événement value-changed. Il possède ses propres details/form et conserve leur identité ; aucun DOM privé HA n’est modifié. Le badge affiché, les actions et le moteur de visibilité restent natifs.

## Réutilisation des champs — 0.9.1

Le champ local FlexCompactField arrêtait son setter schema dès qu’un contrôle existait. Lors de la réutilisation par position dans ha-form, le nouveau schéma pouvait ainsi garder un ancien sélecteur de contenu dans les interactions. Le setter met désormais à jour le contrat du sélecteur à chaque affectation et ne recrée le contrôle que pour un changement entre booléen et sélecteur. Le champ radio est un champ ha-form local scalaire, avec fieldset/legend et deux entrées HTML radio ; le rendu et les interactions des badges restent natifs HA.

## Choix Manuel — 0.10.0

Le [catalogue hui-card-picker](https://github.com/home-assistant/frontend/blob/dev/src/panels/lovelace/editor/card-editor/hui-card-picker.ts) construit le choix manual avec `{type: ""}` et transmet cette configuration via config-changed. Ce signal doit ouvrir une saisie manuelle, pas être traité comme une carte complète. Le conteneur ouvre désormais ha-yaml-editor lorsqu’il est disponible, sinon un repli JSON explicite. Seule une configuration avec un vrai type peut être ajoutée.

L’aperçu de badge en création réutilise hui-badge si enregistré ou createBadgeElement, propage hass et preview, et ignore les résultats asynchrones d’une page quittée. Il reste local à l’éditeur et ne déclenche pas config-changed sur la carte globale.

## Apparence des badges — 0.11.0

Le [composant ha-badge](https://github.com/home-assistant/frontend/blob/dev/src/components/ha-badge.ts) utilise --ha-card-border-width, --ha-card-background, --ha-card-backdrop-filter et --ha-card-box-shadow. Les deux options locales les définissent sur le seul hôte du badge ; les composants natifs les héritent à travers leurs racines shadow. Aucune injection dans leur DOM privé. Une WeakMap mémorise les valeurs inline précédentes pour ne pas effacer des styles qui ne nous appartiennent pas. Le focus natif reste fourni par ha-badge. Les variables sont vérifiées dans le code dev consulté le 16 octobre 2026 ; leur rendu sur l’instance et les thèmes utilisateur reste à tester.
