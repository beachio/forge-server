const rimraf = require('rimraf')
const fetch  = require('node-fetch')
const fs     = require('fs')
const fsp    = require('fsp')
const path   = require('path')
const moment = require('moment')
const touch  = require('touch')
const mkdirp = require('mkdirp')

const config = require('./config').config()

// temp folder is used to cache site meta between deploys
//   example.com/.forge-meta.json
const tmpDir = (process.env.NODE_ENV === 'development' ?
  path.resolve(__dirname, './tmp/') :
  path.resolve(__dirname, '/tmp/cache/')
)

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

console.log(`😎  Last check was performed ${moment(lastCheckAt).format('MM.DD HH:mm')}`)

const updateLastCheck = () => {
  lastCheckAt = new Date
  fsp.writeFile(lastCheckedAtFile, lastCheckAt)
}

/*
 * Utility fs functions (Promise-compliant)
 */
const removeDir = (dir) => {
  console.log(`✂️  Removing dir ${dir}`)

  return new Promise( (resolve, reject) => {
    rimraf(dir, (err) => {
      if(err) return reject(err)
      resolve()
    })
  })
}

const touchFile = (fname) => {
  console.log(`👆  Touching file ${fname}`)

  return new Promise( (resolve, reject) => {
    mkdirp(path.dirname(fname), (err) => {
      if(err) return reject(err)

      fs.writeFile(fname, 'w00t', (err) => {
        if(err) return reject(err)
        resolve()
      })
    })
  })
}

const cleanSite = (site) => {
  console.log(`💣  Cleaning site ${site.url}`)

  return Promise.all([
    removeDir(path.join(tmpDir, site.url)),
    removeDir(path.join(tmpDir, `www.${site.url}`))
  ])
  .then( _ => {

    if(site.has_config) {
      return Promise.all([
        touchFile(path.join(tmpDir, site.url, '.forge-config')),
        touchFile(path.join(tmpDir, `www.${site.url}`, '.forge-config'))
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
    // console.log('🌚  Nothing to do...')
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
  let since = moment(lastCheckAt).unix()

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
    console.log('💣  BOOM! Error happened', err)
    return null
  })
  .then( _ => {
    setTimeout(checkDeployed, CHECK_INTERVAL)
  })

}

checkDeployed()
