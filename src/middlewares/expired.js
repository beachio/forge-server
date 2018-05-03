const path = require('path')
const fs   = require('fs')

const { performRewrite } = require('./static')

expiredPageContent = fs.readFileSync(path.resolve(__dirname, '../assets/getforge_expired.html'))

module.exports = (req, res, next) => {
    if(req.context.expired) {
        performRewrite(req, res, () => {
          res
            .set({'Content-Type': 'text/html'})
            .send(expiredPageContent)
        }, '/expired.html')
    }
    else
      return next()
}