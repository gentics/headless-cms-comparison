#!/usr/bin/env node

const editJsonFile = require("edit-json-file");
const fg = require('fast-glob');
const path = require('path');

const BLACKLIST = [
  'package.json',
  'package-lock.json'
];

const JSON_OPTIONS = {"stringify_width": 4};

function products() {
  return fg.sync(['*.json']).filter(it => !BLACKLIST.includes(it))
}

function fields() {
  return editJsonFile(`${__dirname}/fields.json`, JSON_OPTIONS);
}

function allProducts(callback) {
  const p = products();
  for (const product of p) {
    const f = editJsonFile(`${__dirname}/${product}`, JSON_OPTIONS);
    callback(f);
  }
}

function editAllProducts(callback) {
  allProducts((f) => {
    callback(f);
    f.save();
  })
}

function verify() {
  const fieldsJson = fields();
  const errorMap = {};
  allProducts((f) => {
    const errors = [];
    Object.keys(fieldsJson.data).forEach(featureTitle => {
      if (!Object.keys(f.data).includes(featureTitle)) {
        errors.push(`"${featureTitle}" is missing`);
        return;
      }
      if (typeof f.data[featureTitle] !== 'string') {
        errors.push(`"${featureTitle}" is invalid`);
      }
    });
    if (errors.length !== 0) {
      errorMap[f.path] = errors;
    }
  });

  if (Object.keys(errorMap).length === 0) {
    console.log('Content is valid!');
    return;
  }

  Object.keys(errorMap).forEach(errorPath => {
    console.group(`- ${path.basename(errorPath)}`);
    errorMap[errorPath].forEach(e => console.warn('-', e));
    console.groupEnd();
  });
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
  .command('verify', 'verify that each product has an entry for every feature', {}, verify)
  .demandCommand()
  .help()
  .wrap(72)
  .argv;
