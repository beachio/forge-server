# Known limitations

  * Assets will not load if `index.html` is missing. It happens because
    forge-token is stored inside `index.html` using meta-tag. The better solution would
    be to featch site token as well as config file via API.

  * No http caching support for pages. Assets caching works automatically since they
    are served with redirect to S3.

# Writing plugins

The set of rules that are applied to request can be extended by plugins.
Basically plugin is a module in `./plugins` directory. Each plugin is
responsible for registering it's own rules or conditions (in future, _extra conditions are not
yet implemented_).

The example of a plugin with one rule definition:

```JavaScript
// Index module contains registerRule function
let api = require('./index')

// Registering Redirect rule
// The second argument is callback that behaves almost like
// express middleware, except for additional `args` argument
// containing rule arguments.
//
// Example: Redirect foo "bar baz" 1337
//    ==> args === [ 'foo', 'bar baz', '1337']
//
// You can access site-related data through `req.context`
// object.
api.registerRule('Redirect', (args, req, res, next) => {
  const location = args[0]

  // be aware arguments are strings!
  const status   = Number(args[1]) || 302

  return res.redirect(status, location)
})
```

# Deploy new version to EC2

How to update Node.js version:

```
 sudo yum install gcc-c++ make
 sudo yum install openssl-devel
 sudo yum update binutils

 git clone https://github.com/nodejs/node.git
 git checkout v6.1.0
 cd node

 ./configure
 make

 # at this point you would probably need
 # to restart old proxy.js with the newer version of node.js
 # but be sure that all required global deps are installed
 sudo make install
```

# Config file format
The format of a config file:

```
  [Condition#1] [args]
    [Rule#1] [args]
    [Rule#2] [args]
    [Rule#3] [args]

  [Condition#1] [args]
    [Rule#1] [args]
    [Rule#2] [args]
    [Rule#3] [args]
```

Right now there is going to be only one condition `Location` that accepts regexp or path.
Additionaly any plugin can define it's own rules or conditions.
So the final config could look like this:

```
  Location /about
    BasicAuth login password23
    Rewrite /about.html

  Location /pricing
    Redirect http://google.com 301

  Location /restricted/*
    Respond 403 'Sorry you cant see this one'
```

This file format allows us to do even more than .htaccess does. But we can also write a
*.htacccess-to-our-config* converter later.
