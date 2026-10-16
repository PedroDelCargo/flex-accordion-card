import test from "node:test";
import assert from "node:assert/strict";
import { normalizeConfig, initialOpen, toggleOpen, moveItem, moveNested, copyNested, sameConfig, itemName, itemTypeName, badgeShowsTime, defaultInteraction, withDefaultInteraction } from "../src/core.js";
const input = () => ({ type: "custom:flex-accordion-card", sections: [
  { id: "a", title: "A", default_open: true, cards: [{ type: "markdown", content: "A" }], badges: ["sensor.a"] },
  { id: "b", title: "B", default_open: true, cards: [], badges: [] },
] });
test("normalisation immuable et conservation des options natives inconnues", () => {
  const source = input(); source.sections[0].cards[0].future_option = { x: true };
  const config = normalizeConfig(source);
  assert.equal(source.layout, undefined);
  assert.equal(config.layout, "unified");
  assert.deepEqual(config.sections[0].badges[0], { type: "entity", entity: "sensor.a" });
  assert.deepEqual(config.sections[0].cards[0].future_option, { x: true });
  config.sections[0].cards[0].content = "changed";
  assert.equal(source.sections[0].cards[0].content, "A");
});
test("configuration incorrecte rejetée avant affichage", () => {
  for (const change of [
    (c) => c.layout = "other", (c) => c.sections[0].columns = 0,
    (c) => c.sections[0].columns = 1.5, (c) => c.sections[1].id = "a",
    (c) => c.sections[0].cards = [{}], (c) => c.animation_duration = -1,
    (c) => c.exclusive = "yes", (c) => c.sections[0].badges = [null],
  ]) { const c = input(); change(c); assert.throws(() => normalizeConfig(c)); }
});
test("ouverture exclusive déterministe et fermeture autorisée", () => {
  const config = normalizeConfig({ ...input(), exclusive: true });
  assert.deepEqual([...initialOpen(config)], ["a"]);
  assert.deepEqual([...toggleOpen(new Set(["a"]), "b", true)], ["b"]);
  assert.equal(toggleOpen(new Set(["b"]), "b", true).size, 0);
  assert.deepEqual([...toggleOpen(new Set(["a"]), "b", false)], ["a", "b"]);
});
test("ouverture conservée par id après réordonnancement et suppression", () => {
  const config = normalizeConfig(input()); config.sections.reverse();
  assert.deepEqual([...initialOpen(config, new Set(["a", "deleted"]))], ["a"]);
});
test("slots DnD avant/après et bornes", () => {
  assert.deepEqual(moveItem(["a", "b", "c"], 0, 3), ["b", "c", "a"]);
  assert.deepEqual(moveItem(["a", "b", "c"], 2, 0), ["c", "a", "b"]);
  assert.deepEqual(moveItem(["a", "b", "c"], 1, 2), ["a", "b", "c"]);
  assert.throws(() => moveItem([], 0, 0), RangeError);
});
test("transfert entre sections sans perte de configuration", () => {
  const source = normalizeConfig(input());
  const moved = moveNested(source, "cards", 0, 0, 1, 0);
  assert.equal(moved.sections[0].cards.length, 0);
  assert.equal(moved.sections[1].cards[0].content, "A");
  assert.equal(source.sections[0].cards.length, 1);
  const badgeMoved = moveNested(source, "badges", 0, 0, 1, 0);
  assert.equal(badgeMoved.sections[1].badges[0].entity, "sensor.a");
  assert.throws(() => moveNested(source, "cards", 0, 2, 1, 0), RangeError);
});
test("aller-retour HA : ordre des clés sans importance", () => {
  assert.equal(sameConfig({ entity: "sensor.a", name: "A", tap_action: { action: "none" } }, { tap_action: { action: "none" }, name: "A", entity: "sensor.a" }), true);
  assert.equal(sameConfig({ name: "A" }, { name: "B" }), false);
});
test("noms personnalisés et friendly names sans rendu d’objet brut", () => {
  const hass = { states: { "light.a": { attributes: { friendly_name: "Lampe du salon" } } } };
  assert.equal(itemName({ type: "entity", entity: "light.a" }, hass), "Lampe du salon");
  assert.equal(itemName({ type: "entity", entity: "light.a", name: "Mon nom" }, hass), "Mon nom");
  assert.equal(itemName({ type: "entity", entity: "light.a", name: { device: true } }, hass), "Lampe du salon");
  assert.equal(itemName({ type: "entity", entity: "light.a", name: { device: true } }, { ...hass, formatEntityName: () => "Nom formaté HA" }), "Nom formaté HA");
});
test("actions adaptées et priorité absolue aux actions explicites", () => {
  assert.deepEqual(defaultInteraction({ type: "button", entity: "light.a" }, "cards"), { action: "toggle" });
  assert.deepEqual(defaultInteraction({ type: "entity", entity: "switch.a" }, "badges"), { action: "toggle" });
  assert.equal(defaultInteraction({ type: "entity", entity: "sensor.a" }, "badges").action, "more-info");
  assert.equal(defaultInteraction({ type: "button", entity: "input_button.a" }, "cards").perform_action, "input_button.press");
  assert.equal(defaultInteraction({ type: "entity", entity: "scene.a" }, "badges").perform_action, "scene.turn_on");
  const explicit = { type: "button", entity: "light.a", tap_action: { action: "none" }, name: "Conserver" };
  assert.equal(withDefaultInteraction(explicit, "cards"), explicit);
  assert.equal(withDefaultInteraction({ type: "tile", entity: "light.a" }, "cards").tap_action, undefined);
  assert.equal(withDefaultInteraction({ type: "custom:third-party", entity: "light.a" }, "cards").tap_action, undefined);
});
test("copie profonde : original, destination et actions restent indépendants", () => {
  const config = normalizeConfig(input()); config.sections[0].badges[0].visibility = [{ condition: "state", entity: "sensor.a", state: "on" }];
  const copied = copyNested(config, "badges", 0, 0, 1); copied.sections[1].badges[0].visibility[0].state = "off";
  assert.equal(copied.sections[0].badges.length, 1); assert.equal(copied.sections[1].badges.length, 1);
  assert.equal(copied.sections[0].badges[0].visibility[0].state, "on"); assert.equal(config.sections[1].badges.length, 0);
  assert.throws(() => copyNested(config, "cards", 0, 12, 1), RangeError);
});
test("format d’heure uniquement pour le contenu temporel affiché", () => {
  const hass = { states: { "sensor.date": { attributes: { device_class: "timestamp" } }, "sensor.temp": { attributes: { device_class: "temperature" } } } };
  assert.equal(badgeShowsTime({ entity: "sensor.temp" }, hass), false);
  assert.equal(badgeShowsTime({ entity: "light.salon" }, hass), false);
  assert.equal(badgeShowsTime({ entity: "sensor.date" }, hass), true);
  assert.equal(badgeShowsTime({ entity: "sensor.date", state_content: "name" }, hass), false);
  assert.equal(badgeShowsTime({ entity: "sensor.temp", state_content: ["last_changed"] }, hass), true);
  assert.equal(badgeShowsTime({ entity: "sensor.temp", state_content: "last-changed" }, hass), true);
  assert.equal(badgeShowsTime({ entity: "sensor.date", show_state: false }, hass), false);
  assert.equal(badgeShowsTime({ entity: "calendar.work", state_content: "start_time" }, hass), true);
});
test("type de carte localisé et conservation des conditions de section", () => {
  assert.equal(itemTypeName({ type: "button" }), "Bouton");
  assert.equal(itemTypeName({ type: "gauge" }, { localize: () => "Jauge native" }), "Jauge native");
  const config = input(); config.background = true; config.sections[0].visibility = [{ condition: "state", entity: "sensor.a", state: "on" }];
  const normalized = normalizeConfig(config); assert.equal(normalized.background, true); assert.deepEqual(normalized.sections[0].visibility, config.sections[0].visibility);
  config.sections[0].visibility = {}; assert.throws(() => normalizeConfig(config));
});
test("en-tête global facultatif : validation, badges normalisés et désactivation sans perte", () => {
  assert.equal(normalizeConfig(input()).header, undefined);
  const config = input(); config.header = { title: "Maison", icon: "mdi:home", badges: ["sensor.a"] };
  const normalized = normalizeConfig(config); assert.equal(normalized.header.enabled, true); assert.deepEqual(normalized.header.badges, [{ type: "entity", entity: "sensor.a" }]);
  config.header.enabled = false; assert.equal(normalizeConfig(config).header.title, "Maison");
  for (const header of [false, "titre", { enabled: "oui" }, { title: 12 }, { badges: {} }]) assert.throws(() => normalizeConfig({ ...input(), header }));
});

test("durée de 750ms et taille numérique facultative sans valeur YAML implicite", () => {
 const config=input(); config.header={title:"Maison"}; const normalized=normalizeConfig(config); assert.equal(normalized.animation_duration,750); assert.equal(Object.hasOwn(normalized.header,"text_size"),false);
 for(const size of [12,17.5,30,96]) {config.header.text_size=size; assert.equal(normalizeConfig(config).header.text_size,size);}
 for(const size of [null,""]) {config.header.text_size=size; assert.equal(Object.hasOwn(normalizeConfig(config).header,"text_size"),false);}
 for(const [old,size] of [["small",16],["medium",18],["large",20]]) {config.header.text_size=old; assert.equal(normalizeConfig(config).header.text_size,size);}
 for(const size of ["17",0,-1,true]) {config.header.text_size=size; assert.throws(()=>normalizeConfig(config));}
 config.animation_duration=220; delete config.header.text_size; assert.equal(normalizeConfig(config).animation_duration,220);
});

test("sections fixes validées et exclues de l’état exclusif", () => {
 const source=input(); source.exclusive=true; source.sections.unshift({id:"top",title:"En-tête",always_open:true,cards:[]}); source.sections.push({id:"bottom",title:"Pied",always_open:true,default_open:true,cards:[]});
 const config=normalizeConfig(source); assert.equal(config.sections[0].always_open,true); assert.equal(config.sections[1].always_open,false); assert.equal(source.sections[1].always_open,undefined);
 assert.deepEqual([...initialOpen(config)],["a"]); assert.deepEqual([...initialOpen(config,new Set(["top","bottom","b"]))],["b"]);
 for(const invalid of ["true",1,null]) { const bad=input(); bad.sections[0].always_open=invalid; if(invalid===null)assert.equal(normalizeConfig(bad).sections[0].always_open,false); else assert.throws(()=>normalizeConfig(bad)); }
 config.sections.reverse(); assert.deepEqual([...initialOpen(config,new Set(["top","b"]))],["b"]);
});

test("badge raccourci natif : texte, type localisé et actions sans entité", () => {
 const config=input();config.sections[0].badges=[{type:"shortcut",text:"Accueil",icon:"mdi:home",tap_action:{action:"navigate",navigation_path:"/home"}}];const badge=normalizeConfig(config).sections[0].badges[0];assert.equal(itemName(badge),"Accueil");assert.equal(itemTypeName(badge,{language:"en"},"badges"),"Shortcut");assert.equal(withDefaultInteraction(badge,"badges"),badge);assert.equal(badge.entity,undefined);
});

test("apparence de badge : booléens validés et conservés sans modifier les actions", () => {
 const config=input();config.sections[0].badges=[{type:'entity',entity:'sensor.a',hide_border:true,transparent_background:false,tap_action:{action:'none'}}];const badge=normalizeConfig(config).sections[0].badges[0];assert.equal(badge.hide_border,true);assert.equal(badge.transparent_background,false);assert.equal(badge.tap_action.action,'none');config.sections[0].badges[0].hide_border='true';assert.throws(()=>normalizeConfig(config));
});
