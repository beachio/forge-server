let api = require('./index')
const {performRewrite} = require('../middlewares/static')
api.registerRule('ClearLastSlash', (args, req, res, next) => {
    if (args[0] === 'true') {
        var location = args[1]
        if (location !== '/')
            location = args[1].replace(/\/$/, '')
        let status = args[2]

        if (status) status = parseInt(status)

        return performRewrite(req, res, next, location, status)
    }
    else return next()
})