# Evolution mechanics and coverage

Source: user-supplied [Evolution wiki article](https://vampire.survivors.wiki/w/Evolution), received 2026-10-04. No live wiki access was available.

## Rules represented in the planner

- Ordinary evolutions require the base weapon at maximum level. Only the passives explicitly marked as max-level requirements must be maxed; other catalysts only need to be held.
- Unions combine their required weapons, freeing the extra weapon slots.
- Gifts are shown alongside their prerequisite weapons. Universitas requires Vol Luminatio and Vol Umbra, with no Candybox dependency. Sole Solution retains Victory Sword.
- Morphs require Mortaccio/Chaos Malachite, Yatta Cavallo/Chaos Rosalia, Bianca Ramba/Chaos Lazulia, or O'Sole Meeo/Chaos Altemanna, respectively. Their character reaches level 80; no chest or max-level base weapon is required. The planner selects the required character when selecting a morph target, but does not track relic ownership or current character level.
- Emergency Meeting consumes the relevant maxed Mini passive; Operation Guns consumes Weapon Power-Up. The catalyst remains displayed as a build requirement; consumption and reacquisition are not simulated.
- Emerald Diorama's listed Glimmer techniques and Rings of Calamity's five-maxed-passive condition appear in tooltips. No combat-trigger simulation is performed.

## Chest rules (reference only)

An evolution normally needs a chest with an evolution reward, generally from a boss spawning at or after minute 10. That is not a universal timer rule. Examples of exceptions in the supplied article:

- The first Mad Forest chest (minute 1), Lake Foscari's minute-2 chest, and Neo Galuga's minute-9 Metal Alien chest can evolve weapons.
- Dairy Plant, Il Molise, Cappella Magna, Boss Rash, Laborratory, Abyss Foscari and Hectic Highway have no time restriction for their chests.
- Tiny Bridge excludes minute-3 and minute-6 boss chests; Mt. Moonspell excludes minute-3 and minute-5 boss chests.
- Green Acres inherits the original wave's chest rules.
- Arcana chests can evolve weapons once the player's Arcana capacity is full. Gyorunton can evolve through any item-awarding chest.
- Some chests can grant multiple evolutions, depending on chest rewards. Banishing the evolved weapon blocks its evolution reward.
- In co-op, the required weapon and passive can belong to different players when passive sharing is enabled.

These timing, reward, banish and co-op conditions are not evaluated by the planner.

## Remaining special cases

- Penshin Fatcha's repeated choices and Miracle of Multiplication's six-or-more evolution condition are not counted. The existing six-form dependency diagram remains an approximation, not a requirement that every distinct form must be obtained.
- Super Candybox II Turbo remains a counterpart entry with its gift conditions documented; chest availability is not simulated.
- Alucard Shield's six maxed passives, six maxed evolutions, and absorption of evolved weapons are documented. The preview does not consume/absorb the other weapons or enforce those counts.
- Level requirements, collection unlocks, relic ownership and Glimmer acquisition are explanatory conditions. A highlighted recipe means the target ingredients have been chosen, not that the next chest is guaranteed to award it.
- The UI logic has regression coverage but still requires a real browser check.
