import fs from 'node:fs'
import * as core from '@actions/core'
import * as cache from '@actions/cache'

async function run() {
  try {
    const cache = core.getBooleanInput('cache')
    if (cache)
      await saveCache()
  }
  catch (error) {
    const err = error as Error
    core.setFailed(err.message)
  }
  // Explicit process.exit() to not wait for hanging promises,
  // see https://github.com/actions/setup-node/issues/878
  process.exit()
}

async function saveCache() {
  const cachePaths = JSON.parse(core.getState('cache-paths')) as string[]

  core.debug(`paths for caching are ${cachePaths.join(', ')}`)

  if (cachePaths.every(path => !fs.existsSync(path)))
    throw new Error(`Cache folder path is retrieved for pdm but doesn't exist on disk: ${cachePaths.join(', ')}`)

  const primaryKey = core.getState('cache-primary-key')
  const matchedKey = core.getState('cache-matched-key')

  if (!primaryKey) {
    core.warning('Error retrieving key from state.')
    return
  }
  else if (matchedKey === primaryKey) {
    // no change in target directories
    core.info(`Cache hit occurred on the primary key ${primaryKey}, not saving cache.`)
    return
  }

  const cacheId = await cache.saveCache(cachePaths, primaryKey)
  if (cacheId === -1)
    return

  core.info(`Cache saved with the key: ${primaryKey}`)
}

run()
