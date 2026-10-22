# Flex Accordion Card

[English](../README.md) · [Français](README.fr.md) · Español · [Deutsch](README.de.md)

Un contenedor de acordeón para paneles de Home Assistant, con tarjetas Lovelace anidadas, insignias nativas y un editor visual contextual.

![Tarjetas de indicador nativas en una sección de acordeón abierta](images/accordion-toner.png)

[Ver la demostración — MP4, 11 s](media/accordion-demo.mp4) · [Más capturas](SHOWCASE.md)

## Funciones

- Tarjeta unificada o tarjetas separadas por sección, con fondo global opcional.
- Cabecera global opcional con título, icono, insignias y tamaño de título ajustable.
- Cabeceras de sección pulsables con iconos e insignias antes de la flecha.
- Tarjetas Lovelace nativas y personalizadas con ancho y alto individuales en la cuadrícula nativa Secciones.
- Modo exclusivo, secciones siempre abiertas, animaciones de altura y fundido y respeto del movimiento reducido.
- Editor contextual con navegación persistente, arrastrar y soltar, botones de ordenación, movimiento y copia.
- Insignias nativas de Entidad y Acceso directo con vista previa, acciones y opciones de apariencia individuales.
- Condiciones de visibilidad de Home Assistant para secciones, insignias y tarjetas anidadas.
- Interfaz en inglés, francés, español y alemán según el idioma del perfil de Home Assistant.

## Instalación

### HACS (repositorio personalizado)

La tarjeta está disponible como repositorio personalizado mientras se tramita su inclusión en el catálogo predeterminado. En HACS, abre el menú ⋮ → Repositorios personalizados, añade `https://github.com/PedroDelCargo/flex-accordion-card` con categoría **Dashboard** y descarga Flex Accordion Card. Cuando los recursos se gestionan desde la interfaz de Home Assistant, HACS normalmente registra el módulo automáticamente. Conserva solo el recurso HACS (`/hacsfiles/flex-accordion-card/flex-accordion-card.js` con su sufijo de versión) y elimina los antiguos recursos manuales/de prueba de esta tarjeta. Los recursos gestionados en YAML deben declararse manualmente. Recarga completamente el navegador.

### Instalación manual

1. Descarga **flex-accordion-card.js** desde la [última versión de GitHub](https://github.com/PedroDelCargo/flex-accordion-card/releases/latest).
2. Cópialo a `<config>/www/flex-accordion-card.js` en Home Assistant. Crea `www` si es necesario y reinicia Home Assistant una vez después de crearlo.
3. En los recursos del panel, añade `/local/flex-accordion-card.js?v=0.13.0` como **módulo JavaScript**. Activa el modo avanzado del perfil si el menú de recursos está oculto.
4. Recarga completamente el navegador y añade **Flex Accordion Card** al panel. También puedes elegir la tarjeta nativa **Manual** y pegar el ejemplo YAML siguiente.

Si gestionas los recursos en YAML, añade el recurso a la configuración existente:

```yaml
lovelace:
  resources:
    - url: /local/flex-accordion-card.js?v=0.13.0
      type: module
```

Para actualizar, sustituye el archivo JavaScript, cambia el sufijo `?v=` y recarga el navegador. Registra el recurso una sola vez. Para desinstalar, elimina las tarjetas, el recurso y el archivo JavaScript.

## Uso del editor visual

Empieza por los **Ajustes generales** para elegir disposición, fondo, modo exclusivo y animaciones. Configura la cabecera global opcional y añade las secciones.

Abre una sección para gestionar su cabecera, insignias, tarjetas y visibilidad. El lápiz abre cada elemento en su propia página; la navegación superior permite volver al nivel anterior. Usa los tiradores o flechas para ordenar. Los botones de mover y copiar ofrecen una sección de destino; copiar también incluye la **Sección actual**.

Al añadir una insignia, elige **Entidad** o **Acceso directo**. Las insignias de entidad necesitan una entidad; los accesos directos usan texto, icono y acciones sin entidad. Configura **Contenido**, **Interacciones** y **Visibilidad**, comprueba la vista previa y pulsa **Añadir insignia**. En Contenido, **Ocultar borde** y **Fondo transparente** son independientes para cada insignia, incluidas las de la cabecera global.

Usa **Editor de código** / **Editor visual** para cambiar de modo. Para añadir una tarjeta desde su configuración, elige **Manual**, introduce el YAML y pulsa **Añadir tarjeta**. Si falta el editor YAML nativo, se ofrece un editor JSON identificado como tal.

Activa **Siempre abierta** para mantener una sección desplegada sin cabecera, insignias ni flecha. Colócala al principio o al final para crear una cabecera o pie permanente dentro de la tarjeta. Puedes incluir una tarjeta nativa de encabezado. Las condiciones de visibilidad siguen aplicándose.

## Configuración YAML

```yaml
type: custom:flex-accordion-card
layout: unified
exclusive: true
header:
  title: Home
  icon: mdi:home
sections:
  - id: living-room
    title: Living room
    icon: mdi:sofa
    default_open: true
    layout: sections
    cards:
      - type: button
        entity: light.living_room
      - type: markdown
        content: Welcome home
    badges:
      - type: entity
        entity: sensor.living_room_temperature
        show_name: true
        show_state: true
        hide_border: true
      - type: shortcut
        text: Home
        icon: mdi:home
        transparent_background: true
        tap_action:
          action: navigate
          navigation_path: /lovelace/home
  - id: footer
    layout: sections
    always_open: true
    cards:
      - type: markdown
        content: Home sweet home
```

Sustituye los identificadores de entidad y la ruta por los tuyos. Más ejemplos: [inicio](../examples/starter.yaml), [secciones siempre abiertas](../examples/always-open.yaml).

## Referencia de configuración

### Opciones globales

| Opción | Predeterminado | Descripción |
| --- | --- | --- |
| `type` | obligatorio | Obligatorio; `custom:flex-accordion-card` |
| `layout` | `unified` | `unified` o `separate` |
| `background` | `false` | Fondo y espacio alrededor de todas las secciones |
| `exclusive` | `false` | Como máximo una sección de acordeón abierta; todas pueden cerrarse |
| `animation` | `true` | Animaciones de altura y fundido |
| `animation_duration` | `750` | Duración en milisegundos, entero de 0 a 2000 |
| `header` | ninguno | Cabecera global opcional |
| `sections` | obligatorio | Lista de secciones; puede estar vacía |

### Cabecera global: `header`

| Opción | Predeterminado | Descripción |
| --- | --- | --- |
| `enabled` | `true` | Mostrar la cabecera; desactivarla conserva los ajustes |
| `title` | texto vacío | Título de cabecera |
| `icon` | ninguno | Icono de Home Assistant |
| `text_size` | `16` | Número positivo de píxeles; campo vacío utiliza 16 px |
| `badges` | `[]` | Configuraciones de insignias nativas de vista |

### Cada entrada de `sections`

| Opción | Predeterminado | Descripción |
| --- | --- | --- |
| `id` | `section-N` | Identificador único; usa identificadores estables en YAML |
| `title` | `Section N` | Título de sección |
| `icon` | ninguno | Icono de Home Assistant |
| `always_open` | `false` | Siempre desplegada, sin cabecera ni insignias; independiente del modo exclusivo |
| `default_open` | `false` | Estado inicial; se ignora en secciones siempre abiertas |
| `layout` | `sections` | `sections` |
| `cards` | `[]` | Configuraciones de tarjetas Lovelace |
| `badges` | `[]` | Configuraciones de insignias nativas de vista |
| `visibility` | ninguno | Condiciones de Home Assistant para toda la sección |

### Apariencia de las insignias

| Opción | Predeterminado | Descripción |
| --- | --- | --- |
| `hide_border` | `false` | Eliminar el borde y la sombra decorativa de la insignia |
| `transparent_background` | `false` | Fondo transparente sin desenfoque ni sombra decorativa |

Los demás ajustes de tarjetas e insignias usan sus opciones habituales de Home Assistant. También se pueden indicar entidades como cadenas en `badges`. Las insignias de acceso directo requieren un frontend de Home Assistant que admita la insignia nativa correspondiente. El editor avisa si no está disponible.

## Notas de uso

- Las secciones siempre abiertas permanecen en el flujo normal de la página; no se fijan a la pantalla. Sus ajustes de cabecera e insignias se conservan para volver al acordeón.
- En modo exclusivo tiene prioridad la primera sección abierta al cargar. El estado abierto/cerrado se conserva mientras la tarjeta está montada, pero no después de recargar la página.
- Las insignias no pliegan la sección. Las acciones explícitas tienen prioridad. Sin acción explícita, las insignias de entidad y tarjetas Botón usan acciones adecuadas para los dominios controlables habituales, botones, escenas y scripts; los sensores abren más información.
- La visibilidad usa condiciones nativas de Home Assistant. La tarjeta global admite los controles de visibilidad del panel. Se usan insignias nativas de vista, distintas de las específicas de la tarjeta de encabezado.
- Las tarjetas personalizadas requieren sus propios recursos. Las secciones cerradas mantienen las tarjetas activas. El tamaño de las tarjetas sigue el comportamiento nativo Secciones.
- Los editores e insignias nativos disponibles dependen de la versión del frontend de Home Assistant. Las insignias de terceros pueden ignorar las opciones de apariencia. Los nombres y textos del usuario no se traducen; los componentes nativos usan las traducciones de Home Assistant.

[MIT License](../LICENSE)

## Disposición Secciones y actualización

Todas las secciones usan la cuadrícula nativa de Home Assistant de 12 columnas. Ajusta el ancho y alto de cada tarjeta en su pestaña nativa Disposición, si está disponible, o con `grid_options` en código. Usa los tiradores de lista, flechas y botones de mover/copiar para ordenar. No se activan el arrastre directo ni los tiradores de tamaño del panel nativo dentro del acordeón.

**Después de actualizar desde Vertical o Cuadrícula, comprueba el ancho, alto y posición de las tarjetas en ordenador y móvil.** La conversión es automática. Vertical pasa a tarjetas de ancho completo y altura automática. Cuadrícula distribuye cada fila anterior entre las 12 columnas nativas; si el número de columnas no divide 12, los anchos vecinos difieren en una unidad (cinco tarjetas: 3, 3, 2, 2, 2). La última fila incompleta conserva esos anchos. Los `grid_options` explícitos tienen prioridad. Se elimina la antigua opción `columns` de sección.

Las tarjetas convertidas y su editor muestran un aviso. Tras comprobar el resultado, pulsa **Disposición verificada** en el editor y guarda la tarjeta para conservar la conversión y retirar el aviso. Las secciones nuevas creadas en el editor visual no muestran este aviso.

El frontend debe haber cargado los componentes nativos de sección. Si no están disponibles, abre una vista Secciones nativa de HA, vuelve y pulsa Reintentar. No se integra la vista Secciones completa del panel.
