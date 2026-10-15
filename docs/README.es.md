# Flex Accordion Card — 0.7.0

[Français](../README.md) · [English](README.en.md) · Español · [Deutsch](README.de.md)

Contenedor de acordeón para tarjetas Lovelace de Home Assistant, con insignias nativas de vista y editor visual contextual. Primera publicación. El mantenedor ha confirmado pruebas correctas en Home Assistant y móvil. Las versiones HA/navegadores/dispositivos todavía no están registradas; no se garantiza compatibilidad universal ni una versión mínima. La distribución HACS sigue sin validar.

## Funciones

Secciones unificadas o separadas, cabecera y fondo globales opcionales, diseño vertical/cuadrícula, modo exclusivo y animaciones de altura con fundido. Editor contextual con arrastrar y soltar, traslado y copia entre secciones, incluida la duplicación en la sección actual. Condiciones de visibilidad nativas. Interfaz según el idioma del perfil HA (fr/en/es/de y variantes regionales), con inglés para otros idiomas. Los títulos y nombres del usuario se conservan.

## Instalación manual

1. Copia `dist/flex-accordion-card.js` en `<config>/www/flex-accordion-card.js`.
2. Añade `/local/flex-accordion-card.js?v=0.7.0` como recurso de tipo **módulo JavaScript** del panel. Si gestionas recursos en YAML, usa la configuración Lovelace existente.
3. Recarga completamente el navegador. Reinicia HA una vez si acabas de crear `www`.
4. Añade Flex Accordion Card o una tarjeta manual con este ejemplo. HA no necesita herramientas de compilación ni dependencias externas.

```yaml
type: custom:flex-accordion-card
layout: unified
header:
  title: Mi casa
  icon: mdi:home
sections:
  - id: salon
    title: Salón
    default_open: true
    cards:
      - type: markdown
        content: Bienvenido a casa
```

La transición predeterminada dura 750 ms. Una duración `animation_duration` ya configurada se conserva. La cabecera tiene un margen superior de 5 px. `header.text_size` permite un tamaño numérico en píxeles, por ejemplo `19.5`. Si se omite, se usan 16 px y el campo aparece vacío. Borrar el campo elimina la personalización. Los valores antiguos small/medium/large se convierten a 16/18/20 px.

Opciones globales: `layout` unified/separate, `background` false, `exclusive` false, `animation` true, `animation_duration` 750 (0–2000 ms), `header` opcional y lista `sections` obligatoria. Cabecera: `enabled`, `title`, `icon`, `text_size` numérico positivo opcional y `badges`. Sección: `id` estable, `title`, `icon`, `default_open`, `layout` vertical/grid, `columns` 1–12, `cards`, `badges` y `visibility` nativa de HA. Tarjetas e insignias usan sus esquemas HA habituales. Son insignias de vista, no las específicas de la tarjeta heading.

## Límites y pruebas

Se reutilizan componentes internos de HA que pueden cambiar. La visibilidad requiere contenedores nativos. Las tarjetas de terceros necesitan sus recursos; las cerradas siguen montadas. La cuadrícula interna no usa `grid_options` de las tarjetas ni reduce columnas automáticamente en móviles. Los editores nativos mantienen sus propios espacios. Algunos diagnósticos técnicos de configuración permanecen en francés.

53 pruebas locales superadas con componentes/DOM simulados y sin motor de renderizado. El mantenedor ha validado HA real y móvil; la suite de navegador automatizada sigue pendiente; todavía no se anuncia una versión mínima de HA. Desarrollo con Node.js 20+: `node scripts/build.mjs` y `node --test test/core.test.mjs test/editor.test.mjs`.

[Referencia completa en francés](../README.md) · [Validación HA](VALIDATION.md) · [Publicación](PUBLISHING.md) · [Contribuciones y traducciones](../CONTRIBUTING.md) · [Licencia MIT](../LICENSE)

Para probar HACS (procedimiento todavía sin validar), añade https://github.com/PedroDelCargo/flex-accordion-card como repositorio personalizado, categoría Dashboard. Revisa el recurso y elimina cualquier duplicado de la instalación manual. Todavía no figura en el catálogo predeterminado de HACS.

## Secciones siempre abiertas

Activa «Siempre abierta (sin cabecera)» o define `always_open: true`. El contenido permanece abierto fuera del modo exclusivo, sin cabecera, insignias ni chevrón. Los ajustes anteriores se conservan al volver al modo acordeón. Puedes añadir una tarjeta nativa `heading` y situar estas secciones al principio/final para una cabecera o pie permanente. Las condiciones de visibilidad HA siguen aplicándose; `default_open` se ignora en este modo. Consulta [el ejemplo](../examples/always-open.yaml).
