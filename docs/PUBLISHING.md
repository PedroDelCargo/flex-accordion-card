Attempting to perform the InitializeDefaultDrives operation on the 'FileSystem' provider failed.
# GitHub and Home Assistant Marketplace releases

Repository: https://github.com/PedroDelCargo/flex-accordion-card

## Release checklist

1. Update the version in `package.json` and `src/core.js`, then update the changelog and release notes.
2. Review the English, French, Spanish and German installation guides and update any versioned manual resource URLs.
3. Build the distributable JavaScript and run the project checks. Complete the real Home Assistant validation checklist in [VALIDATION.md](VALIDATION.md).
4. Update `SHA256SUMS.txt` for the final bundle when it is included in the release.
5. Create a GitHub release with migration notes, known limitations and only the Home Assistant versions actually tested. Attach the built `flex-accordion-card.js`; the project ZIP is not the installable module.
6. Verify the release asset downloads and installs correctly.

## Home Assistant Marketplace

Flex Accordion Card is listed in the default Home Assistant Marketplace catalog. Users can find it by searching for **Flex Accordion Card** in Home Assistant **Settings → Marketplace**. The Marketplace handles dashboard resource registration for UI-managed resources. YAML-managed resources must be declared in YAML; see the installation instructions in the README.

The repository contains a technical catalog manifest used by the Marketplace. Keep its required filename and fields unchanged unless the catalog specification changes. The built module and translations are bundled in `dist/`; users do not need to load separate language files.

After a GitHub release, catalog generation and Marketplace synchronization are periodic, so a new version may take several hours to appear. Check the [Marketplace release guide](https://contributors.home-assistant.io/marketplace/guides/releases/) and [Home Assistant Marketplace documentation](https://www.home-assistant.io/integrations/marketplace) if release or resource behavior changes.
