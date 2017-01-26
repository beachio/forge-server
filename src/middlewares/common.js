const filePath    = require('path')
const fs          = require('fs')
const spawn       = require('child_process').spawn
const rimraf      = require('rimraf')
const async       = require('async')
const uuid        = require('node-uuid')
const mkdirp      = require('mkdirp')
const fetch       = require('node-fetch')

const parser     = require('../configParser')
const logger     = require('../logger')
const { config } = require('../env')

const { getFileContent } = require('../s3')

// temp folder is used to cache site meta between deploys
//   example.com/.forge-meta.json
const tmpDir = (process.env.NODE_ENV === 'development' ?
  filePath.resolve(__dirname, '../../tmp/') :
  filePath.resolve(__dirname, '/tmp/cache/')
)

/*
 * Allows to load site meta using Forge API
 */
const fetchMetaByApi = (address, done) => {
  fetch(`${config.forge_api}/site_meta?url=${address}`)
  .then((response) => {
    if(response.status != 200) return done(new Error('Site not found'))
    return response.json()
  })
  .then((json) => {
    return done(null, {
      token:     json.token,
      configRaw: json.siterc
    })
  })
  .catch(err => { return done(err) })
}

/*
 * This method allows to fetch site method using
 * direct access to S3.
 * It's slower but we keep it as a fallback
 */

// the name of the file with site config
const forgercName = '.forgerc'

const fetchMetaOldWay = (address, done) => {
  getFileContent(`${address}/index.html`, (err, indexPage) => {
    if (err) return done(err)

    let token = null

    try { token = indexPage.match(/forge-token:(.*[0-9])/)[1] } catch(e) {}

    logger(`✅  Fetched site index.html: token=${token}`)

    getFileContent(`${address}/${token}/${forgercName}`, (err, forgerc) => {
      if (err) return done(err)

      return done(null, {
        token: token,
        configRaw: forgerc
      })
    })
  })
}

const forceLoadMeta = (address, done) => {
  fetchMetaByApi(address, (err, result) => {
    if(err) {
      logger(`⏺  Fetching site meta through Forge API failed. Falling back to old way...`)
      return fetchMetaOldWay(address, done)
    }

    logger(`✅  Fetched site meta through Forge API`)
    done(err, result)
  })
}

const loadSiteMeta = (address, done) => {
  const metaFileLocation = filePath.join(tmpDir, `${address}/.forge-meta.json`)

  fs.readFile(metaFileLocation, { encoding: 'utf-8' }, (err, metaContent) => {
    if(!err) {
      let success = true
      let meta = {}
      try { meta = JSON.parse(metaContent) } catch(err) { success = false }

      if(success) {
        logger(`✅  Meta for site loaded from ${metaFileLocation}`)
        return done(null, meta)
      }
    }

    logger(`⏺  No site meta found in ${metaFileLocation}. Fetching.`)

    forceLoadMeta(address, (err, mt) => {
      if (err) return done(err)

      mt.siteUID = uuid.v4()
      mt.config  = parser(mt.configRaw || '')

      logger(`📃  Loaded site config ${mt.config.length} entries`)

      mkdirp(filePath.dirname(metaFileLocation), (err) => {
        let metaContent = JSON.stringify(mt, null, 2)
        fs.writeFile(metaFileLocation, metaContent, () => {

          logger(`✅  Stored site meta at ${metaFileLocation}`)
          return done(null, mt)
        })
      })
    })
  })
}


const commonMiddleware = (req, res, next) => {
  let address  = req.headers.host.split(":")[0]
  let path     = req.path

  // Makes testing easier in development
  if ( process.env.NODE_ENV === 'development' && config.overwrite_address) {
    address = config.overwrite_address
  }

  if ( address.slice(0, 4) === "www." )
    address = address.slice(4)

  if ( address === "getforge.io" ) {
    res.writeHead(302, { 'Location': 'http://getforge.com' })
    return res.end()
  }

  if ( path === '/_asgard_health_check.html' ) {
    return res.end()
  }

  if ( path === '/_asgard_cache_buster' ) {
    rimraf(`/tmp/cache/${address}`,     () => { res.end() })
    rimraf(`/tmp/cache/www.${address}`, () => { res.end() })
    rimraf(`/tmp/forgerc_sites/${address}`, () => { res.end() })
    rimraf(`/tmp/forgerc_sites/www.${address}`, () => { res.end() })
    spawn('restart nginx', [], { stdio: 'inherit' })
    return res.end()
  }

  logger(`⚓️  ${address} ${path}`)

  loadSiteMeta(address, (err, meta) => {
    if(err) return next(err)

    // This object is shared between middlewares
    req.context = {
      address,
      path,
      config: meta.config || [],
      vars: {},
      siteUID: meta.siteUID,
      token:   meta.token
    }

    return next()
  })


}

module.exports = commonMiddleware
