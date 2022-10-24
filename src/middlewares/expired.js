const path = require('path')
const fs   = require('fs')

expiredPageContent = fs.readFileSync(path.resolve(__dirname, '../assets/getforge_expired.html'))

module.exports = (req, res, next) => {
    if(req.context.expired) {
      return res
        .set({'Content-Type': 'text/html'})
        .send(expiredPageContent)
    }
    else
      return next()
}
