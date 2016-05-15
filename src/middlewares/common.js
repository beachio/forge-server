const filePath    = require('path')
const fs          = require('fs')
const spawn       = require('child_process').spawn
const rimraf      = require('rimraf')
const async       = require('async')
const uuid        = require('node-uuid')
const mkdirp      = require('mkdirp')

const parser = require('../configParser')
const logger = require('../logger')

const { getFileContent } = require('../s3')

// temp folder is used to cache site meta between deploys
//   example.com/.forge-meta.json
const tmpDir = (process.env.NODE_ENV === 'development' ?
  filePath.resolve(__dirname, '../../tmp/') :
  filePath.resolve(__dirname, '/tmp/')
)

// the name of the file with site config
const forgercName = 'forgerc.txt'


const loadSiteMeta = (address, done) => {
  const metaFileLocation = filePath.join(tmpDir, `${address}/.forge-meta.json`)

  fs.readFile(metaFileLocation, { encoding: 'utf-8' }, (err, metaContent) => {
    if(!err) {
      let success = true
      let meta = {}
      try {
        meta = JSON.parse(metaContent)
      } catch(err) { success = false }

      if(success) {
        logger(`✅  Meta for site loaded from ${metaFileLocation}`)
        return done(null, meta)
      }
    }

    logger(`⏺  No site meta found in ${metaFileLocation}. Fetching.`)

    getFileContent(`${address}/index.html`, (err, indexPage) => {
      let meta = {}

      meta.siteUID = uuid.v4()
      try {
        meta.token = indexPage.match(/forge-token:(.*[0-9])/)[1]
      } catch(e) {}

      logger(`✅  Fetched site index.html: uuid=${meta.siteUID} token=${meta.token}`)

      getFileContent(`${address}/${meta.token}/${forgercName}`, (err, forgerc) => {
        meta.config  = parser(forgerc || '')

        logger(`📃  Loaded site config ${meta.config.length} entries`)

        mkdirp(filePath.dirname(metaFileLocation), (err) => {
          let metaContent = JSON.stringify(meta, null, 2)
          fs.writeFile(metaFileLocation, metaContent, () => {

            logger(`✅  Stored site meta at ${metaFileLocation}`)
            return done(null, meta)
          })
        })


      })
    })

  })
}


const commonMiddleware = (req, res, next) => {
  let address  = req.headers.host.split(":")[0]
  let path     = req.path

  // Makes testing easier in development
  if ( process.env.NODE_ENV === 'development') {
    address = 'molefrog.getforge.io' //'www.example.com'
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
