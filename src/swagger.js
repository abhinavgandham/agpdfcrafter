const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Load the single swagger.yaml file
const loadSwaggerDocument = () => {
    const swaggerPath = path.join(__dirname, './docs/swagger.yaml');
    const fileContents = fs.readFileSync(swaggerPath, 'utf8');
    const doc = yaml.load(fileContents);
    return doc
  };

  module.exports = loadSwaggerDocument;