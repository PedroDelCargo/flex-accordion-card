import { t, language, localizeSchema } from "./i18n.js";
import { clone, normalizeConfig, moveItem, moveNested, copyNested, sameConfig, itemName, itemTypeName, defaultInteraction, withDefaultInteraction } from "./core.js";
import { el, button, svgIcon, bounded, cardHelpers } from "./card.js";
import { createEntityBadgeEditor, compactSchema } from "./badge-editor.js";

const labels = { always_open: "Toujours ouverte (sans en-tête)", text_size: "Taille du texte (px)", enabled: "Afficher l’en-tête de la carte", layout: "Présentation", background: "Fond global autour des sections", exclusive: "Une seule section ouverte", animation: "Animations", animation_duration: "Durée (ms)", title: "Titre", icon: "Icône", columns: "Colonnes", default_open: "Ouverte au chargement", entity: "Entité" };
const selectSchema = (name, options) => ({ name, selector: { select: { mode: "dropdown", options: options.map(([value, label]) => ({ value, label })) } } });
const globalSchema = [selectSchema("layout", [["unified", "Carte unique"], ["separate", "Cartes séparées"]]), { name: "background", selector: { boolean: {} } }, { name: "exclusive", selector: { boolean: {} } }, { name: "animation", selector: { boolean: {} } }, { name: "animation_duration", selector: { number: { min: 0, max: 2000, mode: "box", step: 10 } } }];
const headerSchema = [{ name: "title", selector: { text: {} } }, { name: "icon", selector: { icon: {} } }, { name: "default_open", selector: { boolean: {} } }];
const contentSchema = [selectSchema("layout", [["vertical", "Verticale"], ["grid", "Grille"]]), { name: "columns", selector: { number: { min: 1, max: 12, mode: "box", step: 1 } } }];

export class FlexAccordionCardEditor extends HTMLElement {
  constructor() {
    super(); this.attachShadow({ mode: "open" });
    this._ready = false; this._drag = null; this._selection = null; this._sectionId = null;
    this._epoch = 0; this._nativeChildren = []; this._expanded = new Map(); this._visibilityBindings = []; this._transfer = null;
  }
  setConfig(input) {
    const config = normalizeConfig(input);
    if (sameConfig(config, this._config)) return;
    const oldContainer = this._editingContainer();
    this._config = config; this._validConfig = clone(config);
    const section = this._currentSection();
    if (this._sectionId && !section) { this._sectionId = null; this._selection = null; }
    const container = this._editingContainer();
    if (this._selection && (!container || this._selection.i != null && !container[this._selection.kind][this._selection.i])) this._selection = null;
    // Keep the active native editor alive for HA round trips and state refreshes.
    if (this._active && container && oldContainer && this._selection && this._selection.i !== null) {
      const { kind, i } = this._selection;
      if (container[kind].length === oldContainer[kind].length && container[kind][i]?.type === this._active.type && sameConfig(oldContainer[kind].slice(0, i), container[kind].slice(0, i))) {
        this._syncActive(); this._syncVisibility(); this._updateLabels(); return;
      }
    }
    this._render();
  }
  set hass(value) {
    const changedLanguage = language(this._hass) !== language(value); this._hass = value;
    if (changedLanguage && this._config) this._render();
    // The configuration is fed back separately; a hass refresh must never rebuild a form.
    for (const child of this._nativeChildren) child.hass = value;
    this._updateLabels();
    if (this.isConnected && !this._initializing && !this._ready && !this._attempted) this._initialize();
  }
  get hass() { return this._hass; }
  set lovelace(value) { this._lovelace = value; for (const child of this._nativeChildren) child.lovelace = value; }
  get lovelace() { return this._lovelace; }
  connectedCallback() { if (!this.shadowRoot.querySelector(".editor")) this._render(); this._initialize(); }
  async _initialize() {
    if (this._initializing || this._ready) return;
    this._initializing = true; this._attempted = true;
    try {
      this._helpers = await cardHelpers();
      const stack = this._helpers.createCardElement({ type: "vertical-stack", cards: [] });
      await bounded(customElements.whenDefined("hui-vertical-stack-card"));
      const ctor = customElements.get("hui-vertical-stack-card") || stack.constructor;
      if (ctor.getConfigElement) await bounded(ctor.getConfigElement());
      this._ready = true; this._initError = "";
    } catch (error) { this._initError = error.message; }
    finally {
      this._initializing = false;
      // A late stack-editor import must not interrupt typing in an already open editor.
      if (!this._selection && !this.shadowRoot.activeElement) this._render();
    }
  }
  _currentSection() { return this._config?.sections.find((section) => section.id === this._sectionId); }
  _editingContainer() { return this._selection?.scope === "header" ? this._config?.header : this._currentSection(); }
  _sectionIndex() { return this._config.sections.findIndex((section) => section.id === this._sectionId); }
  _emit(render = true) {
    try {
      this._config = normalizeConfig(this._config); this._validConfig = clone(this._config); this._error = "";
      this._syncActive();
      this._syncVisibility();
      this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: clone(this._config) }, bubbles: true, composed: true }));
      if (render) this._render(); else { this._updateLabels(); this._showError(); }
      return true;
    } catch (error) { this._config = clone(this._validConfig); this._error = error.message; this._showError(); return false; }
  }
  _showError() { const node = this.shadowRoot.querySelector(".config-error"); if (node) node.textContent = this._error || ""; }
  _native(node) {
    node.hass = this._hass; node.lovelace = this._lovelace || { views: [] }; this._nativeChildren.push(node); return node;
  }
  _form(data, schema, change) {
    if (customElements.get("ha-form")) {
      const form = this._native(el("ha-form")); form.schema = compactSchema(localizeSchema(schema, this._hass));
      form.data = Object.fromEntries(schema.map(({ name }) => [name, data[name]]));
      form.computeLabel = ({ name }) => t(this._hass, labels[name] || name);
      form.addEventListener("value-changed", (event) => {
        event.stopPropagation();
        // ha-form is controlled too: return accepted data without replacing its DOM.
        const value = { ...form.data, ...event.detail.value };
        if (change(value) !== false) form.data = value;
      }); return form;
    }
    const form = el("div", "fallback-form");
    for (const { name, selector } of schema) {
      const label = el("label", "", t(this._hass, labels[name] || name)); let input;
      if (selector.select) {
        input = el("select"); for (const { value, label } of selector.select.options) { const option = el("option", "", t(this._hass, label)); option.value = value; input.append(option); }
      } else {
        input = el("input"); input.type = selector.boolean ? "checkbox" : selector.number ? "number" : "text";
        if (selector.number) { input.min = selector.number.min; input.max = selector.number.max; input.step = selector.number.step; }
      }
      input.value = data[name] ?? ""; input.checked = Boolean(data[name]); input.dataset.field = name;
      input.addEventListener("change", () => {
        if (!input.checkValidity()) return input.reportValidity();
        change({ [name]: selector.boolean ? input.checked : selector.number ? (input.value === "" ? undefined : Number(input.value)) : input.value });
      }); label.append(input); form.append(label);
    } return form;
  }
  _group(title, key, defaultOpen = false) {
    const details = el("details", "group"); details.dataset.group = key;
    details.open = this._expanded.has(key) ? this._expanded.get(key) : defaultOpen;
    const summary = el("summary"); summary.append(el("span", "label", title), svgIcon("chevron"));
    const body = el("div", "group-body"); details.append(summary, body);
    details.addEventListener("toggle", () => { if (details.isConnected) this._expanded.set(key, details.open); });
    return { details, body };
  }
  _pencil(action, label) { const node = button("", action, label); node.className = "icon-button"; node.title = label; node.append(svgIcon("pencil")); return node; }
  _iconButton(icon, action, label) { const node = button("", action, label); node.className = "icon-button"; node.title = label; node.append(svgIcon(icon)); return node; }
  _backButton(label, action, accessible) { const node = button("", action, accessible); node.className = "back"; node.append(svgIcon("back"), el("span", "", label)); return node; }
  _visibilityEditor(getConfig, save) {
    const epoch = this._epoch;
    let binding;
    const accept = (conditions) => {
      if (epoch !== this._epoch || !Array.isArray(conditions) || !getConfig()) return;
      // HA keys condition rows by object identity (including the edited object).
      // Keep its emitted objects in the UI; only persistence receives deep clones.
      if (binding) binding.conditions = conditions;
      const next = clone(getConfig()); if (conditions.length) next.visibility = clone(conditions); else delete next.visibility;
      save(next); this._syncVisibility();
    };
    const tag = customElements.get("hui-card-visibility-editor") ? "hui-card-visibility-editor" : customElements.get("ha-card-conditions-editor") ? "ha-card-conditions-editor" : null;
    if (tag) {
      const node = this._native(el(tag)); binding = { node, tag, getConfig, epoch, conditions: clone(getConfig()?.visibility || []) }; this._visibilityBindings.push(binding);
      node.addEventListener("value-changed", (event) => { event.stopPropagation(); accept(tag === "hui-card-visibility-editor" ? event.detail.value.visibility || [] : event.detail.value); });
      this._syncVisibility(); return node;
    }
    const fallback = el("div"); fallback.append(el("p", "hint", t(this._hass, "Éditeur de conditions HA indisponible dans ce contexte. Les conditions peuvent être saisies en JSON ou dans le YAML de la carte.")));
    const input = el("textarea"); input.setAttribute("aria-label", t(this._hass, "Conditions de visibilité (JSON)")); input.value = JSON.stringify(getConfig()?.visibility || [], null, 2);
    const error = el("p", "error"); fallback.append(input, button(t(this._hass, "Appliquer les conditions"), () => {
      try { const conditions = JSON.parse(input.value); if (!Array.isArray(conditions)) throw new Error(t(this._hass, "Liste de conditions attendue")); error.textContent = ""; accept(conditions); } catch (err) { error.textContent = err.message; }
    }), error); return fallback;
  }
  _syncVisibility() {
    for (const binding of this._visibilityBindings) {
      const config = binding.getConfig(); if (!config || binding.epoch !== this._epoch) continue;
      if (!sameConfig(binding.conditions, config.visibility || [])) binding.conditions = clone(config.visibility || []);
      if (binding.tag === "hui-card-visibility-editor") {
        if (!sameConfig(binding.node.config, config) || binding.conditions.length && binding.node.config?.visibility !== binding.conditions) {
          const view = { ...config }; if (binding.conditions.length) view.visibility = binding.conditions; else delete view.visibility;
          binding.node.config = view;
        } binding.node.entityId = config.entity;
      } else if (binding.node.conditions !== binding.conditions) binding.node.conditions = binding.conditions;
    }
  }
  _badgeVisibility(pane) {
    const group = this._group(t(this._hass, "Visibilité du badge"), `${this._selection.scope === "header" ? "header" : this._sectionId}:badge:${this._selection.i}:visibility`);
    group.body.append(this._visibilityEditor(() => this._editingContainer()?.badges[this._selection?.i], (config) => this._saveItem(config)));
    pane.append(group.details);
  }
  _modeButton(native) {
    const mode = button("", () => { if (typeof native.toggleMode === "function") native.toggleMode(); else native.GUImode = native.GUImode === false; update(native.GUImode !== false); }); mode.className = "mode-button";
    const update = (gui) => { const label = gui ? t(this._hass, "Éditeur de code") : t(this._hass, "Éditeur visuel"); mode.replaceChildren(svgIcon(gui ? "code" : "visual"), el("span", "", label)); mode.setAttribute("aria-label", label); };
    update(native.GUImode !== false);
    native.addEventListener("GUImode-changed", (event) => { event.stopPropagation(); update(event.detail.guiMode); mode.disabled = !event.detail.guiMode && event.detail.guiModeAvailable === false; }); return mode;
  }
  _render() {
    if (!this._config) return;
    for (const group of this.shadowRoot.querySelectorAll(".group")) this._expanded.set(group.dataset.group, group.open);
    ++this._epoch; this._active = null; this._nativeChildren = []; this._visibilityBindings = [];
    const style = el("style"); style.textContent = `
      :host{display:block;color:var(--primary-text-color,#20252b);font:14px var(--paper-font-body1_-_font-family,system-ui);--fac-editor-border:color-mix(in srgb,var(--primary-text-color,#20252b) 40%,transparent)}
      *{box-sizing:border-box}button,select,input,textarea{font:inherit;color:inherit}button{border:1px solid var(--fac-editor-border,#8493a2);border-radius:8px;background:var(--card-background-color,#fff);cursor:pointer;padding:8px 10px;min-height:36px}
      button:hover{background:var(--secondary-background-color,#eef3f7)}button:disabled{opacity:.4;cursor:default}button:focus-visible,summary:focus-visible,select:focus-visible,input:focus-visible,textarea:focus-visible{outline:2px solid var(--primary-color,#03a9f4);outline-offset:2px}
      .toolbar,.row,.section-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.toolbar{margin:10px 0}.label{flex:1;min-width:70px;overflow-wrap:anywhere}.title-button{border:0;background:transparent;text-align:start;font-weight:600;flex:1;min-width:70px;padding:4px}
      .section-editor,.pane{border:2px solid var(--fac-editor-border,#8493a2);border-radius:12px;margin:12px 0;padding:12px;background:var(--card-background-color,#fff)}
      .section-head{font-weight:600}.counts,.type-label,.hint,.breadcrumb{font-size:12px;color:var(--secondary-text-color,#606973);line-height:1.5}.counts{margin:6px 0 0 44px}.type-label{display:block}.breadcrumb{margin-bottom:10px;overflow-wrap:anywhere}.breadcrumb button{font:inherit;border:0;padding:4px;background:transparent;color:var(--primary-color,#028ca8)}
      h3{margin:10px 0}h4{margin:8px 0}.group{border:2px solid var(--fac-editor-border,#8493a2);border-inline-start:4px solid var(--primary-color,#028ca8);border-radius:10px;margin:12px 0;overflow:hidden}.group summary{display:flex;gap:10px;align-items:center;cursor:pointer;padding:12px;font-weight:600;background:var(--secondary-background-color,#f1f5f8);list-style:none}.group summary::-webkit-details-marker{display:none}.group summary::marker{content:""}.group summary svg{width:20px;height:20px;flex:none}.group[open]>summary svg{transform:rotate(180deg)}.group-body{padding:12px;border-top:1px solid var(--fac-editor-border,#8493a2)}
      .row{padding:10px 0;border-bottom:1px solid var(--fac-editor-border,#8493a2)}.icon-button{display:inline-flex;align-items:center;justify-content:center;width:38px;padding:6px;flex:none}.drag{cursor:grab}.drop-over{outline:3px dashed var(--primary-color,#03a9f4);outline-offset:-3px}.dropzone{min-height:22px;border-radius:6px}.destinations{margin:10px 0;font-size:12px}.transfer-target{border:1px dashed var(--fac-editor-border,#8493a2);padding:10px;margin-top:6px}.hint{margin:10px 0}.error{color:var(--error-color,#b71c1c);white-space:pre-wrap}.error:empty{display:none}
      .fallback-form{display:grid;gap:8px}.fallback-form label{min-height:40px}.fallback-form label{display:flex;gap:10px;align-items:center;justify-content:space-between}.fallback-form input:not([type=checkbox]),.fallback-form select{width:55%}input,select,textarea{border:1px solid var(--fac-editor-border,#8493a2);border-radius:6px;background:var(--card-background-color,#fff);padding:8px;max-width:100%}textarea{width:100%;min-height:180px;font-family:monospace}select{max-width:160px}.pane:empty{display:none}.item-page>.pane{margin-top:8px}.back{margin:4px 0 12px}.item-page .context-title{font-size:18px;overflow-wrap:anywhere}.manual{margin-top:16px}.manual summary{cursor:pointer;font-weight:500;padding:8px 0}
      .nav-header{position:sticky;top:var(--flex-accordion-editor-sticky-top,0px);z-index:20;background:var(--card-background-color,var(--ha-card-background,#fff));padding:8px 0;border-bottom:2px solid var(--fac-editor-border,#8493a2);margin-bottom:12px}.nav-header .back{margin:0}.back,.mode-button{display:inline-flex;gap:8px;align-items:center}.back svg,.mode-button svg{flex:none}.transfer-panel{padding:12px;border:2px solid var(--primary-color,#028ca8);border-radius:8px;margin:8px 0}.transfer-options{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.transfer-options button{display:inline-flex;gap:8px;align-items:center}.badge-code[hidden],ha-form[hidden]{display:none!important}
    `;
    const root = el("div", `editor ${this._selection ? "item-page" : this._sectionId ? "section-page" : "overview-page"}`);
    if (this._selection) this._renderItemPage(root);
    else if (this._currentSection()) this._renderSectionPage(root);
    else this._renderOverview(root);
    root.append(el("p", "error config-error", this._error || "")); this.shadowRoot.replaceChildren(style, root);
    if (this._selection) this.updateComplete = this._renderPane(); else this.updateComplete = Promise.resolve();
  }
  _renderOverview(root) {
    const nav = el("div", "nav-header"); nav.append(el("h3", "", t(this._hass, "Réglages de carte"))); root.append(nav);
    const global = this._group(t(this._hass, "Réglages généraux"), "global", true);
    global.body.append(this._form(this._config, globalSchema, (value) => { Object.assign(this._config, value); return this._emit(false); })); root.append(global.details);
    this._renderGlobalHeaderSettings(root);
    root.append(el("h3", "", t(this._hass, "Sections")), el("p", "hint", t(this._hass, "Ouvrez une section pour gérer son en-tête, ses badges et ses cartes. Les poignées permettent de réordonner les sections.")));
    if (this._initError) { const hint = el("p", "hint", t(this._hass, "Chargement natif incomplet : {error}", { error: this._initError })); hint.append(button(t(this._hass, "Réessayer"), () => this._initialize())); root.append(hint); }
    this._config.sections.forEach((section, s) => {
      const row = el("div", "section-editor"); row.dataset.section = String(s);
      const head = el("div", "section-head");
      head.append(this._handle({ kind: "sections", s }, t(this._hass, "Déplacer {name}", { name: section.title })), button(section.title, () => this._openSection(section.id), t(this._hass, "Ouvrir la section {name}", { name: section.title })));
      head.lastChild.className = "title-button";
      head.append(this._pencil(() => this._openSection(section.id), t(this._hass, "Réglages de la section {name}", { name: section.title })), this._moveButton("up", s > 0, () => this._moveSection(s, s - 1), t(this._hass, "Monter la section")), this._moveButton("down", s < this._config.sections.length - 1, () => this._moveSection(s, s + 2), t(this._hass, "Descendre la section")), this._iconButton("trash", () => { this._config.sections.splice(s, 1); this._emit(); }, t(this._hass, "Supprimer la section")));
      this._dropTarget(head, (drag) => { if (drag.kind === "sections") this._moveSection(drag.s, s); }, (drag) => drag.kind === "sections");
      row.append(head, el("div", "counts", t(this._hass, "{cards} carte(s) · {badges} badge(s)", { cards: section.cards.length, badges: section.badges.length }))); root.append(row);
    });
    const end = el("div", "dropzone"); this._dropTarget(end, (drag) => this._moveSection(drag.s, this._config.sections.length), (drag) => drag.kind === "sections");
    root.append(end, button(t(this._hass, "+ Section"), () => {
      const id = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      this._config.sections.push({ id: `section-${id}`, title: t(this._hass, "Nouvelle section"), cards: [], badges: [] });
      this._sectionId = `section-${id}`; this._selection = null; this._emit();
    }));
  }
  _renderGlobalHeaderSettings(root) {
    const group = this._group(t(this._hass, "En-tête de la carte"), "global-header");
    const header = this._config.header || { enabled: false, title: "", icon: "", badges: [] };
    group.body.append(this._form(header, [{ name: "enabled", selector: { boolean: {} } }], (value) => {
      this._config.header = { ...(this._config.header || header), ...value }; return this._emit();
    }));
    if (header.enabled) {
      group.body.append(this._form(header, [{ name: "title", selector: { text: {} } }, { name: "icon", selector: { icon: {} } }, { name: "text_size", selector: { number: { min: 0, mode: "box", step: "any" } } }], (value) => { Object.assign(this._config.header, value); return this._emit(false); }));
      group.body.append(el("h4", "", t(this._hass, "Badges de l’en-tête"))); const list = el("div", "list global-header-badges");
      header.badges.forEach((badge, i) => {
        const row = el("div", "row"); const label = el("span", "label");
        const name = el("span", "item-label", itemName(badge, this._hass)); const type = el("small", "type-label", itemTypeName(badge, this._hass, "badges"));
        for (const node of [name, type]) { node.dataset.kind = "badges"; node.dataset.index = String(i); node.dataset.scope = "header"; }
        label.append(name, type);
        row.append(this._handle({ kind: "badges", scope: "header", i }, t(this._hass, "Déplacer ce badge d’en-tête")), label,
          this._pencil(() => this._selectHeaderBadge(i), t(this._hass, "Modifier le badge de l’en-tête")),
          this._moveButton("up", i > 0, () => this._moveHeaderBadge(i, i - 1), t(this._hass, "Monter le badge d’en-tête")),
          this._moveButton("down", i < header.badges.length - 1, () => this._moveHeaderBadge(i, i + 2), t(this._hass, "Descendre le badge d’en-tête")),
          this._iconButton("trash", () => { this._config.header.badges.splice(i, 1); this._emit(); }, t(this._hass, "Supprimer le badge de l’en-tête")));
        this._dropTarget(row, (drag) => this._moveHeaderBadge(drag.i, i), (drag) => drag.scope === "header"); list.append(row);
      });
      const end = el("div", "dropzone"); this._dropTarget(end, (drag) => this._moveHeaderBadge(drag.i, this._config.header.badges.length), (drag) => drag.scope === "header"); list.append(end);
      group.body.append(list, button(t(this._hass, "+ Badge d’en-tête"), () => this._selectHeaderBadge(null)));
    }
    root.append(group.details);
  }
  _selectHeaderBadge(i) { this._sectionId = null; this._transfer = null; this._selection = { kind: "badges", i, scope: "header" }; this._render(); }
  _moveHeaderBadge(from, slot) { this._config.header.badges = moveItem(this._config.header.badges, from, slot); this._emit(); }
  _renderSectionPage(root) {
    const section = this._currentSection(); const s = this._sectionIndex();
    const nav = el("div", "nav-header"); nav.append(this._backButton(t(this._hass, "Toutes les sections"), () => { this._sectionId = null; this._transfer = null; this._render(); }, t(this._hass, "Retour à toutes les sections")), el("h3", "section-title", `${t(this._hass, "Section")} · ${section.title}`)); root.append(nav);
    const header = this._group(t(this._hass, section.always_open ? "Réglages de section" : "En-tête de section"), `${section.id}:header`, true); header.details.dataset.kind = "header";
    const schema = [{ name: "always_open", selector: { boolean: {} } }, ...headerSchema.filter(field => !section.always_open || field.name === "title")];
    header.body.append(this._form(section, schema, (value) => { const current = this._currentSection(); const modeChanged = value.always_open !== undefined && current.always_open !== value.always_open; Object.assign(current, value); return this._emit(modeChanged); }));
    if (section.always_open) header.body.append(el("p", "hint", t(this._hass, "Cette section reste ouverte, hors mode exclusif. L’en-tête et les badges sont masqués ; leurs réglages sont conservés. Les conditions de visibilité restent applicables.")));
    root.append(header.details);
    const visibility = this._group(t(this._hass, "Visibilité de la section"), `${section.id}:visibility`); visibility.details.dataset.kind = "visibility";
    visibility.body.append(this._visibilityEditor(() => this._currentSection(), (config) => { const current = this._currentSection(); if (config.visibility?.length) current.visibility = config.visibility; else delete current.visibility; this._emit(false); }));
    for (const kind of ["badges", "cards"]) {
      if (kind === "badges" && section.always_open) continue;
      const group = this._group(`${kind === "badges" ? t(this._hass, "Badges") : t(this._hass, "Cartes")} (${section[kind].length})`, `${section.id}:${kind}`); group.details.dataset.kind = kind;
      if (kind === "cards") group.body.append(this._form(section, contentSchema, (value) => { Object.assign(this._config.sections[this._sectionIndex()], value); return this._emit(false); }));
      const list = el("div", "list"); list.dataset.kind = kind;
      section[kind].forEach((item, i) => {
        const row = el("div", "row"); row.dataset.index = String(i); row.dataset.kind = kind;
        const label = el("span", "label"); const name = el("span", "item-label", itemName(item, this._hass)); name.dataset.index = String(i); name.dataset.kind = kind;
        const type = el("small", "type-label", itemTypeName(item, this._hass, kind)); type.dataset.index = String(i); type.dataset.kind = kind;
        label.append(name, type);
        row.append(this._handle({ kind, s, i }, t(this._hass, "Déplacer cet élément")), label, this._pencil(() => this._select({ kind, s, i }), kind === "cards" ? t(this._hass, "Modifier la carte") : t(this._hass, "Modifier le badge")), this._moveButton("up", i > 0, () => this._moveNested({ kind, s, i }, s, i - 1), t(this._hass, "Monter l’élément")), this._moveButton("down", i < section[kind].length - 1, () => this._moveNested({ kind, s, i }, s, i + 2), t(this._hass, "Descendre l’élément")), this._iconButton("trash", () => { this._currentSection()[kind].splice(i, 1); this._transfer = null; this._emit(); }, t(this._hass, "Supprimer l’élément")));
        for (const mode of ["move", "copy"]) {
          const control = this._iconButton(mode, () => { this._transfer = this._transfer?.kind === kind && this._transfer?.i === i && this._transfer?.mode === mode ? null : { kind, s, i, mode }; this._render(); }, mode === "move" ? t(this._hass, "Déplacer dans une autre section") : t(this._hass, "Copier dans une section"));
          control.disabled = mode === "move" && !this._config.sections.some((target, index) => index !== s && (kind !== "badges" || !target.always_open)); control.setAttribute("aria-expanded", String(this._transfer?.kind === kind && this._transfer?.i === i && this._transfer?.mode === mode)); row.append(control);
        }
        this._dropTarget(row, (drag) => this._moveNested(drag, s, i), (drag) => drag.kind === kind); list.append(row);
        if (this._transfer?.kind === kind && this._transfer?.i === i) list.append(this._transferPanel(this._transfer));
      });
      const end = el("div", "dropzone"); end.setAttribute("aria-label", t(this._hass, "Déposer en fin de liste"));
      this._dropTarget(end, (drag) => this._moveNested(drag, s, this._currentSection()[kind].length), (drag) => drag.kind === kind); list.append(end);
      group.body.append(list, button(kind === "cards" ? t(this._hass, "+ Carte") : t(this._hass, "+ Badge"), () => this._select({ kind, s, i: null })));
      root.append(group.details);
    }
    root.append(visibility.details);
  }
  _renderItemPage(root) {
    const section = this._editingContainer(); const { kind, i, scope } = this._selection;
    const breadcrumb = el("nav", "breadcrumb"); breadcrumb.setAttribute("aria-label", t(this._hass, "Navigation des réglages"));
    breadcrumb.append(button(scope === "header" ? t(this._hass, "Réglages de carte") : t(this._hass, "Sections"), () => { this._selection = null; this._sectionId = null; this._render(); }), el("span", "", " / "), button(scope === "header" ? t(this._hass, "En-tête de la carte") : section.title, () => this._backToSection()), el("span", "", ` / ${kind === "cards" ? t(this._hass, "Cartes") : t(this._hass, "Badges")}`));
    const back = scope === "header" ? this._backButton(t(this._hass, "En-tête de la carte"), () => this._backToSection(), t(this._hass, "Retour à l’en-tête de la carte")) : this._backButton(`${t(this._hass, "Section")} « ${section.title} » · ${kind === "cards" ? t(this._hass, "Cartes") : t(this._hass, "Badges")}`, () => this._backToSection(), t(this._hass, "Retour à la section {name}", { name: section.title }));
    const nav = el("div", "nav-header"); nav.append(breadcrumb, back); root.append(nav, el("h3", "context-title", i === null ? t(this._hass, kind === "cards" ? "Ajouter une carte" : "Ajouter un badge") : `${kind === "cards" ? t(this._hass, "Carte") : t(this._hass, "Badge")} · ${itemName(section[kind][i], this._hass)}`), el("div", "pane"));
  }
  _openSection(id) { this._sectionId = id; this._selection = null; this._transfer = null; this._render(); }
  _backToSection() {
    if (this._selection?.scope === "header") { this._selection = null; this._sectionId = null; this._render(); this.shadowRoot.querySelector('.group[data-group="global-header"] summary')?.focus(); return; }
    const kind = this._selection?.kind; this._expanded.set(`${this._sectionId}:${kind}`, true); this._selection = null; this._render();
    this.shadowRoot.querySelector(`.group[data-kind="${kind}"] summary`)?.focus();
  }
  _updateLabels() {
    const section = this._currentSection(); const container = this._editingContainer();
    const title = this.shadowRoot.querySelector(".section-title"); if (title && section) title.textContent = `Section · ${section.title}`;
    for (const node of this.shadowRoot.querySelectorAll(".item-label")) {
      const source = node.dataset.scope === "header" ? this._config.header : section;
      const item = source?.[node.dataset.kind]?.[Number(node.dataset.index)]; if (item) node.textContent = itemName(item, this._hass);
    }
    for (const node of this.shadowRoot.querySelectorAll(".type-label")) { const source = node.dataset.scope === "header" ? this._config.header : section; const item = source?.[node.dataset.kind]?.[Number(node.dataset.index)]; if (item) node.textContent = itemTypeName(item, this._hass, node.dataset.kind); }
    const heading = this.shadowRoot.querySelector(".context-title"); const selection = this._selection;
    if (heading && selection && selection.i !== null && container?.[selection.kind]?.[selection.i]) heading.textContent = `${selection.kind === "cards" ? t(this._hass, "Carte") : t(this._hass, "Badge")} · ${itemName(container[selection.kind][selection.i], this._hass)}`;
  }
  _moveButton(icon, enabled, action, label) { const node = this._iconButton(icon, action, label); node.disabled = !enabled; return node; }
  _handle(data, label) {
    const handle = this._iconButton("drag", () => {}, label); handle.classList.add("drag"); handle.draggable = true;
    handle.addEventListener("dragstart", (event) => { event.stopPropagation(); this._drag = data; event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", "flex-accordion-card"); });
    handle.addEventListener("dragend", () => { this._drag = null; this.shadowRoot.querySelectorAll(".drop-over").forEach((node) => node.classList.remove("drop-over")); }); return handle;
  }
  _dropTarget(node, action, accepts = () => true) {
    node.addEventListener("dragover", (event) => { if (!this._drag || !accepts(this._drag)) return; event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = "move"; node.classList.add("drop-over"); });
    node.addEventListener("dragleave", () => node.classList.remove("drop-over"));
    node.addEventListener("drop", (event) => { if (!this._drag || !accepts(this._drag)) return; event.preventDefault(); event.stopPropagation(); const drag = this._drag; this._drag = null; this._selection = null; action(drag); });
  }
  _moveSection(from, slot) { this._config.sections = moveItem(this._config.sections, from, slot); this._selection = null; this._transfer = null; this._emit(); }
  _moveNested(drag, s, slot) { this._config = moveNested(this._config, drag.kind, drag.s, drag.i, s, slot); this._selection = null; this._transfer = null; this._emit(); }
  _transferPanel(transfer) {
    const panel = el("div", "transfer-panel"); panel.append(el("strong", "", transfer.mode === "copy" ? t(this._hass, "Copier dans une section") : t(this._hass, "Déplacer dans une autre section")));
    const choices = el("div", "transfer-options");
    this._config.sections.forEach((section, destination) => {
      if (destination === transfer.s && transfer.mode !== "copy" || transfer.kind === "badges" && section.always_open) return;
      const target = button(section.title, () => {
        if (transfer.mode === "copy") { this._config = copyNested(this._config, transfer.kind, transfer.s, transfer.i, destination); this._transfer = null; this._emit(); }
        else this._moveNested(transfer, destination, section[transfer.kind].length);
      }); target.dataset.destination = section.id;
      this._dropTarget(target, (drag) => this._moveNested(drag, destination, section[drag.kind].length), (drag) => drag.kind === transfer.kind);
      choices.append(target);
    }); choices.append(this._iconButton("close", () => { this._transfer = null; this._render(); }, t(this._hass, "Annuler le transfert"))); panel.append(choices); return panel;
  }
  _select(selection) {
    this._transfer = null;
    this._sectionId = this._config.sections[selection.s].id;
    this._selection = { kind: selection.kind, i: selection.i }; this._render();
  }
  _saveItem(config, fromNative = false) {
    if (!config || typeof config !== "object" || Array.isArray(config) || typeof config.type !== "string" || !config.type) return;
    const selection = this._selection; const section = this._editingContainer(); if (!selection || !section) return;
    if (selection.i === null) {
      section[selection.kind].push(clone(config));
      this._selection = { ...selection, i: section[selection.kind].length - 1 }; this._emit();
    } else {
      const current = section[selection.kind][selection.i];
      // A derived default shown by the native editor is not an explicit user action.
      // Keep it implicit so changing light -> sensor can also change the default.
      if (fromNative && !Object.hasOwn(current, "tap_action") && this._active?.lastSent?.tap_action && sameConfig(config.tap_action, this._active.lastSent.tap_action)) {
        config = { ...config }; delete config.tap_action;
      }
      if (sameConfig(section[selection.kind][selection.i], config)) return;
      const oldType = section[selection.kind][selection.i].type;
      section[selection.kind][selection.i] = clone(config);
      this._emit(oldType !== config.type);
    }
  }
  _syncActive() {
    const active = this._active; const selection = this._selection;
    const config = selection && this._editingContainer()?.[selection.kind]?.[selection.i];
    if (!active || !config || active.epoch !== this._epoch) return;
    const value = clone(withDefaultInteraction(config, selection.kind));
    if (sameConfig(active.lastSent, value)) return;
    if (active.syncing) {
      if (!active.pending) { active.pending = true; queueMicrotask(() => { active.pending = false; if (this._active === active) this._syncActive(); }); }
      return;
    }
    active.lastSent = clone(value); active.syncing = true;
    try { if (active.wrapper) active.node.value = value; else active.node.setConfig(value); }
    finally { active.syncing = false; }
  }
  _bindEditor(node, wrapper, pane, epoch) {
    const config = this._editingContainer()[this._selection.kind][this._selection.i];
    const active = { node, wrapper, epoch, type: config.type };
    this._active = active;
    node.addEventListener("config-changed", (event) => {
      event.stopPropagation(); if (this._active !== active || epoch !== this._epoch || event.detail.error) return;
      // Accept the complete native configuration, including deliberate field removals.
      this._saveItem(event.detail.config, true);
    });
    this._native(node); this._syncActive(); pane.append(node);
  }
  async _renderPane() {
    const pane = this.shadowRoot.querySelector(".pane"); if (!pane || !this._selection) return;
    const epoch = this._epoch; const { kind, i } = this._selection;
    const save = (config) => { if (epoch === this._epoch) this._saveItem(config); };
    if (i === null) {
      const tag = kind === "cards" ? "hui-card-picker" : "hui-badge-picker";
      if (customElements.get(tag)) {
        const picker = this._native(el(tag)); picker.addEventListener("config-changed", (event) => { event.stopPropagation(); save(event.detail.config); }); pane.append(picker);
      } else if (kind === "badges") {
        pane.append(el("p", "hint", t(this._hass, "Choisissez une entité. Son éditeur Home Assistant s’ouvrira ensuite."))); const data = { entity: "" };
        pane.append(this._form(data, [{ name: "entity", selector: { entity: {} } }], (value) => Object.assign(data, value)), button(t(this._hass, "Ajouter le badge"), () => { if (data.entity) save({ type: "entity", entity: data.entity }); }));
      } else pane.append(button(t(this._hass, "Ajouter Markdown"), () => save({ type: "markdown", content: t(this._hass, "Nouvelle carte") })));
      this._jsonEditor(pane, () => kind === "cards" ? { type: "markdown", content: t(this._hass, "Nouvelle carte") } : { type: "entity", entity: "" }, save, t(this._hass, "Ajout manuel (JSON)")); return;
    }
    const config = this._editingContainer()?.[kind]?.[i]; if (!config) return;
    const interaction = defaultInteraction(config, kind);
    if (interaction && !Object.hasOwn(config, "tap_action")) pane.append(el("p", "hint", t(this._hass, "Action par défaut : {action}. Une action personnalisée reste prioritaire.", { action: interaction.action === "toggle" ? t(this._hass, "Basculer") : interaction.action === "perform-action" ? interaction.perform_action : t(this._hass, "Plus d’informations") })));
    if (kind === "badges" && config.type === "entity") {
      if (!customElements.get("ha-form")) {
        try {
          const helpers = this._helpers || await cardHelpers(); const entity = helpers.createBadgeElement(config);
          if (entity.constructor.getConfigElement) await bounded(entity.constructor.getConfigElement());
        } catch { /* Use the existing native/JSON fallback below. */ }
        if (epoch !== this._epoch) return;
      }
      if (customElements.get("ha-form")) {
        const native = createEntityBadgeEditor(); pane.append(this._modeButton(native)); this._bindEditor(native, false, pane, epoch); this._badgeVisibility(pane); return;
      }
    }
    const tag = kind === "cards" ? "hui-card-element-editor" : "hui-badge-element-editor";
    if (customElements.get(tag)) {
      const native = el(tag); pane.append(this._modeButton(native));
      if (kind === "cards") native.showVisibilityTab = Boolean(customElements.get("hui-card"));
      this._bindEditor(native, true, pane, epoch); return;
    }
    const loading = el("p", "hint", t(this._hass, "Chargement de l’éditeur natif…")); pane.append(loading);
    try {
      const helpers = this._helpers || await cardHelpers(); const factory = kind === "cards" ? helpers.createCardElement : helpers.createBadgeElement;
      if (typeof factory !== "function") throw new Error("Helper natif absent");
      const element = factory(withDefaultInteraction(config, kind));
      const native = element.constructor.getConfigElement ? await bounded(element.constructor.getConfigElement()) : undefined;
      if (epoch !== this._epoch) return; loading.remove();
      if (native?.setConfig) this._bindEditor(native, false, pane, epoch);
      else pane.append(el("p", "hint", t(this._hass, "Aucun éditeur visuel disponible pour cet élément. Utilisez JSON ou le YAML de la carte principale.")));
    } catch (error) { if (epoch !== this._epoch) return; loading.textContent = t(this._hass, "Éditeur natif indisponible : {error}", { error: error.message }); }
    if (epoch === this._epoch && kind === "badges") this._badgeVisibility(pane);
    if (epoch === this._epoch) this._jsonEditor(pane, () => this._editingContainer()[kind][this._selection.i], save, t(this._hass, "Configuration manuelle (JSON)"));
  }
  _jsonEditor(pane, getConfig, save, title) {
    const details = el("details", "manual"); details.append(el("summary", "", title));
    const textarea = el("textarea"); textarea.value = JSON.stringify(getConfig(), null, 2); textarea.setAttribute("aria-label", title);
    // Load the latest native edits when opening JSON, not the initial snapshot.
    details.addEventListener("toggle", () => { if (details.open && details.isConnected) textarea.value = JSON.stringify(getConfig(), null, 2); });
    const error = el("p", "error"); details.append(textarea, button(t(this._hass, "Appliquer JSON"), () => {
      try {
        const value = JSON.parse(textarea.value); if (!value || Array.isArray(value) || typeof value !== "object" || typeof value.type !== "string" || !value.type) throw new Error(t(this._hass, "Objet avec type requis"));
        error.textContent = ""; save(value);
      } catch (err) { error.textContent = err.message; }
    }), error); pane.append(details);
  }
}
if (!customElements.get("flex-accordion-card-editor")) customElements.define("flex-accordion-card-editor", FlexAccordionCardEditor);
