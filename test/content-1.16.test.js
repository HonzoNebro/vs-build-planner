const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const test = require('node:test')
const { loadData, validateData } = require('../scripts/validate-data')
const root = path.resolve(__dirname, '..')

// Run the real setup and computed functions without a browser or external CDN.
// This harness does not cover DOM rendering or Vue's reactive scheduler.
function planner(hash = '') {
  let app
  const watchers = []
  const effects = []
  const value = (source) => typeof source === 'function' ? source() : source && 'value' in source ? source.value : source
  const context = {
    window: { vs: loadData(root), addEventListener() {} },
    location: { hash },
    localStorage: { getItem: () => null },
    document: { documentElement: { scrollTop: 0 }, querySelectorAll: () => [] },
    console,
    Vue: {
      createApp: (options) => ({ mount: () => { app = options.setup() } }),
      ref: (value) => ({ value }), reactive: (value) => value,
      computed: (fn) => ({ get value() { return fn() } }),
      watch(source, fn, options) {
        const watcher = { source, fn, previous: value(source) }
        watchers.push(watcher)
        if (options?.immediate) fn(watcher.previous)
      },
      watchEffect: (fn) => { effects.push(fn); fn() },
      nextTick() {}, onMounted() {}, onBeforeUnmount() {},
    },
  }
  vm.createContext(context)
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  for (const [, script] of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
    if (script.trim()) vm.runInContext(script, context)
  }
  return {
    app,
    get hash() { return context.location.hash },
    flush() {
      for (let round = 0; round < 3; round++) {
        for (const watcher of watchers) {
          const current = value(watcher.source)
          if (current !== watcher.previous || typeof current?.add === 'function') {
            watcher.fn(current, watcher.previous)
            watcher.previous = current
          }
        }
      }
      effects.forEach((fn) => fn())
    },
  }
}

test('Bloodmoon recipes require the correct maxed passive', () => {
  const data = loadData(root)
  for (const [id, weapon, passive] of [
    ['cardinal-rain', 'scarlet-needle', 'recovery'],
    ['bloodlust', 'ashella', 'amount'],
    ['dust-to-dust', 'incineration', 'area'],
    ['forbidden-siren', 'screams-from-the-void', 'magnet'],
    ['damnation', 'blacken-firmament', 'torrona'],
  ]) {
    const recipe = data.evolutions.find((item) => item.id === id)
    assert.deepEqual(Array.from(recipe.itemIds), [weapon, passive])
    assert.deepEqual(Array.from(recipe.maxLevelItemIds), [weapon, passive])
  }
})

test('cross-pack unions and chained evolutions produce the final weapon', () => {
  for (const [id, ingredients] of [
    ['road-to-heaven', ['bocce', '108-responsive-prayers']],
    ['shimmering-sands', ['kyra-stones', 'descent-into-misery']],
    ['argent-flow', ['wind_', 'torrona']],
    ['lunarflight', ['lunarmight', 'lunarsight', 'lunarbight']],
    ['firestall', ['firefall', 'fireball', 'firewall']],
  ]) {
    const { app, flush } = planner()
    const recipe = app.itemsById[id]
    assert.deepEqual(Array.from(recipe.itemIds).sort(), ingredients.sort())
    app.toggleItem(recipe)
    flush()
    assert.ok(app.evolvedWeapons.value.some((item) => item.id === id), id)
    assert.ok(recipe.title.includes('Max level:'))
  }
})

test('DLC filters hide cross-pack unions and preserve unrelated content', () => {
  const { app } = planner()
  app.config.contentPacks['legacy-moonspell'] = false
  assert.ok(!app.visibleEvolutions.value.some((item) => item.id === 'road-to-heaven'))
  assert.ok(app.visibleEvolutions.value.some((item) => item.id === 'firestall'))
  app.config.contentPacks['legacy-bloodmoon'] = false
  assert.ok(!app.visibleCharacters.value.some((item) => item.id === 'malice'))
  assert.ok(!app.visibleStages.value.some((item) => item.id === 'red-moon-manor'))
})

test('new characters preserve starting equipment and hidden weapons', () => {
  for (const [id, expected] of [
    ['malice', ['scarlet-needle']],
    ['gekkojin-lunarsight', ['lunarsight', 'pearl-magatama']],
    ['jaman-jato-prestige-5', ['108-responsive-prayers', 'amount']],
    ['baal-thamut', ['damnation', 'darkana6']],
  ]) {
    const { app, flush } = planner()
    app.toggleItem(app.itemsById[id]); flush()
    for (const item of expected) assert.equal(app.itemsById[item].selected, true)
  }
  const { app, flush } = planner()
  app.toggleItem(app.itemsById['megalo-miang']); flush()
  assert.ok(app.counterpartsWeapons.value.some((item) => item.id === 'argent-flow'))
})

test('sorting handles the expanded catalog and new Arcana links', () => {
  const { app, flush } = planner()
  app.config.sorting = true
  assert.doesNotThrow(flush)
  assert.ok(app.impactsById.value['ashella'].includes('+arcana16'))
})

test('max-level requirements must refer to recipe ingredients', () => {
  const data = loadData(root)
  data.evolutions[0].maxLevelItemIds = ['lunarmight']
  assert.ok(validateData(data).some((error) => error.includes('outside its ingredients')))
})

test('Red Moon Manor preserves floor counts and conditional Moonspell availability', () => {
  const { app, flush } = planner()
  const stage = app.itemsById['red-moon-manor']
  assert.equal(stage.floorItems.length, 22)
  for (const id of ['magnet', 'area', 'recovery', 'amount', 'torrona']) {
    assert.equal(stage.floorItems.find((entry) => entry.id === id).count, 2)
  }
  assert.equal(stage.floorItems.find((entry) => entry.id === 'rosary').count, 3)
  assert.equal(stage.floorItems.find((entry) => entry.id === '108-responsive-prayers').condition, 'Collect this weapon once before it can appear.')
  assert.equal(stage.floorItems.find((entry) => entry.id === 'ring1').condition, 'Requires Yellow Sign. Northwest of Sargon.')
  assert.equal(stage.title, 'Red Moon Manor\nA sprawling Bloodmoon manor filled with bosses, hidden rooms, and stage items.')
  assert.equal(stage.itemIds.filter((id) => id === 'ring1').length, 1)
  app.config.contentPacks['legacy-moonspell'] = false
  app.toggleItem(stage); flush()
  assert.ok(!stage.items.some((item) => ['bocce', 'pearl-magatama'].includes(item.id)))
  assert.ok(!app.stagePassives.value.some((item) => item.id === 'pearl-magatama'))
  assert.ok(app.itemsById['descent-into-misery'].selected)
  assert.ok(app.stagePassives.value.some((item) => item.id === 'torrona'))
  app.config.contentPacks['legacy-moonspell'] = true
  flush()
  assert.ok(stage.items.some((item) => item.id === 'bocce'))
  assert.ok(app.stagePassives.value.some((item) => item.id === 'pearl-magatama'))
  assert.ok(app.itemsById['pearl-magatama'].selected)
})

test('floor inventory rejects unknown items and invalid quantities', () => {
  const data = loadData(root)
  const stage = data.stages.find((item) => item.id === 'red-moon-manor')
  stage.floorItems.push({ id: 'unknown-floor-item', count: 0 })
  const errors = validateData(data)
  assert.ok(errors.some((error) => error.includes('floorItems references missing ID')))
  assert.ok(errors.some((error) => error.includes('floorItems has invalid count')))
})

test('Nameless Saint uses collected weapons, with priority and DLC fallbacks', () => {
  const session = planner()
  const { app, flush } = session
  app.toggleItem(app.itemsById['nameless-saint']); flush()
  assert.equal(app.selectedWeapons.value.length, 0)
  app.saintCollection.value = ['cross', 'laurel']; flush()
  assert.deepEqual(Array.from(app.selectedCharacter.value.itemIds), ['cross', 'laurel'])
  app.saintCollection.value = Array.from(app.saintWeaponIds); flush()
  assert.deepEqual(Array.from(app.selectedCharacter.value.itemIds), ['bocce', '108-responsive-prayers', 'holy'])
  assert.ok(!app.itemsById.cross.selected)
  assert.ok(!app.itemsById.laurel.selected)
  const shared = planner('#' + session.hash.replace(/^#/, ''))
  shared.flush()
  assert.deepEqual(Array.from(shared.app.selectedCharacter.value.itemIds), ['bocce', '108-responsive-prayers', 'holy'])
  app.config.contentPacks['legacy-moonspell'] = false
  app.config.contentPacks['ode-castlevania'] = false
  flush()
  assert.deepEqual(Array.from(app.selectedCharacter.value.itemIds), ['cross', '108-responsive-prayers', 'laurel'])
  app.saintCollection.value = ['bocce', 'holy']; flush()
  assert.equal(app.selectedCharacter.value.itemIds.length, 0)
  assert.ok(app.impactsById.value['nameless-saint'].includes('+road-to-heaven'))
  assert.ok(!app.impactsById.value['nameless-saint'].includes('+holy'))
})

test('Menya exposes her Max Health trade-off in the stat summary', () => {
  const { app, flush } = planner()
  app.toggleItem(app.itemsById.menya); flush()
  assert.equal(app.config.stats, false)
  const health = app.statImpactRows.value.find((stat) => stat.id === 'health')
  assert.equal(health.label, 'Max Health')
  assert.equal(health.tone, 'drop')
  assert.equal(health.description, 'reduction')
  assert.ok(app.itemsById.menya.description.includes('-20% Max Health'))
})

test('gift recipes retain base weapons and Universitas does not require Candybox', () => {
  for (const [giftId, bases] of [['universitas', ['light_', 'dark_']], ['sword_', ['sword']]]) {
    const { app, flush } = planner()
    app.toggleItem(app.itemsById[giftId]); flush()
    assert.ok(!app.itemsById[giftId].itemIds.includes('candybox'))
    for (const id of bases) assert.ok(app.evolvedWeapons.value.some((item) => item.id === id), id)
    assert.ok(app.counterpartsWeapons.value.some((item) => item.id === giftId))
  }
})

test('morphs require their specific character and can be selected as build targets', () => {
  for (const [morph, character, base] of [
    ['anima-of-mortaccio', 'mortaccio', 'bone'],
    ['yatta-daikarin', 'cavallo', 'cherry'],
    ['carrozza', 'ramba', 'cart'],
    ['profusione-d-amore', 'osole', 'flowers'],
  ]) {
    const { app, flush } = planner()
    app.toggleItem(app.itemsById[base]); flush()
    assert.equal(app.itemsById[morph].selected, false)
    assert.ok(app.evolvedWeapons.value.some((item) => item.id === base))
    app.toggleItem(app.itemsById[morph]); flush()
    assert.equal(app.selectedCharacter.value.id, character)
    assert.ok(app.evolvedWeapons.value.some((item) => item.id === morph))
    assert.ok(app.itemsById[morph].title.includes('level 80'))
    assert.ok(app.itemsById[morph].title.includes('No chest required'))
  }
})

test('evolution audit distinguishes passive levels, consumed catalysts and Glimmers', () => {
  const { app } = planner()
  assert.deepEqual(Array.from(app.itemsById.whip_.maxLevelItemIds), ['whip'])
  assert.deepEqual(Array.from(app.itemsById.arrow_.maxLevelItemIds), ['arrow', 'speed'])
  assert.deepEqual(Array.from(app.itemsById.shortgun_.maxLevelItemIds), ['shortgun'])
  assert.deepEqual(Array.from(app.itemsById.shortgun_.consumedItemIds), ['powerup'])
  assert.deepEqual(Array.from(app.itemsById.report_.maxLevelItemIds), ['report', 'minicrewmate'])
  assert.ok(app.itemsById.report_.title.includes('Consumed on evolution'))
  assert.ok(app.itemsById['eme-estoc'].title.includes('Crystalline Carve'))
  assert.equal(app.itemsById['eme-estoc'].name, 'Dress Sword')
  assert.equal(app.itemsById['eme-bilqis'].name, 'Falconwind')
  assert.deepEqual(Array.from(app.itemsById['wicked-ruler'].itemIds), ['chaos-rune', 'duration'])
  assert.ok(app.itemsById['eme-rings-of-calamity'].title.includes('five max-level passives'))
})
