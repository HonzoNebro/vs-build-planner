const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const CONTENT_COLLECTIONS = [
  'characters',
  'weapons',
  'evolutions',
  'counterparts',
  'passives',
  'powerups',
  'arcanas',
  'pickups',
  'structures',
  'stages',
]

function loadData(rootDir) {
  const context = { window: {} }
  const filename = path.join(rootDir, 'data.js')
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), context, { filename })
  return context.window.vs
}

function validateData(data) {
  const errors = []
  const contentPacks = Array.isArray(data.contentPacks) ? data.contentPacks : []
  const packIds = new Set()

  for (const pack of contentPacks) {
    if (!pack.id || !pack.name || !pack.shortName || !pack.color) {
      errors.push(`Content pack ${pack.id || '<unknown>'} is missing required metadata`)
    }
    if (packIds.has(pack.id)) errors.push(`Duplicate content pack ID: ${pack.id}`)
    packIds.add(pack.id)
  }

  const records = []
  const recordsById = new Map()
  const keys = new Set()

  for (const collectionName of CONTENT_COLLECTIONS) {
    const collection = data[collectionName]
    if (!Array.isArray(collection)) {
      errors.push(`Missing content collection: ${collectionName}`)
      continue
    }

    const collectionIds = new Set()
    for (const record of collection) {
      const label = `${collectionName}:${record.id || '<unknown>'}`
      if (!record.id || !record.name) errors.push(`${label} is missing id or name`)
      if (collectionIds.has(record.id)) errors.push(`Duplicate ID in ${collectionName}: ${record.id}`)
      collectionIds.add(record.id)

      const key = `${collectionName}:${record.id}`
      if (keys.has(key)) errors.push(`Duplicate namespaced key: ${key}`)
      keys.add(key)

      if (record.contentPack && !packIds.has(record.contentPack)) {
        errors.push(`${label} uses unknown content pack: ${record.contentPack}`)
      }

      records.push({ ...record, collectionName })
      if (!recordsById.has(record.id) || collectionName === 'passives') recordsById.set(record.id, record)
    }
  }

  for (const record of records) {
    for (const field of ['itemIds', 'hiddenitemIds']) {
      if (record[field] !== undefined && !Array.isArray(record[field])) {
        errors.push(`${record.collectionName}:${record.id}.${field} must be an array`)
        continue
      }
      for (const reference of record[field] || []) {
        if (!recordsById.has(reference)) {
          errors.push(`${record.collectionName}:${record.id}.${field} references missing ID: ${reference}`)
        }
      }
    }
  }

  validateEvolutionCycles(data.evolutions || [], errors)
  return errors
}

function validateEvolutionCycles(evolutions, errors) {
  const evolutionIds = new Set(evolutions.map((evolution) => evolution.id))
  const graph = new Map(evolutions.map((evolution) => [
    evolution.id,
    (evolution.itemIds || []).filter((id) => evolutionIds.has(id)),
  ]))
  const visiting = new Set()
  const visited = new Set()

  function visit(id, route = []) {
    if (visiting.has(id)) {
      errors.push(`Evolution cycle: ${route.concat(id).join(' -> ')}`)
      return
    }
    if (visited.has(id)) return
    visiting.add(id)
    for (const dependency of graph.get(id) || []) visit(dependency, route.concat(id))
    visiting.delete(id)
    visited.add(id)
  }

  for (const id of evolutionIds) visit(id)
}

function validateIcons(data, css) {
  const errors = []
  const iconIds = new Set([...css.matchAll(/\.icon-([a-zA-Z0-9_-]+)\s*\{/g)].map((match) => match[1]))
  for (const collectionName of CONTENT_COLLECTIONS) {
    for (const record of data[collectionName] || []) {
      if (!iconIds.has(record.iconId || record.id)) errors.push(`Missing icon selector for ${collectionName}:${record.id}`)
    }
  }
  return errors
}

function validateIconAssets(css, rootDir) {
  const errors = []
  const references = new Set(
    [...css.matchAll(/url\((?:"|')?(img\/[^"')]+)(?:"|')?\)/g)].map((match) => match[1]),
  )
  for (const reference of references) {
    if (!fs.existsSync(path.join(rootDir, reference))) {
      errors.push(`Missing icon asset: ${reference}`)
    }
  }
  return errors
}

function validateInlineScripts(html) {
  const errors = []
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
    .map((match) => match[1])
    .filter(Boolean)
  scripts.forEach((source, index) => {
    try {
      new vm.Script(source, { filename: `index-inline-${index}.js` })
    } catch (error) {
      errors.push(error.message)
    }
  })
  return errors
}

function validateProject(rootDir) {
  const data = loadData(rootDir)
  const css = fs.readFileSync(path.join(rootDir, 'icons.css'), 'utf8')
  const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8')
  const errors = [
    ...validateData(data),
    ...validateIcons(data, css),
    ...validateIconAssets(css, rootDir),
    ...validateInlineScripts(html),
  ]
  if (errors.length) throw new Error(`Content validation failed:\n- ${errors.join('\n- ')}`)
  return data
}

if (require.main === module) {
  const rootDir = path.resolve(__dirname, '..')
  const data = validateProject(rootDir)
  const recordCount = CONTENT_COLLECTIONS.reduce((total, name) => total + data[name].length, 0)
  console.log(`Validated ${recordCount} records across ${data.contentPacks.length} content packs.`)
}

module.exports = {
  CONTENT_COLLECTIONS,
  loadData,
  validateData,
  validateIconAssets,
  validateIcons,
  validateInlineScripts,
  validateProject,
}
