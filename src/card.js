import { t } from "./i18n.js";
import { VERSION, normalizeConfig, initialOpen, toggleOpen, withDefaultInteraction } from "./core.js";

// Native DOM keeps the distributed module dependency-free.
export const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
export const button = (text, action, label = text) => {
  const node = el("button", "", text);
  node.type = "button";
  node.setAttribute("aria-label", label);
  node.addEventListener("click", action);
  return node;
};
// Scoped HA theme variables inherited by the native badge; no shadow DOM edits.
export function badgeNativeConfig(config) { const { hide_border, transparent_background, ...native } = config; return native; }
const badgeAppearanceOverrides = new WeakMap();
export function applyBadgeAppearance(node, config) {
  const variables = {"--ha-card-border-width": config.hide_border ? "0px" : undefined, "--ha-card-background": config.transparent_background ? "transparent" : undefined, "--ha-card-backdrop-filter": config.transparent_background ? "none" : undefined, "--ha-card-box-shadow": config.hide_border || config.transparent_background ? "none" : undefined};
  const previous = badgeAppearanceOverrides.get(node) || new Map();
  for(const [name,value] of Object.entries(variables)) {
    if(value === undefined) { if(previous.has(name)) { const original=previous.get(name);if(original.value)node.style.setProperty(name,original.value,original.priority);else node.style.removeProperty(name);previous.delete(name); } }
    else { if(!previous.has(name)) previous.set(name,{value:node.style.getPropertyValue(name)||"",priority:node.style.getPropertyPriority?.(name)||""});node.style.setProperty(name,value); }
  }
  badgeAppearanceOverrides.set(node,previous);
  return node;
}
export function svgIcon(name) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("width", "22"); svg.setAttribute("height", "22");
  svg.setAttribute("fill", "none"); svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2.3");
  svg.setAttribute("stroke-linecap", "round"); svg.setAttribute("stroke-linejoin", "round");
  const path = document.createElementNS(svg.namespaceURI, "path");
  const paths = { pencil: "M15 5l4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z", chevron: "M6 9l6 6 6-6", up: "M6 14l6-6 6 6", down: "M6 10l6 6 6-6", back: "M19 12H5m7-7l-7 7 7 7", trash: "M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7", move: "M4 5h8v14H4zM12 12h9m-4-4l4 4-4 4", copy: "M9 9h12v12H9zM15 9V3H3v12h6", drag: "M8 5h1m6 0h1M8 12h1m6 0h1M8 19h1m6 0h1", code: "M8 6l-6 6 6 6M16 6l6 6-6 6M14 3l-4 18", visual: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z", close: "M5 5l14 14M19 5L5 19" };
  path.setAttribute("d", paths[name] || paths.chevron);
  svg.append(path); return svg;
}
export const bounded = (promise, ms = 8000) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error("Délai de chargement Home Assistant dépassé")), ms);
  Promise.resolve(promise).then((value) => { clearTimeout(timer); resolve(value); }, (error) => { clearTimeout(timer); reject(error); });
});
export async function cardHelpers() {
  if (typeof window.loadCardHelpers !== "function") throw new Error("Helpers Lovelace absents. Ouvrez cette carte dans un tableau de bord Home Assistant.");
  return bounded(window.loadCardHelpers());
}
// This host has no shadow root: HA's visibility wrapper can show/hide an entire
// existing section while the accordion retains its child instances and state.
const sectionHosts = new Map();
let sectionHostId = 0;
export class FlexAccordionSectionHost extends HTMLElement {
  connectedWhileHidden = true;
  setConfig(config) {
    const section = sectionHosts.get(config.host);
    if (!section) throw new Error("Section interne indisponible");
    if (!this.contains(section)) this.replaceChildren(section);
  }
  getCardSize() { return 1; }
}
if (!customElements.get("flex-accordion-section-host")) customElements.define("flex-accordion-section-host", FlexAccordionSectionHost);

export class FlexAccordionCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._open = new Set();
    this._children = [];
    this._generation = 0;
    this._preview = false;
    this._hosts = new Map(); this._sectionNodes = [];
  }
  static async getConfigElement() { return document.createElement("flex-accordion-card-editor"); }
  static getStubConfig(hass) {
    return { type: "custom:flex-accordion-card", layout: "unified", exclusive: false, sections: [
      { id: "welcome", layout: "sections", title: t(hass, "Ma première section"), icon: "mdi:home", default_open: true, cards: [{ type: "markdown", content: t(hass, "Bienvenue dans **Flex Accordion Card** !") }], badges: [] },
    ] };
  }
  setConfig(input) {
    const config = normalizeConfig(input);
    this._open = initialOpen(config, this._config ? this._open : undefined);
    this._config = config;
    this._render();
  }
  set hass(value) {
    this._hass = value;
    const empty = this.shadowRoot.querySelector(".empty"); if (empty) empty.textContent = t(value, "Ajoutez une section dans l’éditeur.");
    const migration=this.shadowRoot.querySelector(".migration-notice"); if(migration) migration.textContent=t(value, "Vos anciennes dispositions ont été converties en Sections. Vérifiez la largeur, la hauteur et le positionnement des cartes, puis confirmez la vérification dans l’éditeur.");
    this._propagate();
  }
  get hass() { return this._hass; }
  set preview(value) { this._preview = Boolean(value); this._propagate(); }
  get preview() { return this._preview; }
  connectedCallback() { for (const [id, node] of this._hosts) sectionHosts.set(id, node); if (this._config && !this.shadowRoot.querySelector(".root")) this._render(); }
  disconnectedCallback() { for (const id of this._hosts.keys()) sectionHosts.delete(id); }
  _propagate() {
    for (const child of this._children) {
      try { child.hass = this._hass; child.preview = this._preview; }
      catch (error) { console.warn("flex-accordion-card: mise à jour enfant", error); }
    }
  }
  getCardSize() {
    // Conservative synchronous masonry estimate; actual heights are dynamic.
    return (this._config?.sections || []).reduce((sum, section) => sum + (section.always_open ? 0 : 1) + ((section.always_open || this._open.has(section.id)) ? Math.max(1, section.cards.length * 2) : 0), this._config?.header?.enabled ? 1 : 0) || 1;
  }
  getGridOptions() { return { columns: 12, rows: "auto", min_columns: 3 }; }
  _toggle(id) {
    if (this._config.sections.find(section => section.id === id)?.always_open) return;
    this._open = toggleOpen(this._open, id, this._config.exclusive);
    this._syncOpen();
  }
  _syncOpen() {
    for (const section of this._sectionNodes) {
      const open = section.dataset.alwaysOpen === "true" || this._open.has(section.dataset.id);
      const toggle = section.querySelector(".toggle");
      const panel = section.querySelector(".panel");
      // Restore focus before making a panel inert, including exclusive closure.
      if (!open && panel.contains(this.shadowRoot.activeElement)) toggle?.focus();
      toggle?.setAttribute("aria-expanded", String(open));
      panel.inert = !open;
      panel.setAttribute("aria-hidden", String(!open));
      section.classList.toggle("open", open);
    }
  }
  _render() {
    const generation = ++this._generation;
    this._children = [];
    for (const id of this._hosts.keys()) sectionHosts.delete(id);
    this._hosts.clear(); this._sectionNodes = [];
    const config = this._config;
    const style = el("style");
    style.textContent = `
      :host{display:block;--fac-gap:12px;color:var(--primary-text-color,#20252b)}
      *{box-sizing:border-box}.root{display:flex;flex-direction:column;gap:var(--fac-gap)}
      .unified{gap:0;border-radius:var(--ha-card-border-radius,12px);overflow:hidden;background:var(--ha-card-background,var(--card-background-color,#fff));border:var(--ha-card-border-width,1px) solid var(--ha-card-border-color,var(--divider-color,#ddd));box-shadow:var(--ha-card-box-shadow,none)}
      .unified>.section-slot+.section-slot{border-top:1px solid var(--divider-color,#ddd)}
      .root.with-background{padding:12px;background:var(--ha-card-background,var(--card-background-color,#fff));border-radius:var(--ha-card-border-radius,12px);border:var(--ha-card-border-width,1px) solid var(--ha-card-border-color,var(--divider-color,#ddd))}
      flex-accordion-section-host{display:block}.section-slot[hidden]{display:none!important}
      .separate .section{border-radius:var(--ha-card-border-radius,12px);background:var(--ha-card-background,var(--card-background-color,#fff));border:var(--ha-card-border-width,1px) solid var(--ha-card-border-color,var(--divider-color,#ddd));box-shadow:var(--ha-card-box-shadow,none);overflow:hidden}
      .header{display:grid;grid-template-columns:minmax(80px,1fr) minmax(0,auto) 28px;align-items:center;position:relative;padding:6px 10px;gap:8px}
      .toggle{display:flex;align-items:center;gap:12px;border:0;background:transparent;color:inherit;font:inherit;font-weight:600;text-align:start;cursor:pointer;padding:12px 6px;min-width:0;align-self:stretch}
      .toggle:after{content:"";position:absolute;inset:0;z-index:0}.toggle>*{position:relative;z-index:1;pointer-events:none}
      .toggle:focus-visible{outline:2px solid var(--primary-color,#03a9f4);outline-offset:-2px;border-radius:6px}
      .title{flex:1;overflow-wrap:anywhere}.chevron{display:flex;align-items:center;justify-content:center;position:relative;pointer-events:none;transition:transform var(--fac-duration)}
      .open .chevron{transform:rotate(180deg)}
      .badges{position:relative;z-index:2;display:flex;align-items:center;flex-wrap:wrap;gap:6px;max-width:100%}
      .panel{display:grid;grid-template-rows:0fr;transition:grid-template-rows var(--fac-duration) ease,visibility 0s var(--fac-duration);visibility:hidden}
      .open .panel{grid-template-rows:1fr;visibility:visible;transition-delay:0s}.panel-inner{min-height:0;overflow:hidden;opacity:0;transition:opacity var(--fac-duration) ease}.open .panel-inner{opacity:1}
      .cards{display:grid;gap:var(--fac-gap);padding:4px 12px 12px;grid-template-columns:minmax(0,1fr)}
      .always-open .panel{display:block;visibility:visible;transition:none}.always-open .panel-inner{opacity:1;transition:none}.always-open .cards{padding-top:12px}
      .cards>*{min-width:0}
      .cards.sections{display:block}.native-section{display:block;--column-span:1}
      .migration-notice{padding:12px;margin:8px;border-inline-start:4px solid var(--warning-color,#ffa600);font-size:14px;line-height:1.5}
      .error{font-size:13px;color:var(--error-color,#b71c1c);padding:10px;overflow-wrap:anywhere}.empty{padding:12px;color:var(--secondary-text-color,#666)}
      .load-error button{padding:8px;cursor:pointer}
      .card-header{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,auto);align-items:center;gap:8px;padding:6px 10px;margin-top:5px}.card-heading{display:flex;align-items:center;gap:8px;min-width:0;--mdc-icon-size:18px}.card-heading h2{font:inherit;font-size:var(--fac-heading-size,16px);font-weight:var(--ha-heading-card-title-font-weight,400);line-height:1.3;margin:0;overflow-wrap:anywhere}.unified>.card-header{border-bottom:1px solid var(--divider-color,#ddd)}.separate>.card-header{background:var(--ha-card-background,var(--card-background-color,#fff));border:var(--ha-card-border-width,1px) solid var(--ha-card-border-color,var(--divider-color,#ddd));border-radius:var(--ha-card-border-radius,12px)}
      @media(prefers-reduced-motion:reduce){.panel,.panel-inner,.chevron{transition:none}}
    `;
    const root = el("div", `root ${config.layout}${config.background ? " with-background" : ""}`);
    if(config.layout_migration?.reviewed === false) {
      const notice=el("div", "migration-notice", t(this._hass, "Vos anciennes dispositions ont été converties en Sections. Vérifiez la largeur, la hauteur et le positionnement des cartes, puis confirmez la vérification dans l’éditeur."));
      notice.setAttribute("role", "status"); root.append(notice);
    }
    root.style.setProperty("--fac-duration", `${config.animation ? config.animation_duration : 0}ms`);
    const slots = [];
    let globalBadges;
    if (config.header?.enabled) {
      const header = el("header", "card-header"); const heading = el("div", "card-heading");
      if (config.header.text_size !== undefined) header.style.setProperty("--fac-heading-size", `${config.header.text_size}px`);
      if (config.header.icon) { const icon = el("ha-icon"); icon.icon = config.header.icon; icon.setAttribute("aria-hidden", "true"); heading.append(icon); }
      if (config.header.title) heading.append(el("h2", "", config.header.title));
      globalBadges = el("div", "badges"); header.append(heading, globalBadges); root.append(header);
    }
    if (!config.sections.length) root.append(el("div", "empty", t(this._hass, "Ajoutez une section dans l’éditeur.")));
    config.sections.forEach((section, index) => {
      const shell = el("section", `section${section.always_open ? " always-open" : ""}`);
      this._sectionNodes.push(shell);
      shell.dataset.id = section.id; shell.dataset.alwaysOpen = String(section.always_open);
      let badges;
      if (!section.always_open) {
      const header = el("div", "header");
      const toggle = button("", () => this._toggle(section.id), section.title);
      toggle.className = "toggle";
      toggle.id = `header-${index}`;
      toggle.setAttribute("aria-controls", `panel-${index}`);
      if (section.icon) { const icon = el("ha-icon"); icon.icon = section.icon; toggle.append(icon); }
      toggle.append(el("span", "title", section.title));
      const chevron = el("span", "chevron"); chevron.setAttribute("aria-hidden", "true"); chevron.append(svgIcon("chevron"));
      badges = el("div", "badges");
      // Native badge actions must not toggle the accordion (including keyboard/hold).
      for (const event of ["click", "dblclick", "keydown", "action"]) badges.addEventListener(event, (e) => e.stopPropagation());
      header.append(toggle, badges, chevron); shell.append(header);
      }
      const panel = el("div", "panel");
      panel.id = `panel-${index}`;
      panel.setAttribute("role", "region");
      if (section.always_open) panel.setAttribute("aria-label", section.title);
      else panel.setAttribute("aria-labelledby", `header-${index}`);
      const inner = el("div", "panel-inner");
      const cards = el("div", `cards ${section.layout}`);
      inner.append(cards); panel.append(inner); shell.append(panel);
      if (section.visibility?.length) {
        const placeholder = el("div", "section-slot"); root.append(placeholder);
        const host = `flex-section-${++sectionHostId}`; this._hosts.set(host, shell); sectionHosts.set(host, shell);
        slots.push({ section, cards, badges, placeholder, host });
      } else { shell.classList.add("section-slot"); root.append(shell); slots.push({ section, cards, badges }); }
    });
    this.shadowRoot.replaceChildren(style, root);
    this._syncOpen();
    this.updateComplete = this._populate(slots, generation, globalBadges);
  }
  async _populate(slots, generation, globalBadges) {
    try {
      const helpers = await cardHelpers();
      if (generation !== this._generation) return;
      if (globalBadges) this._config.header.badges.forEach((config) => globalBadges.append(this._nativeElement("badge", config, helpers)));
      for (const { section, cards, badges, placeholder, host } of slots) {
        cards.append(this._nativeSection(section));
        if (badges) section.badges.forEach((config) => badges.append(this._nativeElement("badge", config, helpers)));
        if (placeholder) {
          const wrapper = this._nativeElement("card", { type: "custom:flex-accordion-section-host", host, visibility: section.visibility }, helpers);
          wrapper.classList.add("section-slot"); placeholder.replaceWith(wrapper);
        }
      }
      this._propagate();
    } catch (error) {
      if (generation !== this._generation) return;
      const notice = el("div", "error load-error", error.message);
      notice.append(button(t(this._hass, "Réessayer"), () => this._render()));
      this.shadowRoot.querySelector(".root").append(notice);
    }
  }
  _nativeSection(section) {
    // hui-section owns card loading/rebuilds, sizing and visibility. Never pass
    // the real dashboard's lovelace/path: native editing would save outside us.
    const unavailable = () => {
      const notice = el("div", "error native-section-error", t(this._hass, "Sections natives indisponibles. Ouvrez une vue Sections HA, puis réessayez."));
      notice.append(button(t(this._hass, "Réessayer"), () => this._render()));
      return notice;
    };
    if (!["hui-section", "hui-grid-section"].every(tag => customElements.get(tag))) return unavailable();
    try {
      const native = el("hui-section", "native-section");
      native.insideStrategy = true; // No dashboard edit handles or cross-view DnD.
      native.hass = this._hass;
      native.preview = this._preview;
      native.config = { type: "grid", cards: section.cards.map(config => withDefaultInteraction(config, "cards")) };
      this._children.push(native);
      return native;
    } catch (error) {
      const notice = unavailable(); notice.append(el("p", "", error.message)); return notice;
    }
  }
  _nativeElement(kind, config, helpers) {
    const fullConfig = config;
    config = withDefaultInteraction(config, kind === "card" ? "cards" : "badges");
    if(kind === "badge") config = badgeNativeConfig(config);
    let child;
    try {
      const tag = kind === "card" ? "hui-card" : "hui-badge";
      if (customElements.get(tag)) {
        // HA wrappers own visibility conditions, lazy upgrades and error recovery.
        child = el(tag);
        child.config = config;
        if (kind === "card") child.layout = "vertical";
      } else if (kind === "badge" && (config.visibility || config.disabled) && customElements.get("hui-card")) {
        // Some dashboards never load hui-badge. Reuse HA's card visibility
        // wrapper around the actual native badge, with the same entity context.
        const plain = { ...config }; delete plain.visibility; delete plain.disabled;
        const content = el("span", "native-badge-host"); content.append(this._nativeElement("badge", plain, helpers));
        const host = `flex-badge-${++sectionHostId}`; this._hosts.set(host, content); sectionHosts.set(host, content);
        child = el("hui-card"); child.config = { type: "custom:flex-accordion-section-host", host, entity: config.entity, visibility: config.visibility, disabled: config.disabled }; child.layout = "vertical";
      } else {
        if (config.visibility || config.disabled) throw new Error(t(this._hass, "{tag} absent : les conditions de visibilité nécessitent le wrapper natif HA.", { tag }));
        const create = kind === "card" ? helpers.createCardElement : helpers.createBadgeElement;
        if (typeof create !== "function") throw new Error(t(this._hass, "Helper natif {kind} indisponible dans ce frontend HA.", { kind }));
        child = create(config);
        child.addEventListener("ll-rebuild", (event) => {
          event.stopPropagation();
          const replacement = this._nativeElement(kind, fullConfig, helpers);
          this._children = this._children.filter((item) => item !== child);
          child.replaceWith(replacement);
          this._propagate();
        }, { once: true });
        child.addEventListener("ll-upgrade", () => this._propagate());
      }
      if(kind === "badge") applyBadgeAppearance(child,fullConfig);
      child.hass = this._hass;
      child.preview = this._preview;
      this._children.push(child);
      return child;
    } catch (error) { return el("div", "error", `${kind} (${config.type}) : ${error.message}`); }
  }
}
if (!customElements.get("flex-accordion-card")) customElements.define("flex-accordion-card", FlexAccordionCard);
window.customCards ??= [];
if (!window.customCards.some((card) => card.type === "flex-accordion-card")) window.customCards.push({
  type: "flex-accordion-card", name: "Flex Accordion Card", preview: true,
  description: "Sections accordéon, cartes Lovelace et badges natifs",
});
console.info(`Flex Accordion Card ${VERSION}`);
