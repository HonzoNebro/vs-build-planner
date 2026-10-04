const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const test = require('node:test')
const { loadData, validateData } = require('../scripts/validate-data')
const root = path.resolve(__dirname, '..')

// Run the real setup and computed functions without a browser or external CDN.
// This harness does not cover DOM rendering or Vue's reactive scheduler.
function planner() {
  let app
  const watchers = []
  const effects = []
  const value = (source) => source && 'value' in source ? source.value : source
  const context = {
    window: { vs: loadData(root), addEventListener() {} },
    location: { hash: '' },
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
