# Content audit

## Baseline

- Audit date: 2026-08-08
- Game baseline: Vampire Survivors 1.15 — The Wet One
- Planner records: 719
- Registered content packs: 7
- Versioned assets: 147 (`v1.13`: 70, `v1.14`: 61, `v1.15`: 16)

The 1.15 scope follows the [official update announcement](https://store.steampowered.com/news/app/1794680/view/693137145499484494): The Lycaeum, Para Kooleo, Big Troubler, the Penshin Fatcha branch, Unearthly Bolt and Spirit Disturbance, and Darkanas 0, VIII, and XIX.

## Records by collection

| Collection | Records |
| --- | ---: |
| Characters | 207 |
| Weapons | 171 |
| Evolutions | 155 |
| Counterparts | 22 |
| Passives | 46 |
| Power-ups | 20 |
| Arcanas and Darkanas | 34 |
| Pickups | 26 |
| Structures | 5 |
| Stages | 33 |
| **Total** | **719** |

## Records by content pack

Records without a `contentPack` value are counted as base-game content.

| Scope | Records |
| --- | ---: |
| Base game and free updates | 271 |
| Legacy of the Moonspell | 22 |
| Tides of the Foscari | 27 |
| Emergency Meeting | 34 |
| Operation Guns | 38 |
| Ode to Castlevania | 250 |
| Emerald Diorama | 63 |
| Ante Chamber | 14 |
| **Total** | **719** |

## Source policy

Use sources in this order:

1. [Official Vampire Survivors wiki](https://vampire.survivors.wiki/) for public names, unlock context, and evolution descriptions.
2. [Official Steam announcements](https://store.steampowered.com/news/app/1794680) and [poncle news](https://poncle.games/news/) for release scope and patch timing.
3. An up-to-date installed client for exact relationship keys, requirements, and the artwork shipped with the game.

Community-maintained sources can help locate a topic but should not override current official or installed data.

## Modeling decisions

- Penshin Fatcha is represented as one selector weapon, six alternative forms, and Miracle of Multiplication as their combined secret evolution. Its in-game unique treasure-chest selection logic does not map directly to a conventional passive-item evolution.
- Character skins are not separate character records unless they change build-relevant starting equipment enough to be exposed as a distinct planner choice.
- Relics, achievements, enemies, bestiary entries, music, and interface-only unlocks are outside the planner model unless they directly participate in a build relationship.
- Legacy of the Bloodmoon is excluded because, at the audit date, its [Steam page](https://store.steampowered.com/app/4781330/Vampire_Survivors_Legacy_of_the_Bloodmoon/) still marks it as unreleased.

## Verification

Run:

```bash
npm test
npm run validate
git diff --check
```

The validator rejects duplicate IDs, unknown content packs, dangling item references, evolution cycles, missing icon selectors, broken local icon paths, and invalid inline JavaScript.

## Maintenance checklist

1. Confirm the latest released version and platform availability from official announcements.
2. Diff characters, weapons, evolution requirements, passives, Arcanas/Darkanas, pickups, and stages against the installed client.
3. Register any new content pack before assigning records to it.
4. Add data and artwork in the same change; prefer a versioned `img/vX.Y/` directory.
5. Update the totals and baseline in this document.
6. Run the full verification commands and audit every local CSS image reference.
