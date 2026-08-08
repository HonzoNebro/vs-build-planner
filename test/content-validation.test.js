const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const {
  loadData,
  validateData,
  validateIconAssets,
  validateIcons,
  validateInlineScripts,
  validateProject,
} = require('../scripts/validate-data')

const rootDir = path.resolve(__dirname, '..')

function cloneData() {
  return structuredClone(loadData(rootDir))
}

test('the repository content is internally consistent', () => {
  assert.doesNotThrow(() => validateProject(rootDir))
})

test('unknown content packs are rejected', () => {
  const data = cloneData()
  data.characters[0].contentPack = 'missing-pack'
  assert.ok(validateData(data).some((error) => error.includes('unknown content pack')))
})

test('duplicate IDs inside one collection are rejected', () => {
  const data = cloneData()
  data.weapons.push(structuredClone(data.weapons[0]))
  assert.ok(validateData(data).some((error) => error.includes('Duplicate ID in weapons')))
})

test('dangling item references are rejected', () => {
  const data = cloneData()
  data.characters[0].itemIds.push('missing-item')
  assert.ok(validateData(data).some((error) => error.includes('references missing ID')))
})

test('evolution cycles are rejected', () => {
  const data = cloneData()
  data.evolutions[0].itemIds.push(data.evolutions[1].id)
  data.evolutions[1].itemIds.push(data.evolutions[0].id)
  assert.ok(validateData(data).some((error) => error.includes('Evolution cycle')))
})

test('missing icon selectors are rejected', () => {
  const data = cloneData()
  const css = fs.readFileSync(path.join(rootDir, 'icons.css'), 'utf8')
  const id = data.characters[0].id
  const cssWithoutIcon = css.replace(new RegExp(`\\.icon-${id}\\s*\\{[^}]*\\}`), '')
  assert.ok(validateIcons(data, cssWithoutIcon).some((error) => error.includes(`characters:${id}`)))
})

test('missing local icon assets are rejected', () => {
  const css = '.icon-example { background-image: url("img/does-not-exist.webp"); }'
  assert.ok(validateIconAssets(css, rootDir).some((error) => error.includes('img/does-not-exist.webp')))
})

test('invalid inline JavaScript is rejected', () => {
  assert.ok(validateInlineScripts('<script>const = broken</script>').length > 0)
})
