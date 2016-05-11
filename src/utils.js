/*
 * This function applies middlewares in chain
 */
module.exports.applyMiddlewares = (middlewares, req, res, next) => {
  let mddlw = middlewares.slice()

  function appl(err) {
    // In case of error do not call middleware
    // just break the chain
    if(err) return next(err)

    if( mddlw.length > 0 ) {
      let currentMiddleware = mddlw[0]
      mddlw = mddlw.slice(1)

      currentMiddleware.func(currentMiddleware.args, req, res, appl)
    } else { next(err) }
  }
  return appl()
}
