# Headless CMS Comparison

This repository contains both the data and the single page app that powers https://cms-comparison.io/

## CMS Data

The data is contained in JSON files in the root directory.

## Single-Page App

The /spa directory contains the sources for the Single-Page App.

### Server-Side Rendering

Development:

```bash
yarn run start-universal
```

Production build:

```bash
yarn run build-universal
```

Quickly rebuild server only:

```bash
NODE_ENV=development npx webpack-cli --config node_modules/cra-universal/src/config/webpack.config.js
```


## Contributing

If you want to contribute a new CMS, please copy the [fields.json](fields.json).
For adding, updating and correcting information, please open a pull request.

## Thanks to

* [David Suppan](https://github.com/davup) for the initial implementation

* [Nemanja Pantoš](https://github.com/npantos) for the design

* [Gentics](https://github.com/gentics) for supporting open source

## References

For a general overview of Headless CMS systems, please visit https://headlesscms.org/.
