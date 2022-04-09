/* eslint-disable */
const fs = require('fs');
const path = require('path');

if(process.argv.length !== 4 && process.argv.length !== 5) {
  console.log('Usage: node generate-env-definition.js <inputFile> <outputFile> [prefix]');
  return;
}
const defaultFile = require(path.resolve(process.argv[2]));

function generateEnvPath(object, path) {
  for(const key of Object.keys(object)) {
    const subPath = path.length > 0 ? path + '_' + key.toUpperCase() : key.toUpperCase();
    if(typeof object[key] !== 'object' || object[key] == null) {
      if(typeof object[key] === 'boolean') {
        object[key] = {
          __name: subPath,
          __format: "boolean"
        }
      } else {
        object[key] = subPath;
      }
    } else {
      generateEnvPath(object[key], subPath);
    }
  }
}

generateEnvPath(defaultFile, process.argv.length === 5 ? process.argv[4] : '');
fs.writeFileSync(path.resolve(process.argv[3]), JSON.stringify(defaultFile, null, 2));
