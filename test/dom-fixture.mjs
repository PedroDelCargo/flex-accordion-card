// Minimal DOM doubles for component contract tests. No layout/browser emulation.
export class TestElement extends EventTarget {
  constructor(tag = "element") {
    super(); this.localName = tag; this.children = []; this.dataset = {}; this.attributes = new Map(); this.className = ""; this.textContent = ""; this.isConnected = false;
    this.style = { removeProperty: (key) => { delete this.style[key]; }, setProperty: (key, value) => { this.style[key] = value; }, getPropertyValue: (key) => this.style[key] };
    this.classList = {
      contains: (name) => this.className.split(/\s+/).includes(name),
      toggle: (name, force) => { const names = new Set(this.className.split(/\s+/).filter(Boolean)); if (force ?? !names.has(name)) names.add(name); else names.delete(name); this.className = [...names].join(" "); },
      add: (name) => this.classList.toggle(name, true), remove: (name) => this.classList.toggle(name, false),
    };
  }
  attachShadow() { return this.shadowRoot = new TestElement("shadow-root"); }
  setAttribute(key, value) { this.attributes.set(key, String(value)); if (key === "class") this.className = value; }
  getAttribute(key) { return this.attributes.get(key) ?? null; }
  append(...nodes) { for (const node of nodes) { node.parentNode = this; this.children.push(node); } }
  replaceChildren(...nodes) { this.children.forEach((node) => node.parentNode = null); this.children = []; this.append(...nodes); }
  remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter((node) => node !== this); this.parentNode = null; }
  replaceWith(node) { const parent = this.parentNode; if (!parent) return; const i = parent.children.indexOf(this); parent.children[i] = node; node.parentNode = parent; this.parentNode = null; }
  contains(node) { return this === node || this.children.some((child) => child.contains(node)); }
  get lastChild() { return this.children.at(-1); }
  get namespaceURI() { return "http://www.w3.org/2000/svg"; }
  matches(selector) {
    const attr = selector.match(/\[([^=\]]+)(?:="([^"]*)")?\]/);
    if (attr) {
      const value = attr[1].startsWith("data-") ? this.dataset[attr[1].slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] : this.getAttribute(attr[1]);
      if (attr[2] === undefined ? value == null : value !== attr[2]) return false;
      selector = selector.replace(attr[0], "");
    }
    if (!selector) return true;
    if (selector[0] === ".") return selector.slice(1).split(".").every((name) => this.classList.contains(name));
    return this.localName === selector;
  }
  querySelectorAll(selector) {
    const parts = selector.trim().split(/\s+/); const results = [];
    const visit = (node) => {
      for (const child of node.children) {
        if (child.matches(parts.at(-1))) {
          let parent = child.parentNode; let i = parts.length - 2;
          while (parent && i >= 0) { if (parent.matches(parts[i])) i--; parent = parent.parentNode; }
          if (i < 0) results.push(child);
        } visit(child);
      }
    }; visit(this); return results;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  focus() { let node = this; while (node.parentNode) node = node.parentNode; node.activeElement = this; }
}
const registry = new Map();
globalThis.HTMLElement = TestElement;
globalThis.customElements = { define: (tag, ctor) => registry.set(tag, ctor), get: (tag) => registry.get(tag), whenDefined: async (tag) => { if (!registry.has(tag)) throw new Error(`Test definition missing: ${tag}`); } };
globalThis.document = {
  createElement: (tag) => { const Ctor = registry.get(tag); const node = Ctor ? new Ctor() : new TestElement(tag); node.localName = tag; return node; },
  createElementNS: (_namespace, tag) => new TestElement(tag),
};
globalThis.window = { customCards: [] };
export class ControlledEditor extends TestElement {
  constructor() { super("controlled-editor"); this.config = {}; this.feedbackCount = 0; this.rendered = {}; }
  setConfig(config) { this.config = structuredClone(config); this.feedbackCount++; this.refresh(); }
  refresh() { this.rendered = structuredClone(this.config); }
  set hass(value) { this._hass = value; this.refresh(); }
  get hass() { return this._hass; }
  edit(field, value) {
    const config = { ...this.config, [field]: value };
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
  }
}
export class NativeContent extends TestElement {
  setConfig(config) { this.config = config; }
  static async getConfigElement() { return new ControlledEditor(); }
}
export class NativeStack extends NativeContent {}
customElements.define("hui-vertical-stack-card", NativeStack);
window.loadCardHelpers = async () => ({
  createCardElement: (config) => { const node = config.type === "vertical-stack" ? new NativeStack() : new NativeContent(); node.setConfig(config); return node; },
  createBadgeElement: (config) => { const node = new NativeContent(); node.setConfig(config); return node; },
});
