# Known limitations

  * Assets will not load if `index.html` is missing. It's happens because
    forge-token is stored inside `index.html` using meta-tag. The better solution would
    be to featch site token as well as config file via API.

  * No http caching support for pages. Assets caching works automatically since they
    are served with redirect to S3.


# Deploy new version to EC2

Install new node.js version:

  sudo yum install gcc-c++ make
  sudo yum install openssl-devel
  sudo yum update binutils
  git clone https://github.com/nodejs/node.git
  git checkout v5.11.0
  cd node
  ./configure
  make
  sudo make install


# Config file format
The format of a config file:

  [Condition#1] [args]
    [Rule#1] [args]
    [Rule#2] [args]
    [Rule#3] [args]

  [Condition#1] [args]
    [Rule#1] [args]
    [Rule#2] [args]
    [Rule#3] [args]

Right now there is going to be only one condition `Location` that accepts regexp or path.
Additionaly any plugin can define it's own rules or conditions.
So the final config could look like this:

  Location /about
    BasicAuth login password23
    Rewrite /about.html

  Location /pricing
    Redirect http://google.com 301

  Location /restricted/*
    Respond 403 'Sorry you cant see this one'

This file format allows us to do even more than .htaccess does. But we can also write a
*.htacccess-to-our-config* converter later.
