const file_path   = require('path')
const fs          = require('fs')
const spawn       = require('child_process').spawn
const rimraf      = require('rimraf')

const commonMiddleware = (req, res, next) => {
  let address  = req.headers.host.split(":")[0]
  let path     = req.path

  // Makes testing easier in development
  if ( process.env.NODE_ENV === 'development') {
    address = 'www.example.com'
  }

  if ( address.slice(0, 4) === "www." )
    address = address.slice(4)

  // This object is shared between middlewares
  req.forge = {
    address,
    path
  }

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

  return next()
}

module.exports = commonMiddleware
