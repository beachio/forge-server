const path = require('path')
const fs   = require('fs')

const { performRewrite } = require('./s3Middleware')

errorPageContent = fs.readFileSync(path.resolve(__dirname, '../assets/404.html'))

/*
 * This middleware tries to serve custom 404.html page
 * with fallback to default one
 */
module.exports = (req, res, next) => {
  performRewrite(req, res, () => {

    res
      .status(404)
      .set({ 'Content-Type': 'text/html' })
      .send(errorPageContent)

  }, '/404.html', 404)
}
