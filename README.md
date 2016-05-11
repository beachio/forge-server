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

Right now there is going to be only one condition `Location` that accepts regexp or path. Additionaly any plugin can define it's own rules or conditions.
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
.htacccess-to-our-config converter later.
