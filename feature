#!/usr/bin/env node

const editJsonFile = require("edit-json-file");
const fg = require('fast-glob');

const BLACKLIST = [
  'package.json',
  'package-lock.json'
];

function products() {
  return fg.sync(['*.json']).filter(it => !BLACKLIST.includes(it))
}

function editAllProducts(callback) {
  const p = products();
  for (const product of p) {
    const f = editJsonFile(`${__dirname}/${product}`, {"stringify_width": 4});
    callback(f);
    f.save();
  }
}

const _ = require('yargs')
  .command('add <title> <description>', 'Add a new feature', {}, (argv) => {
    editAllProducts((f) => {
      f.set(argv.title, argv.description);
    })
  })
  .command('remove <title>', 'remove a feature by title (case sensitive)', {}, (argv) => {
    editAllProducts((f) => {
      f.unset(argv.title);
    })
  })
  .demandCommand()
  .help()
  .wrap(72)
  .argv;
