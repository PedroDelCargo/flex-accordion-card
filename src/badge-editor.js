import { t, language, localizeSchema } from "./i18n.js";
import { clone, sameConfig, badgeShowsTime } from "./core.js";
import { el } from "./card.js";

// A regular ha-form field, using its documented flattened-data/event contract.
// Compact native switches replace four 56px selector rows + 24px margins.
export class FlexBadgeDisplayOptions extends HTMLElement {
  constructor() {
    super(); this.attachShadow({ mode: "open" }); this._data = {}; this._controls = [];
    const style = el("style"); style.textContent = ":host{display:block;margin-bottom:8px!important}.option{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:40px;margin:0;padding:0;font:inherit;color:inherit}.option span{line-height:1.25}ha-switch{flex:none;--ha-switch-min-touch-size:40px}input{flex:none}";
    this.shadowRoot.append(style);
    for (const [name, text] of [["show_name", "Afficher le nom"], ["show_state", "Afficher l’état"], ["show_icon", "Afficher l’icône"], ["show_entity_picture", "Afficher l’image de l’entité"]]) {
      const row = el("label", "option"); const control = el(customElements.get("ha-switch") ? "ha-switch" : "input");
      if (control.localName === "input") control.type = "checkbox";
      control.dataset.label = text; control.dataset.field = name; control.setAttribute("aria-label", text); row.append(el("span", "", text), control); this.shadowRoot.append(row); this._controls.push(control);
      control.addEventListener("change", (event) => { event.stopPropagation(); this._data = { ...this._data, [name]: Boolean(control.checked) }; this.dispatchEvent(new CustomEvent("value-changed", { detail: { value: this._data }, bubbles: true, composed: true })); });
    }
  }
  set hass(value) { for (const control of this._controls) { const text = t(value, control.dataset.label); control.setAttribute("aria-label", text); control.parentNode.querySelector("span").textContent = text; } }
  set data(value) { this._data = value || {}; for (const control of this._controls) control.checked = this._data[control.dataset.field] ?? ["show_state", "show_icon"].includes(control.dataset.field); }
  get data() { return this._data; }
  set disabled(value) { this._disabled = Boolean(value); for (const control of this._controls) control.disabled = this._disabled; }
  get disabled() { return this._disabled; }
  reportValidity() { return true; }
}
if (!customElements.get("ha-form-flex-badge-display")) customElements.define("ha-form-flex-badge-display", FlexBadgeDisplayOptions);


// Local ha-form field: native selectors, uniform spacing, no private DOM access.
export class FlexCompactField extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }
  set schema(value) {
    this._schema = value;
    if (this._control) return;
    const style = el("style"); style.textContent = ":host{display:block;margin-bottom:8px!important}.boolean{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:40px}ha-switch{--ha-switch-min-touch-size:40px}";
    this.shadowRoot.append(style);
    const boolean = Boolean(value.compact_selector.boolean);
    this._control = el(boolean ? (customElements.get("ha-switch") ? "ha-switch" : "input") : "ha-selector");
    if (this._control.localName === "input") this._control.type = "checkbox";
    if (boolean) { const row = el("label", "boolean"); this._labelNode = el("span"); row.append(this._labelNode, this._control); this.shadowRoot.append(row); }
    else { this._control.schema = { ...value, selector: value.compact_selector }; this._control.required = Boolean(value.required); this._control.selector = value.compact_selector; this._control.name = value.name; this.shadowRoot.append(this._control); }
    this._control.addEventListener(boolean ? "change" : "value-changed", (event) => { event.stopPropagation(); this._data = boolean ? Boolean(this._control.checked) : event.detail.value; this.dispatchEvent(new CustomEvent("value-changed", { detail: { value: this._data }, bubbles: true, composed: true })); });
    this._sync();
  }
  get schema() { return this._schema; }
  _sync() { if (!this._control) return; this._control.hass = this._hass; this._control.disabled = this._disabled; this._control.label = this._label; this._control.context = this._context; this._control.value = this._data; this._control.checked = Boolean(this._data); if (this._labelNode) this._labelNode.textContent = this._label || this._schema.name; }
  set data(v) { this._data = v; this._sync(); } get data() { return this._data; }
  set hass(v) { this._hass = v; this._sync(); }
  set label(v) { this._label = v; this._sync(); }
  set context(v) { this._context = v; this._sync(); }
  set disabled(v) { this._disabled = v; this._sync(); }
  reportValidity() { return this._control?.reportValidity?.() ?? true; }
}
if (!customElements.get("ha-form-flex-compact")) customElements.define("ha-form-flex-compact", FlexCompactField);
export function compactSchema(schema) { return schema.map((field) => { if (field.selector) { const { selector, ...rest } = field; return { ...rest, type: "flex-compact", compact_selector: selector }; } return field.schema ? { ...field, schema: compactSchema(field.schema) } : field; }); }

export function entityBadgeSchema(config, hass) {
  const content = [
    { name: "name", selector: { entity_name: {} }, context: { entity: "entity" } },
    { name: "icon", selector: { icon: {} }, context: { icon_entity: "entity" } },
    { name: "color", selector: { ui_color: { default_color: "state", include_state: true } } },
    { name: "display", type: "flex-badge-display", flatten: true },
    { name: "state_content", selector: { ui_state_content: { allow_name: true } }, context: { filter_entity: "entity" } },
  ];
  if (badgeShowsTime(config, hass)) content.push({ name: "time_format", selector: { ui_time_format: {} } });
  return [
    { name: "entity", selector: { entity: {} } },
    { name: "content", type: "expandable", flatten: true, schema: content },
    { name: "interactions", type: "expandable", flatten: true, schema: ["tap_action", "hold_action", "double_tap_action"].map((name) => ({ name, selector: { ui_action: { default_action: name === "tap_action" ? "more-info" : "none" } }, context: { entity_id: "entity", area_id: "area" } })) },
  ];
}

// Own controller, native HA form/selectors and native YAML component. No global
// monkey-patches and no traversal of another component's private shadow DOM.
export function createEntityBadgeEditor() {
  const node = el("div", "entity-badge-editor");
  const form = el("ha-form"); const code = el("div", "badge-code"); code.hidden = true; node.append(form, code);
  let hass; let gui = true; let yaml; let lastCode; let raw = {};
  const fieldLabels = { entity: "Entité", name: "Nom", icon: "Icône", color: "Couleur", content: "Contenu", interactions: "Interactions", show_name: "Afficher le nom", show_state: "Afficher l’état", show_icon: "Afficher l’icône", show_entity_picture: "Afficher l’image de l’entité", state_content: "Contenu de l’état", time_format: "Format de l’heure", tap_action: "Au toucher", hold_action: "Appui long", double_tap_action: "Double toucher" };
  form.computeLabel = ({ name }) => t(hass, fieldLabels[name] || name);
  const refreshSchema = () => { const schema = compactSchema(localizeSchema(entityBadgeSchema(raw, hass), hass)); if (!sameConfig(schema, form.schema)) form.schema = schema; };
  const emit = (value) => node.dispatchEvent(new CustomEvent("config-changed", { detail: { config: value }, bubbles: true, composed: true }));
  Object.defineProperty(node, "hass", { get: () => hass, set: (value) => { hass = value; form.hass = value; refreshSchema(); } });
  Object.defineProperty(node, "GUImode", { get: () => gui, set: (value) => {
    gui = Boolean(value); form.hidden = !gui; code.hidden = gui;
    if (!gui) {
      if (!yaml) {
        if (customElements.get("ha-yaml-editor")) {
          yaml = el("ha-yaml-editor"); yaml.addEventListener("value-changed", (event) => { event.stopPropagation(); if (event.detail.isValid) { lastCode = clone(event.detail.value); emit(event.detail.value); } });
        } else {
          const notice = el("p", "hint", t(hass, "Éditeur YAML HA indisponible : saisie JSON.")); code.append(notice);
          yaml = el("textarea"); yaml.setAttribute("aria-label", t(hass, "Configuration JSON du badge"));
          const error = el("p", "error"); code.append(error);
          yaml.addEventListener("change", () => { try { const value = JSON.parse(yaml.value); lastCode = clone(value); error.textContent = ""; emit(value); } catch (err) { error.textContent = err.message; } });
        } code.append(yaml);
      }
      if (yaml.localName === "textarea") yaml.value = JSON.stringify(raw, null, 2); else yaml.defaultValue = clone(raw);
    }
    node.dispatchEvent(new CustomEvent("GUImode-changed", { detail: { guiMode: gui, guiModeAvailable: true } }));
  } });
  node.setConfig = (value) => {
    raw = clone(value); node.config = raw;
    form.data = { show_name: false, show_state: true, show_icon: true, ...raw }; refreshSchema();
    if (!gui && yaml && !sameConfig(lastCode, raw)) { if (yaml.localName === "textarea") yaml.value = JSON.stringify(raw, null, 2); else yaml.defaultValue = clone(raw); }
  };
  form.addEventListener("value-changed", (event) => { event.stopPropagation(); emit(clone(event.detail.value)); });
  return node;
}
