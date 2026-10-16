import { messages, language, t, localizeSchema } from "../src/i18n.js";
import test from "node:test";
import assert from "node:assert/strict";
import { itemName } from "../src/core.js";
import { TestElement, ControlledEditor, NativeStack, NativeContent } from "./dom-fixture.mjs";
import { FlexAccordionCardEditor } from "../src/editor.js";
import { FlexAccordionCard, FlexAccordionSectionHost, badgeNativeConfig, applyBadgeAppearance } from "../src/card.js";
import { createEntityBadgeEditor, entityBadgeSchema, FlexBadgeDisplayOptions, FlexCompactField, compactSchema, FlexBadgeExpandable, badgeConfigForType, FlexBadgeTypeField } from "../src/badge-editor.js";
const source = () => ({ type: "custom:flex-accordion-card", sections: [
  { id: "living", title: "Salon", default_open: true, cards: [{ type: "button", entity: "light.salon" }], badges: [{ type: "entity", entity: "sensor.temperature", name: "Nom initial", show_state: true, show_name: false }] },
  { id: "energy", title: "Énergie", cards: [], badges: [] },
] });
function setup() {
  const editor = new FlexAccordionCardEditor(); editor.setConfig(source());
  editor.hass = { states: { "light.salon": { attributes: { friendly_name: "Lampe du salon" } }, "sensor.temperature": { attributes: { friendly_name: "Température du salon" } } } };
  editor._openSection("living"); return editor;
}
function bind(editor, wrapper = false) {
  editor._selection = { kind: "badges", i: 0 }; const node = new ControlledEditor();
  editor._bindEditor(node, wrapper, new TestElement(), editor._epoch); return node;
}
test("badge contrôlé : nom puis autres réglages restent cumulés après les ticks hass", () => {
  const editor = setup(); const native = bind(editor); const nodes = [];
  editor.addEventListener("config-changed", (event) => { nodes.push(native); editor.setConfig(structuredClone(event.detail.config)); });
  for (const char of "Mon badge personnalisé") {
    native.edit("name", native.config.name === "Nom initial" ? char : native.config.name + char);
    for (let tick = 0; tick < 5; tick++) editor.hass = { ...editor.hass };
  }
  native.edit("show_name", true); native.edit("show_state", false); native.edit("color", "green");
  for (let tick = 0; tick < 100; tick++) editor.hass = { ...editor.hass };
  assert.equal(native.rendered.name, "Mon badge personnalisé"); assert.equal(native.rendered.show_name, true); assert.equal(native.rendered.show_state, false); assert.equal(native.rendered.color, "green");
  assert.deepEqual(native.config, editor._config.sections[0].badges[0]); assert.equal(editor._active.node, native); assert.ok(nodes.every((node) => node === native));
});
test("suppression volontaire de nom/action et événement invalide", () => {
  const editor = setup(); const native = bind(editor);
  const updated = { ...native.config }; delete updated.name;
  native.dispatchEvent(new CustomEvent("config-changed", { detail: { config: updated } }));
  assert.equal(Object.hasOwn(editor._config.sections[0].badges[0], "name"), false); assert.equal(Object.hasOwn(native.rendered, "name"), false);
  native.dispatchEvent(new CustomEvent("config-changed", { detail: { config: { ...updated, name: "Ignore" }, error: "Invalid YAML" } }));
  assert.equal(Object.hasOwn(editor._config.sections[0].badges[0], "name"), false);
});
test("action implicite adaptée au changement d’entité sans écraser une action explicite", () => {
  const editor = setup(); editor._config.sections[0].badges[0].entity = "light.salon"; const native = bind(editor);
  assert.equal(native.config.tap_action.action, "toggle");
  native.edit("name", "Lumière"); assert.equal(Object.hasOwn(editor._config.sections[0].badges[0], "tap_action"), false);
  native.edit("entity", "sensor.temperature"); assert.equal(native.config.tap_action, undefined);
  native.edit("entity", "input_button.a"); assert.equal(native.config.tap_action.perform_action, "input_button.press");
  native.edit("tap_action", { action: "more-info" }); native.edit("entity", "switch.a");
  assert.equal(native.config.tap_action.action, "more-info"); assert.equal(editor._config.sections[0].badges[0].tap_action.action, "more-info");
});
test("wrapper natif : value reste synchronisé et les échos ne bouclent pas", async () => {
  class Wrapper extends ControlledEditor {
    set value(config) { this.setConfig(config); queueMicrotask(() => this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this.config } }))); }
    get value() { return this.config; }
  }
  const editor = setup(); editor._selection = { kind: "badges", i: 0 }; const native = new Wrapper(); let count = 0;
  editor.addEventListener("config-changed", (event) => { count++; editor.setConfig(structuredClone(event.detail.config)); });
  editor._bindEditor(native, true, new TestElement(), editor._epoch); await new Promise((resolve) => setTimeout(resolve, 0));
  native.edit("name", "Wrapper"); native.edit("show_name", true); await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(native.value.name, "Wrapper"); assert.equal(native.value.show_name, true); assert.equal(count, 2);
});
test("échos réordonnés, mise à jour externe et destruction d’un ancien éditeur", () => {
  const editor = setup(); const native = bind(editor); const epoch = editor._epoch;
  const config = editor._config; editor.setConfig({ sections: config.sections, animation_duration: config.animation_duration, animation: config.animation, exclusive: config.exclusive, layout: config.layout, type: config.type });
  assert.equal(editor._epoch, epoch); assert.equal(editor._active.node, native);
  const external = structuredClone(editor._config); external.sections[0].badges[0].name = "Externe"; editor.setConfig(external);
  assert.equal(editor._active.node, native); assert.equal(native.config.name, "Externe");
  editor._backToSection(); native.edit("name", "Événement de l’ancien éditeur");
  assert.equal(editor._config.sections[0].badges[0].name, "Externe");
});
test("pages contextuelles, groupes de section et retour à l’accordéon d’origine", async () => {
  const editor = setup();
  assert.equal(editor.shadowRoot.querySelectorAll(".group").length, 4);
  assert.equal(editor.shadowRoot.querySelector('.group[data-kind="header"]').open, true);
  assert.equal(editor.shadowRoot.querySelector('.group[data-kind="badges"]').open, false);
  const pencil = editor.shadowRoot.querySelectorAll('.list[data-kind="badges"] .icon-button').find((node) => node.getAttribute("aria-label") === "Modifier le badge");
  assert.equal(pencil.getAttribute("aria-label"), "Modifier le badge"); assert.equal(pencil.querySelectorAll("svg").length, 1); assert.equal(pencil.textContent, "");
  editor._select({ kind: "badges", s: 0, i: 0 }); await editor.updateComplete;
  assert.ok(editor.shadowRoot.querySelector(".item-page")); assert.equal(editor.shadowRoot.querySelectorAll(".list").length, 0);
  assert.ok(editor._active); editor._backToSection();
  assert.ok(editor.shadowRoot.querySelector(".section-page")); assert.equal(editor.shadowRoot.querySelector('.group[data-kind="badges"]').open, true);
  editor._sectionId = null; editor._render(); assert.ok(editor.shadowRoot.querySelector(".overview-page")); assert.equal(editor.shadowRoot.querySelectorAll(".list").length, 0);
});
test("friendly names mis à jour dans les listes sans reconstruction", () => {
  const editor = setup(); const before = editor.shadowRoot.querySelector('.list[data-kind="cards"] .item-label');
  assert.equal(before.textContent, "Lampe du salon");
  editor.hass = { states: { "light.salon": { attributes: { friendly_name: "Nouveau nom" } } } };
  assert.equal(editor.shadowRoot.querySelector('.list[data-kind="cards"] .item-label'), before); assert.equal(before.textContent, "Nouveau nom");
});
test("import tardif de l’éditeur de pile sans recréation de l’éditeur actif", async () => {
  const editor = setup(); const native = bind(editor); const original = NativeStack.getConfigElement;
  let resolve; NativeStack.getConfigElement = () => new Promise((done) => resolve = done);
  try {
    const initialized = editor._initialize(); await new Promise((done) => setTimeout(done, 0));
    native.edit("name", "Pendant le chargement"); resolve(new TestElement()); await initialized;
    assert.equal(editor._active.node, native); assert.equal(native.config.name, "Pendant le chargement");
  } finally { NativeStack.getConfigElement = original; }
});
test("rendu : ordre titre/badges/chevron épais et actions contextualisées", async () => {
  const card = new FlexAccordionCard(); card.setConfig(source()); card.hass = { states: {} }; await card.updateComplete;
  const header = card.shadowRoot.querySelector(".header");
  assert.deepEqual(header.children.map((child) => child.className), ["toggle", "badges", "chevron"]);
  assert.equal(header.querySelector(".chevron svg").getAttribute("stroke-width"), "2.3");
  assert.equal(card.shadowRoot.querySelector(".cards").children[0].config.tap_action.action, "toggle");
  assert.equal(Object.hasOwn(card._config.sections[0].cards[0], "tap_action"), false);
});
test("formulaire HA contrôlé : données renvoyées et identité conservée", () => {
  customElements.define("ha-form", class extends TestElement {});
  const editor = setup();
  const form = editor._form({ title: "Initial" }, [{ name: "title", selector: { text: {} } }], (value) => { editor._currentSection().title = value.title; return editor._emit(false); });
  form.dispatchEvent(new CustomEvent("value-changed", { detail: { value: { title: "Nouveau titre" } } }));
  assert.equal(form.data.title, "Nouveau titre"); assert.equal(editor._currentSection().title, "Nouveau titre");
});
test("réglages généraux en premier et navigation dans un conteneur sticky", () => {
  const editor = setup(); editor._sectionId = null; editor._render();
  const root = editor.shadowRoot.querySelector(".editor");
  assert.ok(root.children.indexOf(editor.shadowRoot.querySelector('.group[data-group="global"]')) < root.children.indexOf(editor.shadowRoot.querySelector(".section-editor")));
  editor._openSection("living"); const nav = editor.shadowRoot.querySelector(".nav-header");
  assert.ok(nav.querySelector(".back"));
  assert.match(editor.shadowRoot.querySelector("style").textContent, /\.nav-header\{position:sticky/);
  for (const icon of editor.shadowRoot.querySelectorAll("svg")) assert.equal(icon.getAttribute("stroke-width"), "2.3");
  assert.equal(editor.shadowRoot.querySelector('.list[data-kind="cards"] .type-label').textContent, "Bouton");
});
test("transferts par icônes : copie indépendante, déplacement et aucun sélecteur redondant", () => {
  const editor = setup();
  assert.equal(editor.shadowRoot.querySelectorAll(".destinations").length, 0);
  assert.equal(editor.shadowRoot.querySelector('.list[data-kind="badges"] .row').querySelectorAll("select").length, 0);
  const button = editor.shadowRoot.querySelectorAll('.list[data-kind="badges"] .row button').find((node) => node.getAttribute("aria-label") === "Copier dans une section");
  button.dispatchEvent(new Event("click"));
  editor.shadowRoot.querySelector('.transfer-options [data-destination="energy"]').dispatchEvent(new Event("click"));
  assert.equal(editor._config.sections[0].badges.length, 1); assert.equal(editor._config.sections[1].badges.length, 1);
  editor._config.sections[1].badges[0].name = "Copie"; assert.equal(editor._config.sections[0].badges[0].name, "Nom initial");
  editor._transfer = { kind: "badges", s: 0, i: 0, mode: "move" }; editor._render();
  editor.shadowRoot.querySelector('.transfer-options [data-destination="energy"]').dispatchEvent(new Event("click"));
  assert.equal(editor._config.sections[0].badges.length, 0); assert.equal(editor._config.sections[1].badges.length, 2);
});
test("formulaire de badge : champ temporel conditionnel, réglages et identité conservés", () => {
  const editor = setup(); const badge = createEntityBadgeEditor();
  editor._selection = { kind: "badges", i: 0 }; editor._bindEditor(badge, false, new TestElement(), editor._epoch);
  const form = badge.querySelector("ha-form");
  const hasTime = () => form.schema.some((group) => group.schema?.some((field) => field.name === "time_format"));
  assert.equal(hasTime(), false);
  form.dispatchEvent(new CustomEvent("value-changed", { detail: { value: { ...form.data, name: "Nom maintenu", state_content: "last_changed", time_format: "relative" } } }));
  assert.equal(hasTime(), true); assert.equal(form.data.name, "Nom maintenu");
  form.dispatchEvent(new CustomEvent("value-changed", { detail: { value: { ...form.data, state_content: "state" } } }));
  assert.equal(hasTime(), false); assert.equal(editor._config.sections[0].badges[0].time_format, "relative");
  editor.hass = { states: { "sensor.temperature": { attributes: { device_class: "timestamp" } } } }; assert.equal(hasTime(), true);
  form.dispatchEvent(new CustomEvent("value-changed", { detail: { value: { ...form.data, show_state: false } } }));
  assert.equal(hasTime(), false); assert.equal(badge.querySelector("ha-form"), form); assert.equal(form.data.name, "Nom maintenu");
});
test("bascule Éditeur de code / Éditeur visuel et contrat YAML HA", () => {
  customElements.define("ha-yaml-editor", class extends TestElement {});
  const editor = setup(); const badge = createEntityBadgeEditor(); editor._selection = { kind: "badges", i: 0 }; editor._bindEditor(badge, false, new TestElement(), editor._epoch);
  const mode = editor._modeButton(badge); assert.equal(mode.getAttribute("aria-label"), "Éditeur de code");
  mode.dispatchEvent(new Event("click")); const yaml = badge.querySelector("ha-yaml-editor"); assert.ok(yaml); assert.equal(mode.getAttribute("aria-label"), "Éditeur visuel");
  const typed = { ...yaml.defaultValue, name: "Code sans perte" }; yaml.dispatchEvent(new CustomEvent("value-changed", { detail: { isValid: true, value: typed } }));
  assert.equal(editor._config.sections[0].badges[0].name, "Code sans perte");
  mode.dispatchEvent(new Event("click")); assert.equal(mode.getAttribute("aria-label"), "Éditeur de code"); assert.equal(badge.querySelector("ha-form").data.name, "Code sans perte");
});
test("édition native des conditions : sections et badges sans perte des autres options", async () => {
  customElements.define("hui-card-visibility-editor", class extends TestElement {});
  const editor = setup(); let conditions = [{ condition: "state", entity: "light.salon", state: "on" }];
  const sectionEditor = editor.shadowRoot.querySelector("hui-card-visibility-editor");
  sectionEditor.dispatchEvent(new CustomEvent("value-changed", { detail: { value: { ...sectionEditor.config, visibility: conditions } } }));
  assert.deepEqual(editor._config.sections[0].visibility, conditions); assert.deepEqual(sectionEditor.config.visibility, conditions);
  editor._select({ kind: "badges", s: 0, i: 0 }); await editor.updateComplete;
  const badgeEditor = editor.shadowRoot.querySelector("hui-card-visibility-editor");
  badgeEditor.dispatchEvent(new CustomEvent("value-changed", { detail: { value: { ...badgeEditor.config, visibility: conditions } } }));
  assert.deepEqual(editor._config.sections[0].badges[0].visibility, conditions); assert.equal(editor._config.sections[0].badges[0].name, "Nom initial");
  const form = editor._active.node.querySelector("ha-form"); form.dispatchEvent(new CustomEvent("value-changed", { detail: { value: { ...form.data, name: "Nouveau nom" } } }));
  assert.deepEqual(editor._config.sections[0].badges[0].visibility, conditions); assert.equal(badgeEditor.config.name, "Nouveau nom");
  const without = { ...badgeEditor.config }; delete without.visibility;
  badgeEditor.dispatchEvent(new CustomEvent("value-changed", { detail: { value: without } })); assert.equal(Object.hasOwn(editor._config.sections[0].badges[0], "visibility"), false);
});
test("section conditionnelle sans wrapper : erreur explicite, aucun contenu révélé", async () => {
  const card = new FlexAccordionCard(); const config = source(); config.sections[0].visibility = [{ condition: "state", entity: "light.salon", state: "on" }];
  card.setConfig(config); await card.updateComplete;
  assert.match(card.shadowRoot.querySelector(".error").textContent, /conditions de visibilité/);
  assert.equal(card.shadowRoot.querySelectorAll(".section").length, 1);
});
test("visibilité de section déléguée au wrapper HA, état d’ouverture conservé et fond global", async () => {
  class NativeWrapper extends TestElement {
    set config(value) {
      this._config = value;
      this.host = value.type === "custom:flex-accordion-section-host" ? document.createElement("flex-accordion-section-host") : new NativeContent();
      this.host.setConfig(value); this.replaceChildren(this.host);
    }
    get config() { return this._config; }
    // Test-controlled visibility outcome; this is deliberately not a condition evaluator.
    set hass(value) { this.hidden = Boolean(this.config?.visibility?.length && value?.sectionVisible === false); }
  }
  customElements.define("hui-card", NativeWrapper);
  const card = new FlexAccordionCard(); const config = source(); config.background = true; config.sections[0].visibility = [{ condition: "state", entity: "light.salon", state: "on" }];
  card.setConfig(config); card.hass = { sectionVisible: false }; await card.updateComplete;
  const wrapped = card.shadowRoot.querySelector("hui-card"); assert.equal(wrapped.hidden, true); assert.deepEqual(wrapped.config.visibility, config.sections[0].visibility);
  const section = card._sectionNodes[0]; card._toggle("energy"); card.hass = { sectionVisible: true };
  assert.equal(wrapped.hidden, false); assert.equal(card._sectionNodes[0], section); assert.ok(card.shadowRoot.querySelector(".root").classList.contains("with-background"));
  const token = wrapped.config.host; card.disconnectedCallback(); assert.throws(() => new FlexAccordionSectionHost().setConfig({ host: token }));
  card.connectedCallback(); const host = new FlexAccordionSectionHost(); host.setConfig({ host: token }); assert.ok(host.contains(section));
});
test("badge conditionnel : repli vers hui-card sans réimplémenter les conditions", async () => {
  const card = new FlexAccordionCard(); const config = source();
  config.sections[0].badges[0].visibility = [{ condition: "state", entity: "light.salon", state: "on" }];
  card.setConfig(config); card.hass = { sectionVisible: false }; await card.updateComplete;
  const wrapper = card.shadowRoot.querySelector(".badges hui-card");
  assert.ok(wrapper); assert.equal(wrapper.hidden, true); assert.equal(wrapper.config.entity, "sensor.temperature");
  assert.deepEqual(wrapper.config.visibility, config.sections[0].badges[0].visibility);
  card.hass = { sectionVisible: true }; assert.equal(wrapper.hidden, false);
});
test("conditions HA : les lignes dépliées gardent leur identité après modification et écho", async () => {
  class KeyedVisibility extends TestElement {
    constructor() { super(); this.keys = new WeakMap(); this.rows = []; }
    set config(value) {
      this._config = value;
      this.rows = (value.visibility || []).map((condition) => {
        if (!this.keys.has(condition)) this.keys.set(condition, { expanded: false });
        return this.keys.get(condition);
      });
    }
    get config() { return this._config; }
    change(index, patch) {
      const conditions = [...this.config.visibility]; const next = { ...conditions[index], ...patch };
      this.keys.set(next, this.keys.get(conditions[index])); conditions[index] = next;
      this.dispatchEvent(new CustomEvent("value-changed", { detail: { value: { ...this.config, visibility: conditions } } })); return conditions;
    }
  }
  customElements.define("hui-card-visibility-editor", KeyedVisibility);
  const editor = setup(); editor._currentSection().visibility = [{ condition: "state", entity: "light.salon", state: "on" }, { condition: "state", entity: "switch.a", state: "off" }]; editor._render();
  editor.addEventListener("config-changed", (event) => editor.setConfig(structuredClone(event.detail.config)));
  const sectionUI = editor.shadowRoot.querySelector("hui-card-visibility-editor"); const firstRow = sectionUI.rows[0]; firstRow.expanded = true; sectionUI.rows[1].expanded = true;
  const emitted = sectionUI.change(0, { state: "off" });
  assert.equal(sectionUI.config.visibility, emitted); assert.equal(sectionUI.rows[0], firstRow); assert.equal(firstRow.expanded, true); assert.equal(sectionUI.rows[1].expanded, true);
  assert.notEqual(editor._config.sections[0].visibility[0], emitted[0]);
  editor._currentSection().title = "Titre modifié"; editor._emit(false); assert.equal(sectionUI.rows[0], firstRow);
  editor._config.sections[0].badges[0].visibility = structuredClone(editor._config.sections[0].visibility);
  editor._select({ kind: "badges", s: 0, i: 0 }); await editor.updateComplete;
  const badgeUI = editor.shadowRoot.querySelector("hui-card-visibility-editor"); const badgeRow = badgeUI.rows[0]; badgeRow.expanded = true;
  const changed = badgeUI.change(0, { entity: "switch.b" }); assert.equal(badgeUI.config.visibility, changed); assert.equal(badgeUI.rows[0], badgeRow); assert.equal(badgeRow.expanded, true);
  const form = editor._active.node.querySelector("ha-form"); form.dispatchEvent(new CustomEvent("value-changed", { detail: { value: { ...form.data, name: "Nom modifié" } } }));
  editor.hass = { ...editor.hass }; assert.equal(badgeUI.rows[0], badgeRow); assert.equal(badgeRow.expanded, true);
});
test("visibilité en dernier et état des groupes capturé avant une reconstruction", () => {
  const editor = setup(); const groups = editor.shadowRoot.querySelectorAll(".group");
  assert.deepEqual(groups.map((group) => group.dataset.kind), ["header", "badges", "cards", "visibility"]);
  const visibility = groups.at(-1); visibility.open = true;
  // No toggle event is necessary: even an immediate rebuild preserves this state.
  editor._render(); assert.equal(editor.shadowRoot.querySelector('.group[data-kind="visibility"]').open, true);
});
test("en-tête global : activation, réglages conservés et édition contextuelle des badges", async () => {
  const editor = setup(); editor._sectionId = null; editor._render();
  const headerGroup = () => editor.shadowRoot.querySelector('.group[data-group="global-header"]');
  const enableForm = () => headerGroup().querySelectorAll("ha-form").find((form) => form.schema.some((field) => field.name === "enabled"));
  enableForm().dispatchEvent(new CustomEvent("value-changed", { detail: { value: { enabled: true } } }));
  const titles = headerGroup().querySelectorAll("ha-form").find((form) => form.schema.some((field) => field.name === "title"));
  titles.dispatchEvent(new CustomEvent("value-changed", { detail: { value: { title: "Ma maison", icon: "mdi:home" } } }));
  enableForm().dispatchEvent(new CustomEvent("value-changed", { detail: { value: { enabled: false } } })); assert.equal(editor._config.header.title, "Ma maison");
  enableForm().dispatchEvent(new CustomEvent("value-changed", { detail: { value: { enabled: true } } })); assert.equal(editor._config.header.icon, "mdi:home");
  editor._selectHeaderBadge(null); editor._saveItem({ type: "entity", entity: "sensor.temperature", name: "Badge global" }); await editor.updateComplete;
  assert.equal(editor._selection.scope, "header"); assert.equal(editor._config.sections[0].badges.length, 1);
  const node = editor._active.node; const form = node.querySelector("ha-form");
  form.dispatchEvent(new CustomEvent("value-changed", { detail: { value: { ...form.data, name: "Nom global modifié" } } }));
  editor.setConfig(structuredClone(editor._config)); assert.equal(editor._active.node, node); assert.equal(editor._config.header.badges[0].name, "Nom global modifié");
  editor._backToSection(); assert.ok(editor.shadowRoot.querySelector(".overview-page")); assert.equal(editor._config.header.title, "Ma maison");
  assert.equal(headerGroup().querySelector(".item-label").textContent, "Nom global modifié");
});
test("rendu de l’en-tête global optionnel avec icône, titre et vrai badge", async () => {
  const card = new FlexAccordionCard(); const config = source();
  card.setConfig(config); await card.updateComplete; assert.equal(card.shadowRoot.querySelector(".card-header"), null);
  config.header = { title: "Ma maison", icon: "mdi:home", badges: [{ type: "entity", entity: "sensor.temperature" }] };
  card.setConfig(config); card.hass = { states: {} }; await card.updateComplete;
  const header = card.shadowRoot.querySelector(".card-header"); assert.equal(header.querySelector("h2").textContent, "Ma maison"); assert.equal(header.querySelector("ha-icon").icon, "mdi:home");
  assert.equal(header.querySelector(".badges").children.length, 1); assert.equal(header.querySelector(".toggle"), null); assert.equal(card._sectionNodes.length, 2);
  config.header.enabled = false; card.setConfig(config); await card.updateComplete; assert.equal(card.shadowRoot.querySelector(".card-header"), null); assert.equal(card._config.header.badges.length, 1);
});
test("options d’affichage compactes : 40px par ligne et switches natifs contrôlés", () => {
  customElements.define("ha-switch", class extends TestElement {});
  const options = new FlexBadgeDisplayOptions(); options.schema = { name: "display", type: "flex-badge-display", flatten: true };
  options.data = { type: "entity", name: "À conserver", show_name: false, show_state: true, visibility: [{ condition: "state", entity: "light.a", state: "on" }] };
  const controls = options.shadowRoot.querySelectorAll("ha-switch"); assert.equal(controls.length, 4); assert.match(options.shadowRoot.querySelector("style").textContent, /min-height:40px/);
  let saved; options.addEventListener("value-changed", (event) => saved = event.detail.value);
  controls[0].checked = true; controls[0].dispatchEvent(new Event("change")); assert.equal(saved.show_name, true); assert.equal(saved.name, "À conserver"); assert.equal(saved.visibility.length, 1);
  options.data = saved; assert.equal(options.shadowRoot.querySelectorAll("ha-switch")[0], controls[0]); options.disabled = true; assert.ok(controls.every((control) => control.disabled));
  assert.equal(entityBadgeSchema({ type: "entity" }).find((field) => field.name === "content").schema.find((field) => field.name === "display").flatten, true);
});

test("copie dans la section courante indépendante et titres contextualisés", () => {
 const editor = setup(); assert.equal(editor.shadowRoot.querySelector(".section-title").textContent, "Section · Salon");
 editor._transfer = { kind: "badges", s: 0, i: 0, mode: "copy" }; editor._render();
 editor.shadowRoot.querySelector('.transfer-options [data-destination="living"]').dispatchEvent(new Event("click"));
 assert.equal(editor._config.sections[0].badges.length, 2); editor._config.sections[0].badges[1].name = "Copie"; assert.equal(editor._config.sections[0].badges[0].name, "Nom initial");
 editor._select({kind:"badges",s:0,i:1}); assert.equal(editor.shadowRoot.querySelector(".context-title").textContent, "Badge · Copie");
});
test("champs compacts : sélecteur natif contrôlé et booléen de 40px", () => {
 const schema = compactSchema([{name:"title",selector:{text:{}}},{name:"animation",selector:{boolean:{}}}]);
 const field = new FlexCompactField(); field.schema = schema[0]; field.label = "Titre"; field.data = "Maison";
 const control = field.shadowRoot.querySelector("ha-selector"); assert.deepEqual(control.selector,{text:{}}); assert.equal(control.value,"Maison");
 let saved; field.addEventListener("value-changed", e => saved=e.detail.value); control.dispatchEvent(new CustomEvent("value-changed",{detail:{value:"Salon"}})); field.data=saved; assert.equal(control.value,"Salon"); assert.equal(field.shadowRoot.querySelector("ha-selector"),control);
 const toggle = new FlexCompactField(); toggle.schema=schema[1]; toggle.data=true; assert.equal(toggle._control.checked,true); assert.match(toggle.shadowRoot.querySelector("style").textContent,/min-height:40px/);
});
test("en-tête compact réglable et fondu respectant le mouvement réduit", async () => {
 const card = new FlexAccordionCard(); const config=source(); config.header={title:"Maison",text_size:"medium"}; card.setConfig(config); await card.updateComplete;
 assert.equal(card.shadowRoot.querySelector(".card-header").style.getPropertyValue("--fac-heading-size"),"18px");
 const css=card.shadowRoot.querySelector("style").textContent; assert.match(css,/padding:6px 10px/); assert.match(css,/margin-top:5px/); assert.match(css,/transition:opacity/); assert.match(css,/.panel,.panel-inner,.chevron\{transition:none/);
});

test("copie disponible avec une seule section", () => { const editor=setup(); editor._config.sections.splice(1); editor._render(); const controls=editor.shadowRoot.querySelectorAll('button'); assert.equal(controls.find(n=>n.getAttribute("aria-label")==="Copier dans une section").disabled,false); assert.equal(controls.find(n=>n.getAttribute("aria-label")==="Déplacer dans une autre section").disabled,true); });

test("traductions complètes et repli régional sans toucher aux données utilisateur", () => {
 const keys=Object.keys(messages.fr).sort(); for(const locale of ["fr","en","es","de"]) { assert.deepEqual(Object.keys(messages[locale]).sort(),keys); assert.ok(Object.values(messages[locale]).every(v=>typeof v==="string"&&v)); for(const key of keys) assert.deepEqual((messages[locale][key].match(/\{\w+\}/g)||[]).sort(),(key.match(/\{\w+\}/g)||[]).sort()); }
 assert.equal(language({locale:{language:"es-MX"}}),"es"); assert.equal(language({language:"de-DE"}),"de"); assert.equal(language({language:"it"}),"en");
 assert.equal(t({language:"en"},"Retour à la section {name}",{name:"Cuisine $& {name}"}),"Back to section Cuisine $& {name}");
 const schema=[{name:"layout",selector:{select:{options:[{value:"unified",label:"Carte unique"}]}}}]; const localized=localizeSchema(schema,{language:"de"}); assert.equal(localized[0].selector.select.options[0].label,"Gemeinsame Karte"); assert.equal(schema[0].selector.select.options[0].label,"Carte unique");
});
for (const [locale,settings,prefix,type] of [["fr","Réglages de carte","Section","Bouton"],["en","Card settings","Section","Button"],["es","Ajustes de tarjeta","Sección","Botón"],["de","Karteneinstellungen","Abschnitt","Schaltfläche"]]) test("interface contextualisée dans la langue "+locale, async () => {
 const editor=setup(); editor.hass={language:locale,states:{}}; editor._sectionId=null; editor._render(); assert.equal(editor.shadowRoot.querySelector("h3").textContent,settings);
 editor._openSection("living"); assert.equal(editor.shadowRoot.querySelector(".section-title").textContent,prefix+" · Salon"); assert.equal(editor.shadowRoot.querySelector('.list[data-kind="cards"] .type-label').textContent,type);
 editor._select({kind:"badges",s:0,i:0}); await editor.updateComplete; const active=editor._active?.node; editor.hass={language:locale,states:{}}; if(active)assert.equal(editor._active.node,active); assert.equal(editor._config.sections[0].badges[0].name,"Nom initial");
 const display=new FlexBadgeDisplayOptions(); display.hass={language:locale}; assert.equal(display._controls[0].getAttribute("aria-label"),messages[locale]["Afficher le nom"]);
 assert.equal(itemName({type:"button"},{language:locale}),type);
});
test("champ de taille vide, saisie numérique et effacement sans défaut enregistré", () => {
 const editor=setup(); editor._config.header={enabled:true,title:"Maison",badges:[]}; editor._sectionId=null; editor._render();
 const form=editor.shadowRoot.querySelectorAll("ha-form").find(node=>node.schema.some(field=>field.name==="text_size")); const field=form.schema.find(field=>field.name==="text_size"); assert.ok(field.compact_selector.number); assert.equal(field.compact_selector.number.step,"any"); assert.equal(form.data.text_size,undefined);
 form.dispatchEvent(new CustomEvent("value-changed",{detail:{value:{text_size:23.5}}})); assert.equal(editor._config.header.text_size,23.5);
 form.dispatchEvent(new CustomEvent("value-changed",{detail:{value:{text_size:null}}})); assert.equal(Object.hasOwn(editor._config.header,"text_size"),false);
});

for(const layout of ["unified","separate"]) test("section toujours ouverte sans en-tête/badges, exclusive indépendante : "+layout, async () => {
 const config=source(); config.layout=layout; config.exclusive=true; config.sections[0].always_open=true; config.sections[1].default_open=true; config.sections[1].cards=[{type:"markdown",content:"Accordéon"}]; config.sections.push({id:"footer",title:"Pied",always_open:true,cards:[{type:"heading",heading:"Pied natif"}]});
 const card=new FlexAccordionCard(); card.setConfig(config); await card.updateComplete;
 const fixed=card._sectionNodes[0],footer=card._sectionNodes[2]; assert.equal(fixed.querySelector(".header"),null); assert.equal(fixed.querySelector(".chevron"),null); assert.equal(fixed.querySelector(".badges"),null);
 assert.equal(fixed.querySelector(".panel").getAttribute("aria-labelledby"),null); assert.equal(fixed.querySelector(".panel").getAttribute("aria-label"),"Salon"); assert.equal(fixed.querySelector(".panel").inert,false); assert.equal(footer.querySelector(".panel").inert,false);
 assert.deepEqual([...card._open],["energy"]); const child=fixed.querySelector(".cards").children[0]; assert.ok(child); assert.equal(card._children.some(node=>node.config?.entity==="sensor.temperature"),false);
 card._toggle("energy"); assert.equal(fixed.classList.contains("open"),true); assert.equal(footer.classList.contains("open"),true); assert.equal(card._open.size,0);
 card._toggle("living"); assert.equal(card._open.size,0); card._toggle("energy"); assert.deepEqual([...card._open],["energy"]); assert.equal(fixed.querySelector(".cards").children[0],child);
});
test("éditeur : bascule de section fixe réversible sans perdre titre/icône/badges", () => {
 const editor=setup(); const section=editor._currentSection(); section.icon="mdi:sofa"; const original=structuredClone(section.badges); editor._render();
 let form=editor.shadowRoot.querySelectorAll("ha-form").find(node=>node.schema.some(field=>field.name==="always_open")); assert.ok(form);
 form.dispatchEvent(new CustomEvent("value-changed",{detail:{value:{always_open:true}}}));
 assert.equal(editor._currentSection().always_open,true); assert.deepEqual(editor._currentSection().badges,original); assert.equal(editor.shadowRoot.querySelector('.group[data-kind="badges"]'),null); assert.ok(editor.shadowRoot.querySelector('.group[data-kind="cards"]'));
 form=editor.shadowRoot.querySelectorAll("ha-form").find(node=>node.schema.some(field=>field.name==="always_open")); assert.equal(form.schema.some(field=>field.name==="default_open"||field.name==="icon"),false);
 form.dispatchEvent(new CustomEvent("value-changed",{detail:{value:{always_open:false}}})); assert.equal(editor._currentSection().icon,"mdi:sofa"); assert.deepEqual(editor._currentSection().badges,original); assert.ok(editor.shadowRoot.querySelector('.group[data-kind="badges"]'));
});
test("badges : transfert vers une section fixe exclu, cartes toujours acceptées", () => {
 const editor=setup(); editor._config.sections[1].always_open=true; editor._render();
 const buttons=editor.shadowRoot.querySelector('.list[data-kind="badges"]').querySelectorAll("button"); assert.equal(buttons.find(node=>node.getAttribute("aria-label")==="Déplacer dans une autre section").disabled,true);
 editor._transfer={kind:"badges",s:0,i:0,mode:"copy"}; editor._render(); assert.equal(editor.shadowRoot.querySelector('.transfer-options [data-destination="energy"]'),null); assert.ok(editor.shadowRoot.querySelector('.transfer-options [data-destination="living"]'));
 editor._transfer={kind:"cards",s:0,i:0,mode:"copy"}; editor._render(); assert.ok(editor.shadowRoot.querySelector('.transfer-options [data-destination="energy"]'));
});

test("section fixe : conditions HA conservées et contenu ouvert au réaffichage", async () => {
 const config=source(); config.sections[0].always_open=true; config.sections[0].visibility=[{condition:"state",entity:"light.salon",state:"on"}];
 const card=new FlexAccordionCard(); card.setConfig(config); card.hass={sectionVisible:false}; await card.updateComplete;
 const wrapper=card.shadowRoot.querySelector("hui-card"); assert.equal(wrapper.hidden,true); assert.deepEqual(wrapper.config.visibility,config.sections[0].visibility);
 const fixed=card._sectionNodes[0]; card.hass={sectionVisible:true}; assert.equal(wrapper.hidden,false); assert.equal(fixed.querySelector(".panel").inert,false); assert.equal(fixed.querySelector(".toggle"),null);
});

test("colonnes conditionnelles : grille/vertical réversibles sans perte du nombre", () => {
 const editor=setup(); const content=()=>editor.shadowRoot.querySelector('.group[data-kind="cards"]').querySelector('ha-form');
 assert.equal(content().schema.some(f=>f.name==="columns"),false);
 content().dispatchEvent(new CustomEvent("value-changed",{detail:{value:{layout:"grid"}}})); assert.equal(content().schema.some(f=>f.name==="columns"),true);
 content().dispatchEvent(new CustomEvent("value-changed",{detail:{value:{columns:4}}}));
 content().dispatchEvent(new CustomEvent("value-changed",{detail:{value:{layout:"vertical"}}})); assert.equal(content().schema.some(f=>f.name==="columns"),false); assert.equal(editor._currentSection().columns,4);
 content().dispatchEvent(new CustomEvent("value-changed",{detail:{value:{layout:"grid"}}})); assert.equal(content().data.columns,4);
});
test("copie : section actuelle en tête même si elle n’est pas la première", () => {
 const editor=setup(); editor._config.sections[1].cards=[{type:"markdown",content:"Original"}]; editor._openSection("energy"); editor._transfer={kind:"cards",s:1,i:0,mode:"copy"}; editor._render();
 const choices=editor.shadowRoot.querySelector('.transfer-options').querySelectorAll('button'); assert.equal(choices[0].textContent,"Section actuelle"); assert.equal(choices[0].dataset.destination,"energy"); assert.equal(choices[1].dataset.destination,"living");
 choices[0].dispatchEvent(new Event("click")); assert.equal(editor._config.sections[1].cards.length,2); editor._config.sections[1].cards[1].content="Copie"; assert.equal(editor._config.sections[1].cards[0].content,"Original");
});
test("raccourci natif indisponible : aucune configuration créée", async () => {
 const editor=setup(); editor._helpers={createBadgeElement(){throw Error("unsupported");}}; const pane=new TestElement(); let saved=false; await editor._addShortcut(pane,()=>saved=true,editor._epoch);
 assert.equal(saved,false); assert.match(pane.querySelector('p').textContent,/indisponible/);
});
test("ajout de raccourci natif sans entité, actions et texte préservés", async () => {
 customElements.define('hui-shortcut-badge',NativeContent); const editor=setup(); editor._select({kind:"badges",s:0,i:null}); await editor.updateComplete;
 assert.ok(editor.shadowRoot.querySelector('.pane ha-form').schema.some(field=>field.name==="type"));
 await editor._addShortcut(editor.shadowRoot.querySelector('.pane'),config=>editor._saveItem(config),editor._epoch); await editor.updateComplete;
 const badge=editor._config.sections[0].badges.at(-1); assert.equal(badge.type,"shortcut"); assert.equal(Object.hasOwn(badge,"entity"),false); assert.equal(badge.tap_action.action,"none");
 editor._saveItem({...badge,text:"Navigation",tap_action:{action:"navigate",navigation_path:"/lovelace/home"}}); assert.equal(editor._config.sections[0].badges.at(-1).text,"Navigation"); assert.equal(editor._config.sections[0].badges.at(-1).tap_action.navigation_path,"/lovelace/home");
});

test("ajout unifié : type en premier, entité conditionnelle et ajout sans entité", async () => {
 const editor=setup(); editor._select({kind:"badges",s:0,i:null}); await editor.updateComplete; const pane=editor.shadowRoot.querySelector('.pane'); const form=pane.querySelector('ha-form');
 assert.deepEqual(form.schema.map(f=>f.name),["type","entity","content","interactions"]); assert.equal(pane.querySelectorAll('button').some(n=>n.textContent==="Badge raccourci (sans entité)"),false);
 const add=pane.querySelectorAll('button').find(n=>n.textContent==="Ajouter le badge"); add.dispatchEvent(new Event('click')); assert.equal(editor._config.sections[0].badges.length,1); assert.match(pane.querySelector('.error').textContent,/entité/);
 form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{...form.data,type:"shortcut",icon:"mdi:home",name:"Accueil"}}})); assert.deepEqual(form.schema.map(f=>f.name),["type","content","interactions"]); assert.equal(form.data.entity,undefined);
 form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{...form.data,text:"Ma page",tap_action:{action:"navigate",navigation_path:"/home"}}}}));
 add.dispatchEvent(new Event('click')); await editor.updateComplete; const saved=editor._config.sections[0].badges.at(-1); assert.equal(saved.type,"shortcut"); assert.equal(saved.text,"Ma page"); assert.equal(saved.entity,undefined); assert.equal(saved.tap_action.navigation_path,"/home");
});
test("ordre des réglages identique en édition : type, entité éventuelle, contenu, interactions, visibilité", async () => {
 const editor=setup(); for(const type of ['entity','shortcut']) { editor._config.sections[0].badges[0]=type==='entity'?{type,entity:'sensor.temperature'}:{type,text:'Accueil'}; editor._select({kind:'badges',s:0,i:0}); await editor.updateComplete;
 const pane=editor.shadowRoot.querySelector('.pane'); const controller=pane.querySelector('.entity-badge-editor'); assert.ok(controller); const fields=controller.querySelector('ha-form').schema; assert.deepEqual(fields.map(f=>f.name),type==='entity'?['type','entity','content','interactions']:['type','content','interactions']);
 assert.ok(fields.filter(f=>['content','interactions'].includes(f.name)).every(f=>f.type==='flex-expandable')); assert.ok(pane.querySelector('.group')); assert.ok(pane.children.indexOf(controller)<pane.children.indexOf(pane.querySelector('.group')));
 assert.equal(pane.querySelectorAll('.hint').some(n=>n.textContent.includes('Action par défaut')),false);
 }
});
test("accordéons de badge : ouverture et instance conservées aux changements de données/hass", () => {
 const field=new FlexBadgeExpandable(); field.schema={name:'content',schema:[{name:'name',selector:{text:{}}}]}; field.label='Contenu'; field.details.open=true; const form=field.form;
 field.data={name:'Premier'}; field.hass={states:{}}; field.data={name:'Second'}; assert.equal(field.details.open,true); assert.equal(field.form,form); assert.equal(form.data.name,'Second');
 let value;field.addEventListener('value-changed',e=>value=e.detail.value); form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{name:'Édité'}}})); assert.equal(value.name,'Édité'); assert.equal(field.details.open,true);
});
test("bordures neutres des accordéons et accent uniquement sur les titres contextuels", () => {
 const editor=setup(); const css=editor.shadowRoot.querySelector('style').textContent; const field=new FlexBadgeExpandable(); const badgeCss=field.shadowRoot.querySelector('style').textContent;
 assert.match(css,/section-title,\.context-title\{border-inline-start:4px/); assert.match(badgeCss,/border:2px solid var\(--fac-editor-border/); assert.equal(badgeCss.includes('border-inline-start'),false);
 assert.equal(css.match(/border-inline-start/g).length,1);
});
test("changement de type : nom/texte et actions conservés, champs entité retirés du raccourci", () => {
 const source={type:'entity',entity:'sensor.temperature',name:'Maison',icon:'mdi:home',show_state:true,time_format:'relative',tap_action:{action:'navigate',navigation_path:'/home'},visibility:[{condition:'screen',media_query:'(min-width: 400px)'}]};
 const shortcut=badgeConfigForType(source,'shortcut'); assert.equal(shortcut.text,'Maison'); assert.equal(shortcut.entity,undefined); assert.equal(shortcut.show_state,undefined); assert.equal(shortcut.time_format,undefined); assert.deepEqual(shortcut.tap_action,source.tap_action); assert.deepEqual(shortcut.visibility,source.visibility); assert.equal(source.entity,'sensor.temperature');
 const entity=badgeConfigForType(shortcut,'entity');assert.equal(entity.name,'Maison');assert.equal(entity.text,undefined);
});

test("type raccourci indisponible en édition : configuration et formulaire restent sur l’entité", async () => {
 customElements.define('hui-shortcut-badge',undefined);
 try { const editor=setup(); editor._helpers={createBadgeElement(){throw Error('unsupported');}}; editor._select({kind:'badges',s:0,i:0}); await editor.updateComplete; const node=editor._active.node; const form=node.querySelector('ha-form');
 form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{...form.data,type:'shortcut'}}})); await Promise.resolve(); await Promise.resolve();
 assert.equal(editor._config.sections[0].badges[0].type,'entity'); assert.equal(editor._config.sections[0].badges[0].name,'Nom initial'); assert.equal(node.config.type,'entity'); assert.equal(node.config.entity,'sensor.temperature');
 } finally {customElements.define('hui-shortcut-badge',NativeContent);}
});

test("réutilisation HA des champs : les sélecteurs de contenu deviennent bien des actions", () => {
 const oldSelectors=[{text:{}},{icon:{}},{ui_color:{default_color:'state'}}];
 for(const [index,name] of ['tap_action','hold_action','double_tap_action'].entries()) {
  const field=new FlexCompactField();field.schema={name:'old-'+index,compact_selector:oldSelectors[index]};field.data='ancienne valeur';const control=field._control;
  const selector={ui_action:{default_action:'none'}};field.schema={name,compact_selector:selector};field.label=name;field.context={entity_id:undefined};field.data={action:'navigate',navigation_path:'/home'};
  assert.equal(field._control,control);assert.deepEqual(control.selector,selector);assert.equal(control.name,name);assert.deepEqual(control.schema.selector,selector);assert.deepEqual(control.value,{action:'navigate',navigation_path:'/home'});
  let saved;field.addEventListener('value-changed',event=>saved=event.detail.value);control.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{action:'url',url_path:'https://example.com'}}}));assert.equal(saved.action,'url');
  field.schema={name:'color',compact_selector:oldSelectors[2]};assert.deepEqual(control.selector,oldSelectors[2]);
 }
});
test("champ réutilisé : changement booléen/sélecteur sans contrôle résiduel", () => {
 const field=new FlexCompactField();field.schema={name:'enabled',compact_selector:{boolean:{}}};const toggle=field._control;field.schema={name:'tap_action',compact_selector:{ui_action:{}}};assert.notEqual(field._control,toggle);assert.equal(field.shadowRoot.querySelectorAll('ha-selector').length,1);assert.equal(field.shadowRoot.querySelectorAll('label').length,0);
 field.schema={name:'enabled',compact_selector:{boolean:{}}};assert.equal(field.shadowRoot.querySelectorAll('ha-selector').length,0);field.data=true;assert.equal(field._control.checked,true);
});
test("type de badge : boutons radio contrôlés, traduits et sans option vide", () => {
 const field=new FlexBadgeTypeField();field.schema={name:'type',type:'flex-badge-type'};field.label='Type de badge';field.data='entity';assert.equal(field._controls.length,2);assert.ok(field._controls.every(row=>row.input.type==='radio'));assert.equal(field._controls[0].input.checked,true);
 let saved;field.addEventListener('value-changed',event=>saved=event.detail.value);field._controls[1].input.checked=true;field._controls[1].input.dispatchEvent(new Event('change'));assert.equal(saved,'shortcut');field.data=saved;assert.equal(field._controls[0].input.checked,false);assert.equal(field._controls[1].input.checked,true);
 field.hass={language:'en'};assert.equal(field._controls[0].caption.textContent,'Entity');assert.equal(field._controls[1].caption.textContent,'Shortcut');field.disabled=true;assert.ok(field._controls.every(row=>row.input.disabled));assert.equal(entityBadgeSchema({type:'shortcut'})[0].type,'flex-badge-type');
});

test("toujours ouverte : aide exacte juste après l’option, avant le titre", () => {
 const editor=setup();editor._currentSection().always_open=true;editor._render();const body=editor.shadowRoot.querySelector('.group[data-kind="header"] .group-body');assert.equal(body.children[0].localName,'ha-form');assert.deepEqual(body.children[0].schema.map(f=>f.name),['always_open']);assert.equal(body.children[0].computeLabel({name:'always_open'}),'Toujours ouverte');assert.equal(body.children[1].textContent,"Cette section reste toujours ouverte. Elle n'a ni en-tête ni badge.");assert.equal(body.children[2].schema[0].name,'title');
});
test("Manuel du catalogue HA : ouverture du YAML sans enregistrer le type vide", async () => {
 customElements.define('hui-card-picker',class extends TestElement{});const editor=setup();editor._select({kind:'cards',s:0,i:null});await editor.updateComplete;const picker=editor.shadowRoot.querySelector('hui-card-picker');picker.dispatchEvent(new CustomEvent('config-changed',{detail:{config:{type:''}}}));
 const pane=editor.shadowRoot.querySelector('.pane');const yaml=pane.querySelector('ha-yaml-editor');assert.ok(yaml);assert.equal(editor._config.sections[0].cards.length,1);const add=pane.querySelectorAll('button').find(n=>n.textContent==='Ajouter la carte');add.dispatchEvent(new Event('click'));assert.equal(editor._config.sections[0].cards.length,1);
 yaml.dispatchEvent(new CustomEvent('value-changed',{detail:{isValid:true,value:{type:'markdown',content:'Carte manuelle'}}}));add.dispatchEvent(new Event('click'));await editor.updateComplete;assert.equal(editor._config.sections[0].cards.length,2);assert.equal(editor._config.sections[0].cards[1].content,'Carte manuelle');
});
test("carte manuelle : repli JSON explicite, configuration invalide refusée", () => {
 const ctor=customElements.get('ha-yaml-editor');customElements.define('ha-yaml-editor',undefined);try{const editor=setup();editor._selection={kind:'cards',i:null};const pane=new TestElement();editor._renderManualCardDraft(pane,editor._epoch);const input=pane.querySelector('textarea'),add=pane.querySelector('button');input.value='{';input.dispatchEvent(new Event('input'));add.dispatchEvent(new Event('click'));assert.equal(editor._config.sections[0].cards.length,1);input.value=JSON.stringify({type:'button',entity:'light.salon'});input.dispatchEvent(new Event('input'));add.dispatchEvent(new Event('click'));assert.equal(editor._config.sections[0].cards.length,2);}finally{customElements.define('ha-yaml-editor',ctor);}
});
test("aperçu natif du badge avant ajout : données/hass actualisés sans configuration persistée", async () => {
 const editor=setup();editor._select({kind:'badges',s:0,i:null});await editor.updateComplete;const pane=editor.shadowRoot.querySelector('.pane');const controller=pane.querySelector('.entity-badge-editor');const form=controller.querySelector('ha-form');const preview=pane.querySelector('.badge-preview-content');assert.ok(preview);assert.equal(editor._config.sections[0].badges.length,1);
 form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{...form.data,entity:'sensor.temperature',name:'Brouillon'}}}));await controller.updateComplete;const native=preview.children[0];assert.equal(native.config.name,'Brouillon');assert.equal(native.preview,true);assert.equal(editor._config.sections[0].badges.length,1);
 form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{...form.data,name:'Autre nom',color:'red'}}}));await controller.updateComplete;assert.equal(preview.children[0],native);assert.equal(native.config.name,'Autre nom');assert.equal(native.config.color,'red');const hass={states:{},tick:123};editor.hass=hass;assert.equal(native.hass,hass);assert.equal(editor._config.sections[0].badges.length,1);
 editor._backToSection();assert.equal(editor._config.sections[0].badges.length,1);
});
test("bascule code/visuel dans une barre finale pour cartes, badges et ajout de badge", async () => {
 const editor=setup();for(const kind of ['cards','badges']){editor._select({kind,s:0,i:0});await editor.updateComplete;const pane=editor.shadowRoot.querySelector('.pane');assert.equal(pane.lastChild.classList.contains('editor-actions'),true);assert.ok(pane.lastChild.querySelector('.mode-button'));}
 editor._select({kind:'badges',s:0,i:null});await editor.updateComplete;const pane=editor.shadowRoot.querySelector('.pane');const toolbar=pane.querySelector('.editor-actions');assert.ok(toolbar.querySelector('.mode-button'));assert.ok(toolbar.querySelectorAll('button').some(n=>n.textContent==='Ajouter le badge'));assert.ok(pane.children.indexOf(toolbar)>pane.children.indexOf(pane.querySelector('.badge-draft-preview')));
});

test("apparence par badge : options indépendantes, styles du thème préservés et rétablis", () => {
 const a=new TestElement(),b=new TestElement();a.style.setProperty('--ha-card-background','pink');applyBadgeAppearance(a,{});assert.equal(a.style.getPropertyValue('--ha-card-background'),'pink');applyBadgeAppearance(a,{hide_border:true});assert.equal(a.style.getPropertyValue('--ha-card-border-width'),'0px');assert.equal(a.style.getPropertyValue('--ha-card-background'),'pink');assert.equal(b.style.getPropertyValue('--ha-card-border-width'),undefined);
 applyBadgeAppearance(a,{hide_border:true,transparent_background:true});assert.equal(a.style.getPropertyValue('--ha-card-background'),'transparent');assert.equal(a.style.getPropertyValue('--ha-card-backdrop-filter'),'none');applyBadgeAppearance(a,{});assert.equal(a.style.getPropertyValue('--ha-card-background'),'pink');assert.equal(a.style.getPropertyValue('--ha-card-border-width'),undefined);
 const raw={type:'shortcut',text:'Accueil',hide_border:true,transparent_background:true,tap_action:{action:'navigate',navigation_path:'/home'}};const native=badgeNativeConfig(raw);assert.equal(native.hide_border,undefined);assert.equal(native.transparent_background,undefined);assert.equal(native.tap_action.action,'navigate');assert.equal(raw.hide_border,true);
});
test("rendu natif : apparence locale dans les sections et l’en-tête global", async () => {
 const card=new FlexAccordionCard();const config=source();config.sections[0].badges[0].hide_border=true;config.header={title:'Maison',badges:[{type:'shortcut',text:'Accueil',transparent_background:true}]};card.setConfig(config);await card.updateComplete;
 const local=card._sectionNodes[0].querySelector('.badges').children[0],global=card.shadowRoot.querySelector('.card-header .badges').children[0];assert.equal(local.style.getPropertyValue('--ha-card-border-width'),'0px');assert.equal(local.style.getPropertyValue('--ha-card-background'),undefined);assert.equal(global.style.getPropertyValue('--ha-card-background'),'transparent');assert.equal(global.style.getPropertyValue('--ha-card-border-width'),undefined);assert.equal(local.config.hide_border,undefined);
});
test("apparence : champs Contenu pour les deux types et aperçu du brouillon actualisé", async () => {
 for(const type of ['entity','shortcut']) {const fields=entityBadgeSchema({type}).find(f=>f.name==='content').schema;assert.ok(fields.some(f=>f.name==='hide_border'));assert.ok(fields.some(f=>f.name==='transparent_background'));}
 const editor=setup();editor._select({kind:'badges',s:0,i:null});await editor.updateComplete;const pane=editor.shadowRoot.querySelector('.pane'),controller=pane.querySelector('.entity-badge-editor'),form=controller.querySelector('ha-form');form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{...form.data,entity:'sensor.temperature',hide_border:true,transparent_background:true}}}));await controller.updateComplete;const native=pane.querySelector('.badge-preview-content').children[0];assert.equal(native.style.getPropertyValue('--ha-card-background'),'transparent');assert.equal(native.style.getPropertyValue('--ha-card-border-width'),'0px');assert.equal(native.config.transparent_background,undefined);
 form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{...form.data,hide_border:false,transparent_background:false}}}));await controller.updateComplete;assert.equal(native.style.getPropertyValue('--ha-card-background'),undefined);assert.equal(native.style.getPropertyValue('--ha-card-border-width'),undefined);
});
