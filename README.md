# VS Build Planner

A static build planner for [Vampire Survivors](https://store.steampowered.com/app/1794680/Vampire_Survivors/). It links characters, weapons, evolutions, passive items, Arcana and Darkana effects, pickups, and stages while allowing optional content packs to be filtered.

## Content status

The catalog is current through **Vampire Survivors 1.15 — The Wet One** and was audited on **2026-08-08**. It contains 719 planner records across the base game and these content packs:

- Legacy of the Moonspell
- Tides of the Foscari
- Emergency Meeting
- Operation Guns
- Ode to Castlevania
- Emerald Diorama
- Ante Chamber

See [the content audit](docs/content-audit.md) for collection totals, source policy, modeling decisions, and known exclusions.

## Run locally

The planner has no build step. Serve the repository with any static web server, for example:

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080>.

## Validate changes

```bash
npm test
npm run validate
```

Validation checks IDs, content-pack references, item relationships, evolution cycles, icon selectors, local image paths, and inline JavaScript syntax.

## Repository layout

- `data.js`: planner content and relationships.
- `icons.css`: icon selectors and image references.
- `img/`: character, stage, and versioned content assets.
- `scripts/validate-data.js`: content validator.
- `test/`: regression tests for validation rules.
- `docs/content-audit.md`: current coverage baseline and maintenance checklist.

## Updating the catalog

Use the [official wiki](https://vampire.survivors.wiki/) and [official Steam announcements](https://store.steampowered.com/news/app/1794680) to determine public release scope. Verify exact evolution requirements, internal names, and artwork against an up-to-date installed client. Add stable planner IDs, relationships, and icon assets together, then run both validation commands before opening a pull request.
