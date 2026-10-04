# Content audit

## Baseline

- Audit date: 2026-10-04
- Game baseline: Vampire Survivors 1.16.107 (Steam build 25016043)
- Planner records: 774
- Registered content packs: 8
- Evolution-audit assets: 6 (`img/evolution-audit/`)
- Versioned assets: 196 (`v1.13`: 70, `v1.14`: 61, `v1.15`: 16, `v1.16`: 49)

The 1.15 scope follows the [official update announcement](https://store.steampowered.com/news/app/1794680/view/693137145499484494): The Lycaeum, Para Kooleo, Big Troubler, the Penshin Fatcha branch, Unearthly Bolt and Spirit Disturbance, and Darkanas 0, VIII, and XIX.

The 1.16 scope follows the [official release and hotfix announcements](https://steamcommunity.com/app/1794680/announcements/?l=english). New records, localized English names and descriptions, evolution requirements, starting equipment, Arcana lists, and sprites were verified against the locally installed 1.16.107 client. [The source map](content-1.16-sources.json) records client data keys and sprite names for all 49 additions; raw game data is not included in the repository.

## Records by collection

| Collection | Records |
| --- | ---: |
| Characters | 229 |
| Weapons | 185 |
| Evolutions | 170 |
| Counterparts | 22 |
| Passives | 48 |
| Power-ups | 20 |
| Arcanas and Darkanas | 34 |
| Pickups | 27 |
| Structures | 5 |
| Stages | 34 |
| **Total** | **774** |

## Records by content pack

Records without a `contentPack` value are counted as base-game content.

| Scope | Records |
| --- | ---: |
| Base game and free updates | 277 |
| Legacy of the Moonspell | 35 |
| Tides of the Foscari | 27 |
| Emergency Meeting | 34 |
| Operation Guns | 38 |
| Ode to Castlevania | 250 |
| Emerald Diorama | 63 |
| Ante Chamber | 14 |
| Legacy of the Bloodmoon | 36 |
| **Total** | **774** |

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
- Bloodmoon contributes 12 characters, 19 weapons/evolutions/passives, Red Moon Manor, and the Blood pickup. Three additional character records expose Sargon's alternate starting weapons and Jaman Jato's Prestige V starting Duplicator.
- Moonspell adds Megalo Miang, Spiritoso, Spiritosa, Gekkojin, three lunar weapons, LunarFlight, Argent Flow, and Pearl Magatama. Three additional character records expose Gekkojin's alternate starting weapons and Gav'Et-Oni's Prestige V starting Spellbinder. Earlier Prestige ranks share starting equipment and remain folded into the base character.
- Gift weapons Pearl Magatama and Velvet Dodecahedron are modeled as passives, following the client's `isPowerUp` flag. Internal Bloodmoon skill weapons (Blood Hex, Baal's LastBreath, summoned skeletons) are abilities rather than selectable weapons and are excluded.
- `maxLevelItemIds` records which evolution ingredients must be maxed, and is displayed in tooltips. Selecting a recipe still expresses the intended build; the planner does not simulate current levels, chests, unlocks, or runtime triggers.
- Road to Heaven requires both Moonspell and Bloodmoon; disabling either pack hides the union. Shimmering Sands consumes Kyra-Stones and Descent Into Misery. Argent Flow continues the Silver Wind → Festive Winds chain.
- Nameless Saint's starting equipment is configured through Collection checkboxes, initially empty. The user-supplied [wiki character excerpt](https://vampire.survivors.wiki/w/Nameless_Saint#Passive_bonuses), incorporated on 2026-10-04, specifies these priorities: collected 108 Bocce over collected Cross; collected 108 Responsive Prayers independently; collected Refectio over collected Laurel. Disabled DLCs make their weapons unavailable, and an uncollected fallback is never granted. Collection choices are preserved in shared build hashes with a `saint=` token. The six documented Adept weapons are highlighted; Refectio is a starting option, not a documented Adept weapon. Initial Luck/Banish and Last Breath's Rosary are described, not simulated. Hidden Argent Flow and Mille Bolle Blu are shown for Megalo Miang and Spiritosa. Dynamic followers, random weapon grants, and extra passive slots from character abilities are not simulated.
- Red Moon Manor floor items and pickups were completed on 2026-10-04 using the user-supplied [wiki stage excerpt](https://vampire.survivors.wiki/w/Red_Moon_Manor#Items). `floorItems` preserves counts, prior-collection requirements, Yellow Sign requirements, and supplied locations; the tooltip shows this information. Build items appear once in `itemIds`, regardless of floor quantity. Moonspell floor items are filtered out when that pack is disabled. Collection progress and Yellow Sign ownership are not tracked: displayed items assume their documented prerequisites. Consumable pickups are documented, not automatically selected as build equipment. The map relic, coffin, and boss progression remain outside the build model.
- Moonspell descriptions and evolution tips were refreshed, including Godai Shuffle requiring maxed Candelabrador. Eligible special passives from Emergency Meeting and Operation Guns are represented beyond the ordinary passive limit, with the 1.16 ArmaDio/level-up availability noted in tooltips.
- New weapons have explicit Arcana relationships from the client. Exhaustive stat-impact highlighting remains incomplete, as for previous content updates; missing impact lists safely sort as empty arrays.

## Verification

Run:

```bash
npm test
npm run validate
git diff --check
```

The validator rejects duplicate IDs, unknown content packs, dangling item references, evolution cycles, missing icon selectors, broken local icon paths, and invalid inline JavaScript.

The 1.16 regression suite runs the real planner setup/computed functions with a minimal Vue test adapter to check union selection, chained evolution, starting equipment, DLC filtering, tooltips, sorting, and Arcana links. It does not replace a browser rendering or Vue scheduler test. No browser was available during this audit; extracted icon assets were inspected as a contact sheet.

## Maintenance checklist

1. Confirm the latest released version and platform availability from official announcements.
2. Diff characters, weapons, evolution requirements, passives, Arcanas/Darkanas, pickups, and stages against the installed client.
3. Register any new content pack before assigning records to it.
4. Add data and artwork in the same change; prefer a versioned `img/vX.Y/` directory.
5. Update the totals and baseline in this document.
6. Run the full verification commands and audit every local CSS image reference.

## Evolution reference audit (2026-10-04)

The user supplied the text of the wiki's Evolution article. Its recipe tables were used to add explicit evolution/union/gift/morph classifications and max-level requirements to the supported ordinary recipes, plus consumed-catalyst notes for Emergency Meeting and Operation Guns and 21 required Glimmer techniques for Emerald Diorama. See [the mechanics notes](evolution-mechanics.md) for scope and remaining limitations.

Six missing base-game records were added: Chaos Rune, Wicked Ruler, Anima of Mortaccio, Yatta Daikarin, Carrozza!, and Profusione D'Amore. Their names, descriptions and icons were checked against the installed 1.16.107 client; [the source map](evolution-sources.json) identifies their internal keys. Existing IDs were retained when correcting the display names Dress Sword (`eme-estoc`), Falconwind (`eme-bilqis`), and Luminaire (`prism_`). Millionaire's obsolete Clover requirement was removed from its tooltip. Universitas no longer requires Candybox.

Gift prerequisites are retained in the build preview. Morph targets select their required character and describe the level-80/relic conditions; merely picking Bone, Cherry Bomb, Carréllo or Celestial Dusting with another character does not activate a morph. These are target builds, not a simulation of reaching level 80 or opening a chest.
