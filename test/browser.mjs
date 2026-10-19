import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";
import { demoServer } from "../scripts/serve.mjs";
const { chromium } = createRequire(import.meta.url)("playwright");
const server = demoServer(); await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
let browser; const results = [];
try {
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
  const page = await browser.newPage({ viewport: { width: 1240, height: 1400 } });
  const errors = []; page.on("pageerror", (error) => errors.push(error.message));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const reset = async () => { await page.goto(url); await page.waitForFunction(() => window.demoReady && window.editor._ready); };
  const check = async (name, fn) => { await fn(); results.push(name); console.log(`PASS ${name}`); };
  const openSection = async (name = "Salon") => page.getByRole("button", { name: `Ouvrir la section ${name}`, exact: true }).click();
  const expand = async (kind) => { const group = page.locator(`#editor .group[data-kind="${kind}"]`); if (!(await group.evaluate((node) => node.open))) await group.locator("summary").first().click(); };
  const list = (kind) => page.locator(`#editor .list[data-kind="${kind}"]`);
  const editBadge = async () => { await openSection(); await expand("badges"); await list("badges").getByRole("button", { name: "Modifier le badge", exact: true }).first().click(); await page.waitForSelector("#editor mock-config-editor"); };
  await reset();
  await check("Badges avant chevron SVG épais ; grille initiale", async () => {
    assert.deepEqual(await page.evaluate(() => [...card._open]), ["living"]);
    assert.equal(await page.locator("#card .cards.sections").count(), 2);
    assert.deepEqual(await page.locator("#card .header").first().evaluate((node) => [...node.children].map((child) => child.className)), ["toggle", "badges", "chevron"]);
    assert.equal(await page.locator("#card .chevron svg").first().getAttribute("stroke-width"), "2.3");
    const boxes = await page.locator("#card .header").first().evaluate((node) => { const a = node.querySelector(".badges").getBoundingClientRect(), b = node.querySelector(".chevron").getBoundingClientRect(); return a.right <= b.left; }); assert.equal(boxes, true);
  });
  await check("Actions des badges et cartes indépendantes de l’accordéon", async () => {
    await page.locator("#card .badges mock-badge button").first().click();
    await page.locator("#card .cards mock-card button").first().click();
    assert.equal(await page.evaluate(() => badgeClicks), 1); assert.equal(await page.evaluate(() => childClicks), 1);
    assert.deepEqual(await page.evaluate(() => [...card._open]), ["living"]);
  });
  await check("Chevrons cliquables et instances enfants conservées", async () => {
    await page.evaluate(() => window.originalChild = card.shadowRoot.querySelector("mock-card"));
    await page.locator("#card .chevron").first().click({ force: true });
    assert.equal(await page.evaluate(() => card.shadowRoot.querySelector(".panel").inert), true);
    await page.getByRole("button", { name: "Salon", exact: true }).click();
    assert.equal(await page.evaluate(() => originalChild === card.shadowRoot.querySelector("mock-card")), true);
  });
  await check("Clavier, exclusivité et propagation hass sans reconstruction", async () => {
    await page.getByRole("button", { name: "Énergie", exact: true }).focus(); await page.keyboard.press("Space");
    assert.deepEqual(await page.evaluate(() => [...card._open]), ["energy"]);
    assert.equal(await page.getByRole("button", { name: "Salon", exact: true }).getAttribute("aria-expanded"), "false");
    await page.keyboard.press("Enter"); assert.equal(await page.evaluate(() => card._open.size), 0);
    assert.equal(await page.evaluate(() => { const child = card.shadowRoot.querySelector("mock-card"); card.hass = { states: {} }; return child === card.shadowRoot.querySelector("mock-card"); }), true);
  });
  await check("Vue d’ensemble compacte, accordéons et bordures renforcées", async () => {
    assert.equal(await page.locator("#editor .overview-page").count(), 1);
    assert.equal(await page.locator("#editor .list").count(), 0);
    assert.equal(await page.locator('#editor .group[data-group="global"]').evaluate((node) => node.open), true);
    assert.equal(await page.locator('#editor .nav-header').evaluate((node) => getComputedStyle(node).position), "sticky");
    assert.equal(await page.locator("#editor .section-editor").first().evaluate((node) => getComputedStyle(node).borderTopWidth), "2px");
    await openSection();
    assert.equal(await page.locator("#editor .group[data-kind]").count(), 4);
    assert.equal(await page.locator('#editor .group[data-kind="header"]').evaluate((node) => node.open), true);
    assert.equal(await page.locator('#editor .group[data-kind="badges"]').evaluate((node) => node.open), false);
  });
  await check("Crayons accessibles et page dédiée avec retour contextuel", async () => {
    await expand("badges"); const pencil = list("badges").getByRole("button", { name: "Modifier le badge", exact: true });
    assert.equal(await pencil.innerText(), ""); assert.equal(await pencil.locator("svg").count(), 1);
    await pencil.click(); await page.waitForSelector("#editor mock-config-editor");
    assert.equal(await page.locator("#editor .list").count(), 0); assert.equal(await page.locator("#editor .item-page").count(), 1);
    await page.getByRole("button", { name: "Retour à la section Salon", exact: true }).click();
    assert.equal(await page.locator('#editor .group[data-kind="badges"]').evaluate((node) => node.open), true);
    assert.equal(await page.locator("#editor .section-page").count(), 1);
  });
  await reset();
  await check("Régression : nom et réglages survivent à la saisie et aux rafraîchissements", async () => {
    await editBadge();
    await page.evaluate(() => { window.activeNative = editor.shadowRoot.querySelector("mock-config-editor"); window.tick = setInterval(() => { editor.hass = { ...editor.hass }; editor.setConfig(JSON.parse(JSON.stringify(editor._config))); }, 40); });
    const name = page.getByRole("textbox", { name: "Nom personnalisé", exact: true });
    await name.fill(""); await name.pressSequentially("Mon badge du salon", { delay: 35 });
    await page.waitForTimeout(1400);
    assert.equal(await name.inputValue(), "Mon badge du salon"); assert.equal(await name.evaluate((node) => node === node.getRootNode().activeElement), true);
    assert.equal(await page.evaluate(() => editor.shadowRoot.querySelector("mock-config-editor") === activeNative), true);
    await page.getByRole("checkbox", { name: "Afficher le nom", exact: true }).check();
    await page.getByRole("checkbox", { name: "Afficher l’état", exact: true }).uncheck();
    await page.getByRole("textbox", { name: "Couleur", exact: true }).fill("green");
    await page.waitForTimeout(1100); await page.evaluate(() => clearInterval(tick));
    const saved = await page.evaluate(() => savedConfig.sections[0].badges[0]);
    assert.equal(saved.name, "Mon badge du salon"); assert.equal(saved.show_name, true); assert.equal(saved.show_state, false); assert.equal(saved.color, "green");
    assert.equal(await page.getByRole("checkbox", { name: "Afficher le nom", exact: true }).isChecked(), true);
    assert.equal(await name.inputValue(), saved.name);
  });
  await check("JSON actualisé et suppression volontaire d’un nom conservée", async () => {
    await page.locator("#editor .manual summary").click();
    const textarea = page.locator("#editor .manual textarea");
    assert.match(await textarea.inputValue(), /Mon badge du salon/);
    const config = JSON.parse(await textarea.inputValue()); delete config.name;
    await textarea.fill(JSON.stringify(config)); await page.getByRole("button", { name: "Appliquer JSON", exact: true }).click();
    assert.equal(await page.evaluate(() => Object.hasOwn(savedConfig.sections[0].badges[0], "name")), false);
    assert.equal(await page.getByRole("textbox", { name: "Nom personnalisé", exact: true }).inputValue(), "");
    await textarea.fill('{"bad":true}'); await page.getByRole("button", { name: "Appliquer JSON", exact: true }).click();
    assert.match(await page.locator("#editor .manual .error").innerText(), /type requis/);
  });
  await reset();
  await check("Friendly names et mise à jour des libellés sans reconstruire", async () => {
    await page.evaluate(() => { const updated = JSON.parse(JSON.stringify(config)); delete updated.sections[0].badges[0].name; delete updated.sections[0].cards[1].title; editor.setConfig(updated); });
    await openSection(); await expand("badges"); await expand("cards");
    assert.match(await list("badges").innerText(), /Température du salon/); assert.match(await list("cards").innerText(), /Lampe du salon/);
    await page.evaluate(() => editor.hass = { ...editor.hass, states: { ...editor.hass.states, "sensor.temperature": { attributes: { friendly_name: "Nouveau nom HA" } } } });
    assert.match(await list("badges").innerText(), /Nouveau nom HA/);
  });
  await reset();
  await check("Drag and drop de sections et commandes alternatives", async () => {
    await page.locator("#editor .section-head .drag").nth(1).dragTo(page.locator("#editor .section-head").first());
    assert.deepEqual(await page.evaluate(() => savedConfig.sections.map((s) => s.id)), ["energy", "living"]);
    await page.locator("#editor .section-editor").first().getByRole("button", { name: "Descendre la section", exact: true }).click();
    assert.deepEqual(await page.evaluate(() => savedConfig.sections.map((s) => s.id)), ["living", "energy"]);
  });
  await openSection(); await expand("cards");
  await check("DnD de cartes dans la liste de la section", async () => {
    await list("cards").locator(".drag").first().dragTo(list("cards").locator(".dropzone"));
    assert.equal(await page.evaluate(() => savedConfig.sections[0].cards[0].type), "tile");
  });
  await check("DnD vers une autre section depuis la page contextuelle", async () => {
    await list("cards").getByRole("button", { name: "Déplacer dans une autre section", exact: true }).first().click();
    await list("cards").locator(".drag").first().dragTo(page.locator('#editor .transfer-options [data-destination="energy"]'));
    assert.deepEqual(await page.evaluate(() => savedConfig.sections.map((s) => s.cards.length)), [1, 2]);
  });
  await expand("badges");
  await check("Copie puis transfert de badge et état des accordéons conservé", async () => {
    await list("badges").getByRole("button", { name: "Copier dans une section", exact: true }).first().click();
    await page.locator('#editor .transfer-options [data-destination="energy"]').click();
    assert.deepEqual(await page.evaluate(() => savedConfig.sections.map((s) => s.badges.length)), [1, 2]);
    await list("badges").getByRole("button", { name: "Déplacer dans une autre section", exact: true }).first().click();
    await page.locator('#editor .transfer-options [data-destination="energy"]').click();
    assert.deepEqual(await page.evaluate(() => savedConfig.sections.map((s) => s.badges.length)), [0, 3]);
    assert.equal(await page.locator('#editor .group[data-kind="badges"]').evaluate((node) => node.open), true);
  });
  await check("Ajout/suppression de sections et navigation", async () => {
    await page.getByRole("button", { name: "Retour à toutes les sections", exact: true }).click();
    await page.getByRole("button", { name: "+ Section", exact: true }).click();
    assert.equal(await page.locator("#editor .section-page").count(), 1); assert.equal(await page.evaluate(() => savedConfig.sections.length), 3);
    await page.getByRole("button", { name: "Retour à toutes les sections", exact: true }).click();
    await page.locator("#editor .section-editor").last().getByRole("button", { name: "Supprimer la section", exact: true }).click();
    assert.equal(await page.evaluate(() => savedConfig.sections.length), 2);
  });
  await reset();
  await check("Ajout visuel d’un badge : page dédiée et retour à la bonne liste", async () => {
    await openSection(); await expand("badges"); await page.getByRole("button", { name: "+ Badge", exact: true }).click();
    await page.locator('#editor input[data-field="entity"]').fill("light.salon"); await page.getByRole("button", { name: "Ajouter le badge", exact: true }).click();
    await page.waitForSelector("#editor mock-config-editor");
    assert.equal(await page.evaluate(() => editor._active.node.config.tap_action.action), "toggle");
    assert.equal(await page.evaluate(() => Object.hasOwn(savedConfig.sections[0].badges[1], "tap_action")), false);
    assert.equal(await page.locator("#editor .context-title").innerText(), "Carte · Lampe du salon");
    await page.getByRole("button", { name: "Retour à la section Salon", exact: true }).click();
    assert.equal(await list("badges").locator(".row").count(), 2);
  });
  await reset();
  await check("Deux layouts, animations désactivées et actions adaptées non destructives", async () => {
    const values = await page.evaluate(async () => {
      const next = { type: "custom:flex-accordion-card", layout: "separate", animation: false, sections: [{ id: "test", default_open: true, cards: [{ type: "button", entity: "light.salon" }, { type: "button", entity: "light.salon", tap_action: { action: "none" } }], badges: [{ type: "entity", entity: "light.salon" }, { type: "entity", entity: "sensor.temperature" }] }] };
      card.setConfig(next); await card.updateComplete;
      return [card.shadowRoot.querySelector(".root").className, card.shadowRoot.querySelector(".root").style.getPropertyValue("--fac-duration"), ...[...card.shadowRoot.querySelectorAll("mock-card")].map((node) => node.config.tap_action?.action), ...[...card.shadowRoot.querySelectorAll("mock-badge")].map((node) => node.config.tap_action?.action || "native-more-info"), next.sections[0].cards[0].tap_action];
    }); assert.deepEqual(values, ["root separate", "0ms", "toggle", "none", "toggle", "native-more-info", undefined]);
  });
  await reset();
  await check("Chargements concurrents et reprise après erreur", async () => {
    assert.equal(await page.evaluate(async () => {
      const original = window.loadCardHelpers; const helpers = await original(); const pending = [];
      window.loadCardHelpers = () => new Promise((resolve) => pending.push(resolve));
      card.setConfig({ type: "custom:flex-accordion-card", sections: [{ id: "old", cards: [{ type: "markdown", title: "old" }] }] });
      card.setConfig({ type: "custom:flex-accordion-card", sections: [{ id: "new", cards: [{ type: "markdown", title: "new" }] }] });
      pending[1](helpers); await card.updateComplete; pending[0](helpers); await new Promise((r) => setTimeout(r, 10)); window.loadCardHelpers = original;
      return card.shadowRoot.querySelector("mock-card").config.title;
    }), "new");
    await page.evaluate(async () => { window.originalHelpers = window.loadCardHelpers; window.loadCardHelpers = async () => { throw new Error("Offline test"); }; card.setConfig(config); await card.updateComplete; });
    assert.match(await page.locator("#card .load-error").innerText(), /Offline test/);
    await page.evaluate(() => window.loadCardHelpers = originalHelpers); await page.getByRole("button", { name: "Réessayer", exact: true }).click(); await page.waitForSelector("#card mock-card", { state: "attached" });
  });
  await check("Visibilité conditionnelle refusée sans wrapper natif", async () => {
    await page.evaluate(async () => { card.setConfig({ type: "custom:flex-accordion-card", sections: [{ cards: [], badges: [{ type: "entity", entity: "sensor.a", visibility: [] }] }] }); await card.updateComplete; });
    assert.match(await page.locator("#card .badges .error").innerText(), /conditions de visibilité/);
  });
  await reset();
  await check("Wrapper natif : configuration renvoyée sans recréer le formulaire", async () => {
    await page.evaluate(() => {
      const Base = customElements.get("mock-config-editor");
      class NativeWrapper extends Base { set value(config) { this.setConfig(config); queueMicrotask(() => this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this.config }, bubbles: true, composed: true }))); } get value() { return this.config; } }
      customElements.define("hui-badge-element-editor", NativeWrapper);
    });
    await openSection(); await expand("badges"); await list("badges").getByRole("button", { name: "Modifier le badge", exact: true }).click();
    const name = page.getByRole("textbox", { name: "Nom personnalisé", exact: true }); await name.fill("Badge via wrapper");
    await page.getByRole("checkbox", { name: "Afficher le nom", exact: true }).check();
    await page.evaluate(() => editor.hass = { ...editor.hass });
    assert.equal(await name.inputValue(), "Badge via wrapper"); assert.equal(await page.evaluate(() => savedConfig.sections[0].badges[0].show_name), true);
  });
  await reset();
  await check("Formulaire et catalogue natifs, événements englobants et valeurs contrôlées", async () => {
    assert.deepEqual(await page.evaluate(async () => {
      customElements.define("ha-form", class extends HTMLElement {}); customElements.define("hui-card-picker", class extends HTMLElement {}); customElements.define("hui-card-element-editor", class extends HTMLElement {});
      editor._render(); const form = editor.shadowRoot.querySelector("ha-form");
      form.dispatchEvent(new CustomEvent("value-changed", { detail: { value: { layout: "separate" } }, bubbles: true, composed: true }));
      const formReturned = form.data.layout;
      editor._select({ kind: "cards", s: 0, i: null }); const picker = editor.shadowRoot.querySelector("hui-card-picker");
      const hasLovelace = Array.isArray(picker.lovelace.views);
      picker.dispatchEvent(new CustomEvent("config-changed", { detail: { config: { type: "button", entity: "light.salon" } }, bubbles: true, composed: true }));
      const native = editor.shadowRoot.querySelector("hui-card-element-editor"); const action = native.value.tap_action.action;
      native.dispatchEvent(new CustomEvent("config-changed", { detail: { config: { ...native.value, name: "Bouton modifié" } }, bubbles: true, composed: true }));
      return [formReturned, savedConfig.layout, hasLovelace, action, native.value.name, savedConfig.type];
    }), ["separate", "separate", true, "toggle", "Bouton modifié", "custom:flex-accordion-card"]);
  });
  await reset();
  await check("Import tardif de l’éditeur HA sans interrompre la saisie", async () => {
    await editBadge();
    const result = await page.evaluate(async () => {
      const original = editor.shadowRoot.querySelector("mock-config-editor"); editor._ready = false; const stack = customElements.get("hui-vertical-stack-card"); const old = stack.getConfigElement;
      let resolve; stack.getConfigElement = () => new Promise((r) => resolve = r); const initializing = editor._initialize();
      await new Promise((r) => setTimeout(r, 20)); resolve(document.createElement("mock-config-editor")); await initializing; stack.getConfigElement = old;
      return original === editor.shadowRoot.querySelector("mock-config-editor");
    }); assert.equal(result, true);
  });
  await reset();
  await check("Mobile : vue d’ensemble, section et édition sans débordement", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    assert.equal(await fits(), true); await openSection(); await expand("badges"); await expand("cards"); assert.equal(await fits(), true);
    await list("badges").getByRole("button", { name: "Modifier le badge", exact: true }).click(); await page.waitForSelector("#editor mock-config-editor"); assert.equal(await fits(), true);
    await page.emulateMedia({ reducedMotion: "reduce" }); assert.equal(await page.evaluate(() => getComputedStyle(card.shadowRoot.querySelector(".panel")).transitionDuration), "0s");
  });
  await mkdir(new URL("results/", import.meta.url), { recursive: true });
  await page.screenshot({ path: fileURLToPath(new URL("results/demo-mobile.png", import.meta.url)), fullPage: true });
  await page.setViewportSize({ width: 1240, height: 1100 }); await reset(); await openSection(); await expand("badges"); await expand("cards");
  await page.screenshot({ path: fileURLToPath(new URL("results/demo-desktop.png", import.meta.url)), fullPage: true });
  await list("badges").getByRole("button", { name: "Modifier le badge", exact: true }).click(); await page.waitForSelector("#editor mock-config-editor");
  await page.screenshot({ path: fileURLToPath(new URL("results/demo-edit-badge.png", import.meta.url)), fullPage: true });
  assert.deepEqual(errors, []);
  await writeFile(new URL("results/browser-report.json", import.meta.url), JSON.stringify({ version: "0.11.0", simulatedHA: true, count: results.length, passed: results, pageErrors: errors }, null, 2));
  console.log(`${results.length} contrôles navigateur réussis (composants HA simulés).`);
} finally { await browser?.close(); await new Promise((resolve) => server.close(resolve)); }
