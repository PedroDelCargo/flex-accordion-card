import { t } from "./i18n.js";
export const VERSION = "0.7.0";
export const clone = (value) => JSON.parse(JSON.stringify(value));
// HA may echo configuration objects with a different property order.
export const configKey = (value) => JSON.stringify(value, (_key, item) =>
  item && typeof item === "object" && !Array.isArray(item)
    ? Object.fromEntries(Object.keys(item).sort().map((key) => [key, item[key]])) : item);
export const sameConfig = (a, b) => configKey(a) === configKey(b);
export function itemName(config, hass) {
  if (typeof config.title === "string" && config.title) return config.title;
  if (typeof config.name === "string" && config.name) return config.name;
  const state = hass?.states?.[config.entity];
  if (state && typeof hass?.formatEntityName === "function") {
    try { const name = hass.formatEntityName(state, config.name); if (name) return name; } catch { /* Older HA naming contract. */ }
  }
  return state?.attributes?.friendly_name || config.entity || ({ markdown: "Markdown", button: "Bouton", tile: "Tuile", entities: "Entités", entity: "Entité" })[config.type] || config.type;
}
export function itemTypeName(config, hass, kind = "cards") {
  const type = config.type || "";
  if (type.startsWith("custom:")) return globalThis.window?.customCards?.find((item) => `custom:${item.type}` === type)?.name || type.slice(7);
  const key = `ui.panel.lovelace.editor.${kind === "badges" ? "badge" : "card"}.${type}.name`;
  const translation = hass?.localize?.(key); const localized = translation !== key ? translation : undefined;
  return localized || t(hass, ({ button: "Bouton", "entity-button": "Bouton d’entité", entity: "Entité", entities: "Entités", tile: "Tuile", markdown: "Markdown", sensor: "Capteur", light: "Éclairage", gauge: "Jauge", heading: "En-tête", "history-graph": "Historique", "statistics-graph": "Statistiques", "weather-forecast": "Météo", "vertical-stack": "Pile verticale", "horizontal-stack": "Pile horizontale", grid: "Grille", conditional: "Conditionnelle", thermostat: "Thermostat", "media-control": "Lecteur multimédia", picture: "Image", map: "Carte géographique", calendar: "Calendrier" })[type] || type.replace(/-/g, " ").replace(/^./, (letter) => letter.toUpperCase()));
}
export function badgeShowsTime(config, hass) {
  if (config.show_state === false || !config.entity) return false;
  const content = (config.state_content == null ? ["state"] : Array.isArray(config.state_content) ? config.state_content : [config.state_content]).map((item) => item === "last-changed" ? "last_changed" : item === "last-updated" ? "last_updated" : item);
  if (content.some((item) => ["last_updated", "last_changed", "last_triggered"].includes(item))) return true;
  const domain = config.entity.split(".")[0];
  const state = hass?.states?.[config.entity];
  if (content.includes("state") && (["ai_task", "button", "conversation", "event", "image", "infrared", "input_button", "notify", "radio_frequency", "scene", "stt", "tag", "tts", "wake_word", "datetime"].includes(domain) || domain === "sensor" && ["timestamp", "uptime"].includes(state?.attributes?.device_class))) return true;
  const attributes = { calendar: ["start_time", "end_time"], input_datetime: ["timestamp"], sun: ["next_dawn", "next_dusk", "next_midnight", "next_noon", "next_rising", "next_setting"] };
  return (attributes[domain] || []).some((attribute) => content.includes(attribute));
}
const toggleDomains = new Set(["fan", "input_boolean", "light", "switch", "group", "automation", "humidifier", "valve"]);
export function defaultInteraction(config, kind) {
  // Other cards/custom elements retain their own native interaction logic.
  if (!(kind === "badges" && config.type === "entity") && !(kind === "cards" && ["button", "entity-button"].includes(config.type))) return undefined;
  const domain = config.entity?.split(".")[0];
  if (toggleDomains.has(domain)) return { action: "toggle" };
  if (["button", "input_button"].includes(domain)) return { action: "perform-action", perform_action: `${domain}.press`, target: { entity_id: config.entity } };
  if (["scene", "script"].includes(domain)) return { action: "perform-action", perform_action: `${domain}.turn_on`, target: { entity_id: config.entity } };
  return { action: "more-info" };
}
export function withDefaultInteraction(config, kind) {
  if (Object.hasOwn(config, "tap_action")) return config;
  const action = defaultInteraction(config, kind);
  return action && action.action !== "more-info" ? { ...config, tap_action: action } : config;
}
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const fail = (message) => { throw new Error(`flex-accordion-card: ${message}`); };
const integer = (value, min, max, name) => {
  if (!Number.isInteger(value) || value < min || value > max) fail(`${name}: entier ${min}–${max} attendu`);
};
function normalizeBadges(badges) {
  if (!Array.isArray(badges)) fail("badges: liste attendue");
  return badges.map((badge) => {
    if (typeof badge === "string") return { type: "entity", entity: badge };
    if (!object(badge)) fail("badge: objet ou identifiant d’entité attendu");
    badge.type ??= "entity";
    if (typeof badge.type !== "string" || !badge.type) fail("badge: type requis");
    return badge;
  });
}
export function normalizeConfig(input) {
  if (!object(input)) fail("configuration objet attendue");
  const config = clone(input);
  if (config.type !== "custom:flex-accordion-card") fail("type custom:flex-accordion-card attendu");
  config.layout ??= "unified";
  config.exclusive ??= false;
  config.animation ??= true;
  config.background ??= false;
  config.animation_duration ??= 750;
  if (!["unified", "separate"].includes(config.layout)) fail("layout: unified ou separate attendu");
  for (const key of ["exclusive", "animation", "background"]) if (typeof config[key] !== "boolean") fail(`${key}: booléen attendu`);
  integer(config.animation_duration, 0, 2000, "animation_duration");
  if (config.header !== undefined) {
    if (!object(config.header)) fail("header: objet attendu");
    config.header.enabled ??= true; config.header.title ??= ""; config.header.badges ??= [];
    if (typeof config.header.enabled !== "boolean" || typeof config.header.title !== "string") fail("header: enabled booléen et title texte attendus");
    if (config.header.icon !== undefined && typeof config.header.icon !== "string") fail("header.icon: texte attendu");
    if (typeof config.header.text_size === "string" && ["small", "medium", "large"].includes(config.header.text_size)) config.header.text_size = { small: 16, medium: 18, large: 20 }[config.header.text_size];
    if (config.header.text_size === null || config.header.text_size === "") delete config.header.text_size;
    if (config.header.text_size !== undefined && (typeof config.header.text_size !== "number" || !Number.isFinite(config.header.text_size) || config.header.text_size <= 0)) fail("header.text_size: nombre positif en px attendu");
    config.header.badges = normalizeBadges(config.header.badges);
  }
  if (!Array.isArray(config.sections)) fail("sections: liste attendue");
  const ids = new Set();
  config.sections = config.sections.map((section, index) => {
    if (!object(section)) fail(`section ${index + 1}: objet attendu`);
    section.id ??= `section-${index + 1}`;
    if (typeof section.id !== "string" || !section.id || ids.has(section.id)) fail("id de section vide ou dupliqué");
    ids.add(section.id);
    section.title ??= `Section ${index + 1}`;
    if (typeof section.title !== "string") fail("title: texte attendu");
    if (section.icon !== undefined && typeof section.icon !== "string") fail("icon: texte attendu");
    section.layout ??= "vertical";
    section.columns ??= 2;
    section.default_open ??= false;
    section.always_open ??= false;
    if (!["vertical", "grid"].includes(section.layout)) fail("layout de section: vertical ou grid attendu");
    integer(section.columns, 1, 12, "columns");
    if (typeof section.always_open !== "boolean") fail("always_open: booléen attendu");
    if (typeof section.default_open !== "boolean") fail("default_open: booléen attendu");
    section.cards ??= [];
    section.badges ??= [];
    if (!Array.isArray(section.cards) || !Array.isArray(section.badges)) fail("cards et badges: listes attendues");
    if (section.visibility !== undefined && !Array.isArray(section.visibility)) fail("visibility de section: liste de conditions HA attendue");
    section.cards.forEach((card) => { if (!object(card) || typeof card.type !== "string" || !card.type) fail("carte imbriquée: type requis"); });
    section.badges = normalizeBadges(section.badges);
    return section;
  });
  return config;
}
export function initialOpen(config, previous) {
  const result = new Set();
  for (const section of config.sections) {
    // Fixed sections are always rendered open, outside accordion state/exclusivity.
    if (section.always_open) continue;
    if (previous ? previous.has(section.id) : section.default_open) {
      result.add(section.id);
      if (config.exclusive) break;
    }
  }
  return result;
}
export function toggleOpen(open, id, exclusive) {
  const next = new Set(open);
  if (next.has(id)) next.delete(id);
  else { if (exclusive) next.clear(); next.add(id); }
  return next;
}
// Destination is an insertion slot in the original list (0..length).
export function moveItem(list, from, slot) {
  if (!Number.isInteger(from) || from < 0 || from >= list.length || !Number.isInteger(slot) || slot < 0 || slot > list.length) throw new RangeError("Déplacement hors limites");
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(slot > from ? slot - 1 : slot, 0, item);
  return next;
}
export function moveNested(config, kind, fromSection, fromIndex, toSection, slot) {
  if (!["cards", "badges"].includes(kind)) throw new RangeError("Type de déplacement inconnu");
  const next = clone(config);
  const source = next.sections[fromSection]?.[kind];
  const target = next.sections[toSection]?.[kind];
  if (!source || !target || !Number.isInteger(fromIndex) || fromIndex < 0 || fromIndex >= source.length || !Number.isInteger(slot) || slot < 0 || slot > target.length) throw new RangeError("Déplacement hors limites");
  if (fromSection === toSection) next.sections[fromSection][kind] = moveItem(source, fromIndex, slot);
  else { const [item] = source.splice(fromIndex, 1); target.splice(slot, 0, item); }
  return next;
}
export function copyNested(config, kind, fromSection, fromIndex, toSection) {
  if (!["cards", "badges"].includes(kind)) throw new RangeError("Type de copie inconnu");
  const item = config.sections[fromSection]?.[kind]?.[fromIndex];
  if (!Number.isInteger(fromIndex) || fromIndex < 0 || !item || !config.sections[toSection]?.[kind]) throw new RangeError("Copie hors limites");
  const next = clone(config); next.sections[toSection][kind].push(clone(item)); return next;
}
