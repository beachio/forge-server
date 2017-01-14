# Known limitations

  * Assets will not load if `index.html` is missing. It happens because
    forge-token is stored inside `index.html` using meta-tag. The better solution would
    be to featch site token as well as config file via API.

  * No http caching support for pages. Assets caching works automatically since they
    are served with redirect to S3.

# Config file format
Config file allows to specify how site requests will be handled. The general structure of a file is:

```
[Condition#1] [args]
  [Rule#1] [args]
  [Rule#2] [args]
  [Rule#3] [args]

[Condition#1] [args]
  [Rule#1] [args]
```

So far these conditions are supported `Location <exact path or express-like wildcards>` and `NotFound`.
Additionaly any plugin can define it's own rules or conditions.
The example of a config file:

```
Location /about
  Delay 1000
  Rewrite /about.html

Location /pricing
  Redirect / 301

Location /features/*
  Respond "Sorry you cant see this one" 403
```

# Use cases 
You would probably need `.forgerc` file on your site if you want to reuse pages across differrent URLs or 
you want better looking links.
This can be achieved with `Redirect`/`Rewrite` rules. E.g.:

```
Location /our-team
  Rewrite /our_team.html
```

Our imagine you want to give a link to your site with terms and conditions. You're too busy at the moment to 
design specific page, so instead just redirect users to Google Doc (replace it with your own page, the link will remain
the same!).

```
Location /terms
  Redirect https://docs.google.com/document/d/1_n1_oiyk0b3x7i69n-iAh4f0UmFbvA 302
```

You don't even need a page, you can write quick text placeholder directly in config file:

```
Location /terms
  Respond "Oops! Not ready yet, stay tuned." 200
```

Use `NotFound` condition if you want to display custom 404 page (Forge already supports 404.html out of box, but say
you need another name).

```
NotFound
  Rewrite /my-custom-404.html
```

This condition is also useful if have single-page application with `pushState` routing. In order to
make your app work when it refreshes you need to respond with `index.html` on any unknown request.

```
NotFound
  Rewrite /index.html
```

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

# To deploy a node server on ec2 follow the steps below:

1) First you need to install shipit-cli

```npm install --global shipit-cli```

2) Next, install any dependencies and plugins

```npm install```

3) Rename the file to secrets.example.json secrets.json and change the example values to real values.

```repository url: https://github.com/beachio/forge-server.git```

4)Now you can deploy the node server

```shipit production deploy```

5) To rollback the version of the node server, use

```shipit production rollback```

```
Note:
After deployment, processes proxy, index and deleter will restart automatically.
Before deploy, make sure you push your changes on githab.
```