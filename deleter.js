const rimraf = require('rimraf')
const fetch  = require('node-fetch')
const fs     = require('fs')
const fsp    = require('fsp')
const path   = require('path')
const moment = require('moment')
const touch  = require('touch')
const mkdirp = require('mkdirp')

const config = require('/home/ec2-user/deploy/forge-server/config').config()

// temp folder is used to cache site meta between deploys
//   example.com/.forge-meta.json
const tmpDir = (process.env.NODE_ENV === 'development' ?
  path.resolve(__dirname, './tmp/') :
  path.resolve(__dirname, '/tmp/cache/')
)

const forgercDir = (process.env.NODE_ENV === 'development' ?
  path.resolve(__dirname, './tmp/forgerc_sites') :
  path.resolve(__dirname, '/tmp/forgerc_sites/')
)

const logger = (...args) => {
  console.log(`🕐  ${moment().format('MM.DD.YYYY HH:mm:ss')} #`, ...args)
}

/*
 * In order to provide downtime support
 * we use time of the last sucessfull check
 */
const lastCheckedAtFile = path.join(tmpDir, '.deleter-last-check')

let lastCheckAt = null

try {
  lastCheckAt = new Date( fs.readFileSync(lastCheckedAtFile, 'utf-8') )
} catch(err) {
  lastCheckAt = moment().subtract(1, 'days').toDate()
}

logger(`😎  Last check was performed ${moment(lastCheckAt).format('MM.DD HH:mm')}`)

const updateLastCheck = () => {
  lastCheckAt = new Date
  fsp.writeFile(lastCheckedAtFile, lastCheckAt)
}

/*
 * Utility fs functions (Promise-compliant)
 */
const removeDir = (dir) => {
  logger(`✂️  Removing dir ${dir}`)

  return new Promise( (resolve, reject) => {
    rimraf(dir, (err) => {
      if(err) return reject(err)
      resolve()
    })
  })
}

const touchFile = (fname) => {
  logger(`👆  Touching file ${fname}`)

  return new Promise( (resolve, reject) => {
    const directory = path.dirname(fname)

    logger(`🗂  Creating dir ${directory}`)

    mkdirp(directory, (err) => {
      if(err) return reject(err)

      fs.writeFile(fname, 'w00t', (err) => {
        if(err) return reject(err)
        resolve()
      })
    })
  })
}

const cleanSite = (site) => {
  logger(`💣  Cleaning site ${site.url}`)

  return Promise.all([
    removeDir(path.join(tmpDir, site.url)),
    removeDir(path.join(tmpDir, `www.${site.url}`)),
    removeDir(path.join(forgercDir, site.url))
  ])
  .then( _ => {

    if(site.has_config) {
      return Promise.all([
        touchFile(path.join(forgercDir, site.url, '.forge-config'))
      ])
    }
  })
}

// Strips www. part of an URL
const normalizeUrl = (url) => {
  return (url || '').replace(/^www\./, '')
}

const cleanSites = (sites) => {
  if(!sites.length) {
    // TODO: output this message with some throttle
    //   e.g. once in X seconds only
    // logger('🌚  Nothing to do...')
  }

  const normalizedUrls = sites.map((site) => {
    return Object.assign({}, site, { url: normalizeUrl(site.url) })
  })

  return Promise.all( normalizedUrls.map(cleanSite) )
    .then(updateLastCheck)
}

/*
 * Fetches deployed sites data from API
 * and cleans the caches
 */

const CHECK_INTERVAL = 2000

const checkDeployed = () => {
  let since = moment(lastCheckAt).unix() - 2;

  fetch(`${config.forge_api}/deployed_sites.json?deployed_since=${since}`)
  .then((response) => {
    if(response.status != 200)
      throw new Error('API is unavailable!')

    return response.json()
  })
  .then((json) => {
    sitesToUpdate = json.sites || []
    cleanSites(sitesToUpdate)
  })
  .catch( err => {
    logger('💣  BOOM! Error happened', err)
    return null
  })
  .finally
  {
    setTimeout(checkDeployed, CHECK_INTERVAL)
  }

}

checkDeployed()
